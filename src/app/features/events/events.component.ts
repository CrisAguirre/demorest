import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-events',
  template: `
    <div class="page-header">
      <h1>📅 Eventos y Catering</h1>
      <button class="btn btn-primary" (click)="openForm()">+ Nuevo</button>
    </div>

    <div class="tabs-inline" style="margin-bottom:1rem">
      <button class="tab-btn" [class.active]="vista === 'evento'" (click)="vista = 'evento'">
        🎉 Evento ({{ contar('evento_local') }})
      </button>
      <button class="tab-btn" [class.active]="vista === 'catering'" (click)="vista = 'catering'">
        🍱 Catering ({{ contar('catering_externo') }})
      </button>
    </div>

    <div class="notion-cal">
      <div class="cal-header">
        <h2 class="cal-title">{{ nombreMes() }}</h2>
        <button class="cal-nav" (click)="mesAnterior()" title="Mes anterior">‹</button>
        <button class="cal-nav" (click)="mesSiguiente()" title="Mes siguiente">›</button>
        <button class="cal-today" (click)="mesActual()">Hoy</button>
      </div>
      <div class="cal-grid cal-weekdays">
        <div *ngFor="let d of ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']">{{ d }}</div>
      </div>
      <div class="cal-grid cal-days">
        <div *ngFor="let dia of diasCalendario"
             class="cal-day"
             [class.other-month]="!dia.inMonth"
             [class.today]="dia.key === hoyKey"
             [class.has-events]="dia.eventos.length > 0"
             (click)="abrirDia(dia)">
          <div class="cal-daynum" [class.today-badge]="dia.key === hoyKey">{{ dia.num }}</div>
          <div class="cal-events">
            <div *ngFor="let ev of dia.eventos.slice(0, 3)"
                 class="cal-chip"
                 [ngClass]="'chip-' + ev.status"
                 title="{{ ev.customerName }} — {{ estadoLabel(ev.status) }}">
              <span class="chip-time">{{ horaCorta(ev.eventDate) }}</span>
              <span class="chip-name">{{ ev.customerName }}</span>
            </div>
            <div *ngIf="dia.eventos.length > 3" class="cal-more">+{{ dia.eventos.length - 3 }} más</div>
          </div>
        </div>
      </div>
      <div *ngIf="eventosFiltrados.length === 0" class="cal-empty">
        No hay {{ vista === 'evento' ? 'eventos' : 'caterings' }} registrados
      </div>
    </div>

    <!-- Panel lateral detalle del día (estilo Notion) -->
    <div class="peek-overlay" *ngIf="showDay" (click)="cerrarDia()">
      <div class="peek-panel" (click)="$event.stopPropagation()">
        <div class="peek-header">
          <div>
            <div class="peek-title">{{ tituloDia() }}</div>
            <div class="peek-subtitle">{{ eventosDia.length }} {{ eventosDia.length === 1 ? 'elemento' : 'elementos' }}</div>
          </div>
          <button class="close-btn" (click)="cerrarDia()">✕</button>
        </div>
        <div class="peek-list">
          <div *ngFor="let ev of eventosDia" class="peek-page">
            <div class="peek-page-title">{{ ev.theme || ev.customerName }}</div>
            <div *ngIf="ev.theme" class="peek-page-sub">{{ ev.customerName }}</div>
            <div class="peek-props">
              <div class="peek-prop">
                <span class="prop-icon">🕐</span><span class="prop-label">Hora</span>
                <span class="prop-value">{{ horaCorta(ev.eventDate) }}{{ ev.endDate ? ' → ' + horaCorta(ev.endDate) : '' }}</span>
              </div>
              <div class="peek-prop">
                <span class="prop-icon">📌</span><span class="prop-label">Estado</span>
                <span class="prop-pill" [ngClass]="'pill-' + ev.status">{{ estadoLabel(ev.status) }}</span>
              </div>
              <div class="peek-prop">
                <span class="prop-icon">👥</span><span class="prop-label">Asistentes</span>
                <span class="prop-value">{{ ev.numberOfAttendees || 0 }}</span>
              </div>
              <div class="peek-prop" *ngIf="ev.customerPhone">
                <span class="prop-icon">📞</span><span class="prop-label">Teléfono</span>
                <span class="prop-value">{{ ev.customerPhone }}</span>
              </div>
              <div class="peek-prop" *ngIf="ev.customerEmail">
                <span class="prop-icon">✉️</span><span class="prop-label">Correo</span>
                <span class="prop-value">{{ ev.customerEmail }}</span>
              </div>
              <div class="peek-prop">
                <span class="prop-icon">💰</span><span class="prop-label">Costo</span>
                <span class="prop-value">\${{ (ev.totalCost || 0).toLocaleString('es-CO') }}</span>
              </div>
              <div class="peek-prop">
                <span class="prop-icon">💵</span><span class="prop-label">Abonado</span>
                <span class="prop-value">\${{ getTotalPaid(ev).toLocaleString('es-CO') }} <span class="prop-muted">/ resta \${{ ((ev.totalCost || 0) - getTotalPaid(ev)).toLocaleString('es-CO') }}</span></span>
              </div>
            </div>
            <div class="peek-body" *ngIf="ev.kitchenMenu || ev.barMenu || ev.otherMenu || ev.serviceNotes || ev.notes">
              <div *ngIf="ev.kitchenMenu" class="peek-block"><div class="block-label">🍲 Menú cocina</div><div class="block-text">{{ ev.kitchenMenu }}</div></div>
              <div *ngIf="ev.barMenu" class="peek-block"><div class="block-label">🍹 Menú bar</div><div class="block-text">{{ ev.barMenu }}</div></div>
              <div *ngIf="ev.otherMenu" class="peek-block"><div class="block-label">🍽️ Otros</div><div class="block-text">{{ ev.otherMenu }}</div></div>
              <div *ngIf="ev.serviceNotes" class="peek-block"><div class="block-label">📋 Consideraciones del servicio</div><div class="block-text">{{ ev.serviceNotes }}</div></div>
              <div *ngIf="ev.notes" class="peek-block"><div class="block-label">📝 Notas</div><div class="block-text">{{ ev.notes }}</div></div>
            </div>
            <div class="peek-actions">
              <button class="peek-btn" (click)="addPayment(ev)">💰 Abonar</button>
              <button class="peek-btn" (click)="cerrarDia(); openForm(ev)">✏️ Editar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Formulario -->
    <div class="modal-overlay" *ngIf="showForm">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>{{ editingId ? 'Editar' : 'Nuevo' }} {{ vista === 'evento' ? 'Evento' : 'Catering' }}</h2>
          <button class="close-btn" (click)="closeForm()">✕</button>
        </div>
        <form (ngSubmit)="saveEvent()" #formCtrl="ngForm">
          <div class="form-group">
            <label>Nombre del Cliente *</label>
            <input type="text" class="input-field" name="customerName" [(ngModel)]="form.customerName" required>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Correo electrónico</label>
              <input type="email" class="input-field" name="customerEmail" [(ngModel)]="form.customerEmail" placeholder="cliente@correo.com">
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input type="text" class="input-field" name="customerPhone" [(ngModel)]="form.customerPhone">
            </div>
          </div>
          <div class="form-section">🕐 Inicio</div>
          <div class="prop-row">
            <span class="prop-icon">📅</span>
            <input type="datetime-local" class="input-field prop-input" name="eventDate" [(ngModel)]="form.eventDate" required>
          </div>
          <div class="form-section">🏁 Fin</div>
          <div class="prop-row">
            <span class="prop-icon">📅</span>
            <input type="datetime-local" class="input-field prop-input" name="endDate" [(ngModel)]="form.endDate">
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label>Tema del evento</label>
              <input type="text" class="input-field" name="theme" [(ngModel)]="form.theme" placeholder="Ej. Cumpleaños, Grado">
            </div>
            <div class="form-group">
              <label>Número de Asistentes</label>
              <input type="number" class="input-field" name="numberOfAttendees" [(ngModel)]="form.numberOfAttendees">
            </div>
          </div>
          <div class="form-group" *ngIf="editingId">
            <label>Costo Total ($)</label>
            <input type="number" class="input-field" name="totalCost" [(ngModel)]="form.totalCost">
          </div>
          <div class="form-section">🍽️ Menú</div>
          <div class="form-group">
            <label>Cocina</label>
            <textarea class="input-field" name="kitchenMenu" [(ngModel)]="form.kitchenMenu" rows="2"></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Bebidas</label>
              <textarea class="input-field" name="barMenu" [(ngModel)]="form.barMenu" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Otros</label>
              <textarea class="input-field" name="otherMenu" [(ngModel)]="form.otherMenu" rows="2"></textarea>
            </div>
          </div>
          <div class="form-section">📋 Servicio</div>
          <div class="form-group">
            <label>Consideraciones del servicio</label>
            <textarea class="input-field" name="serviceNotes" [(ngModel)]="form.serviceNotes" rows="2" placeholder="Ej. montaje, horarios, alergias, personal"></textarea>
          </div>
          <div class="form-group">
            <label>Anotaciones adicionales</label>
            <textarea class="input-field" name="notes" [(ngModel)]="form.notes" rows="2"></textarea>
          </div>
          
          <div class="modal-actions" style="justify-content: flex-end; margin-top: 1rem;">
            <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="!formCtrl.form.valid || saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .status-select {
      background: var(--bg-input); color: var(--text-main);
      border: 1px solid var(--border); border-radius: 6px; padding: 0.3rem 0.5rem;
      font-size: 0.8rem; cursor: pointer; outline: none;
    }
    .status-select:focus { border-color: var(--brand-gold); }
    .badge-gold { background: rgba(212,175,55,0.15); color: #d4af37; border: 1px solid rgba(212,175,55,0.3); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    /* Modal formulario: encaja en pantalla con desplazamiento interno */
    .modal-content {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;
      width: 100%; max-width: 640px; max-height: 88vh;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
    }
    .modal-header h2 { margin: 0; font-size: 1.1rem; }
    .modal-content form { overflow-y: auto; padding: 1.25rem; }
    .close-btn {
      background: none; border: 1px solid var(--border); border-radius: 8px;
      padding: 0.35rem 0.65rem; cursor: pointer; color: var(--text-muted);
      font-size: 0.9rem; flex-shrink: 0; transition: all 0.2s;
    }
    .close-btn:hover { border-color: #e74c3c; color: #e74c3c; }
    .form-section {
      font-size: 0.75rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--text-muted); margin: 1rem 0 0.4rem;
      border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;
    }
    .prop-row { display: flex; align-items: center; gap: 0.6rem; }
    .prop-row .prop-icon { width: 22px; text-align: center; flex-shrink: 0; }
    .prop-row .prop-input { flex: 1; }
    .tabs-inline { display: inline-flex; gap: 0.5rem; }
    .tab-btn {
      padding: 0.45rem 1.1rem; border-radius: 20px; border: 1px solid var(--border);
      background: var(--bg-input); color: var(--text-main);
      font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.15s;
    }
    .tab-btn.active { background: var(--brand-gold); color: #fff; border-color: var(--brand-gold); }
    /* Calendario estilo Notion Calendar */
    .notion-cal { background: transparent; }
    .cal-header { display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.5rem; }
    .cal-title { flex: 1; margin: 0; font-size: 1.1rem; font-weight: 600; text-transform: capitalize; color: var(--text-main); }
    .cal-nav {
      border: none; background: none; color: var(--text-muted);
      font-size: 1.3rem; line-height: 1; cursor: pointer; padding: 0.2rem 0.55rem; border-radius: 6px;
    }
    .cal-nav:hover { background: rgba(0, 0, 0, 0.05); color: var(--text-main); }
    .cal-today {
      border: 1px solid var(--border); background: none; color: var(--text-main);
      font-size: 0.8rem; cursor: pointer; padding: 0.25rem 0.7rem; border-radius: 6px;
    }
    .cal-today:hover { background: rgba(0, 0, 0, 0.05); }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .cal-weekdays { border-bottom: 1px solid var(--border); }
    .cal-weekdays > div {
      text-align: right; font-size: 0.7rem; font-weight: 500; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.04em; padding: 0.3rem 0.5rem 0.3rem 0;
    }
    .cal-days { border-left: 1px solid var(--border); border-top: 1px solid var(--border); }
    .cal-day {
      min-height: 104px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);
      background: transparent; padding: 0.3rem 0.35rem; cursor: pointer; overflow: hidden;
    }
    .cal-day:hover { background: rgba(0, 0, 0, 0.03); }
    .cal-day.other-month { background: rgba(0, 0, 0, 0.015); }
    .cal-day.other-month .cal-daynum { color: #c9c9c9; }
    .cal-day.today { background: rgba(212, 175, 55, 0.05); }
    .cal-day.has-events { background: transparent; }
    .cal-daynum { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.2rem; text-align: right; }
    .today-badge {
      display: inline-block; background: #eb5757; color: #fff !important; font-weight: 700;
      border-radius: 4px; padding: 1px 7px;
    }
    .cal-events { display: flex; flex-direction: column; gap: 2px; }
    .cal-chip {
      font-size: 0.7rem; border-radius: 3px; padding: 1px 5px; cursor: pointer;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      display: flex; gap: 4px; align-items: center; line-height: 1.5;
    }
    .chip-pendiente { background: #fbf3db; color: #8a6d00; }
    .chip-confirmado { background: #e3f0fc; color: #2b6cb0; }
    .chip-realizado { background: #dbf3e5; color: #276749; }
    .chip-cancelado { background: #f1f1f1; color: #a0aec0; text-decoration: line-through; }
    .chip-time { font-weight: 600; flex-shrink: 0; font-size: 0.65rem; opacity: 0.8; }
    .chip-name { overflow: hidden; text-overflow: ellipsis; }
    .cal-more { font-size: 0.68rem; color: var(--text-muted); padding-left: 5px; }
    .cal-empty { text-align: center; padding: 2rem; color: var(--text-muted); }
    /* Panel lateral estilo Notion (side peek) */
    .peek-overlay {
      position: fixed; inset: 0; background: rgba(15, 15, 15, 0.35);
      z-index: 1000; display: flex; justify-content: flex-end;
      animation: peek-fade 0.18s ease;
    }
    .peek-panel {
      width: 460px; max-width: 94vw; height: 100%;
      background: #fff; color: #37352f;
      box-shadow: -8px 0 30px rgba(0, 0, 0, 0.18);
      display: flex; flex-direction: column;
      animation: peek-slide 0.22s ease;
    }
    .peek-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 1.25rem 1.25rem 0.75rem; border-bottom: 1px solid #eee;
    }
    .peek-title { font-size: 1.05rem; font-weight: 700; text-transform: capitalize; }
    .peek-subtitle { font-size: 0.8rem; color: #9b9b9b; margin-top: 2px; }
    .peek-panel .close-btn { border: none; background: none; font-size: 1rem; cursor: pointer; color: #9b9b9b; padding: 0.25rem 0.5rem; border-radius: 6px; }
    .peek-panel .close-btn:hover { background: rgba(0, 0, 0, 0.06); }
    .peek-list { flex: 1; overflow-y: auto; padding: 0.25rem 1.25rem 1.5rem; }
    .peek-page { padding: 1rem 0; border-bottom: 1px solid #eee; }
    .peek-page:last-child { border-bottom: none; }
    .peek-page-title { font-size: 1.3rem; font-weight: 700; line-height: 1.3; }
    .peek-page-sub { font-size: 0.85rem; color: #9b9b9b; margin-top: 2px; }
    .peek-props { margin-top: 0.75rem; border-top: 1px solid #f1f1f1; }
    .peek-prop {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.4rem 0.25rem; border-bottom: 1px solid #f5f5f5; font-size: 0.875rem;
    }
    .peek-prop:hover { background: rgba(0, 0, 0, 0.02); }
    .prop-icon { width: 22px; text-align: center; flex-shrink: 0; }
    .prop-label { width: 110px; flex-shrink: 0; color: #9b9b9b; }
    .prop-value { flex: 1; }
    .prop-muted { color: #9b9b9b; font-size: 0.8rem; }
    .prop-pill {
      font-size: 0.78rem; font-weight: 600; border-radius: 4px; padding: 1px 8px;
      background: #eee; color: #666;
    }
    .pill-pendiente { background: rgba(255, 200, 0, 0.25); color: #8a6d00; }
    .pill-confirmado { background: rgba(66, 153, 225, 0.18); color: #2b6cb0; }
    .pill-realizado { background: rgba(72, 187, 120, 0.2); color: #276749; }
    .pill-cancelado { background: rgba(160, 174, 192, 0.25); color: #718096; }
    .peek-body { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem; }
    .block-label { font-size: 0.8rem; font-weight: 700; color: #9b9b9b; margin-bottom: 2px; }
    .block-text { font-size: 0.9rem; white-space: pre-wrap; }
    .peek-actions { display: flex; gap: 0.5rem; margin-top: 0.9rem; }
    .peek-btn {
      border: 1px solid #e0e0e0; background: #fff; border-radius: 6px;
      padding: 0.35rem 0.8rem; font-size: 0.82rem; cursor: pointer; color: #37352f;
    }
    .peek-btn:hover { background: rgba(0, 0, 0, 0.04); }
    @keyframes peek-slide { from { transform: translateX(40px); opacity: 0.5; } to { transform: none; opacity: 1; } }
    @keyframes peek-fade { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 560px) { .peek-panel { width: 100vw; max-width: 100vw; } }
    @media (max-width: 768px) {
      .cal-day { min-height: 64px; padding: 0.25rem; }
      .chip-name { display: none; }
    }
  `]
})
export class EventsComponent implements OnInit {
  events: any[] = [];
  vista: 'evento' | 'catering' = 'evento';
  calYear = 0;
  calMonth = 0;
  hoyKey = '';
  showForm = false;
  saving = false;
  editingId: string | null = null;

  form: any = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    eventType: 'evento_local',
    eventDate: '',
    endDate: '',
    theme: '',
    numberOfAttendees: 0,
    kitchenMenu: '',
    barMenu: '',
    otherMenu: '',
    serviceNotes: '',
    totalCost: 0,
    notes: ''
  };
  showDay = false;
  diaKey: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.calYear = hoy.getFullYear();
    this.calMonth = hoy.getMonth();
    this.hoyKey = this.fechaKey(hoy);
    this.load();
  }

  load(): void {
    this.api.getEvents().subscribe({
      next: (res) => this.events = res
    });
  }

  get eventosFiltrados(): any[] {
    const tipo = this.vista === 'evento' ? 'evento_local' : 'catering_externo';
    return this.events.filter(e => e.eventType === tipo);
  }

  contar(tipo: string): number {
    return this.events.filter(e => e.eventType === tipo).length;
  }

  // —— Calendario ————————————————————————————————————————————
  fechaKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  claveEvento(ev: any): string {
    if (!ev.eventDate) return '';
    const d = new Date(ev.eventDate);
    return this.fechaKey(d);
  }

  nombreMes(): string {
    return new Date(this.calYear, this.calMonth, 1)
      .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }

  mesAnterior(): void {
    const d = new Date(this.calYear, this.calMonth - 1, 1);
    this.calYear = d.getFullYear();
    this.calMonth = d.getMonth();
  }

  mesSiguiente(): void {
    const d = new Date(this.calYear, this.calMonth + 1, 1);
    this.calYear = d.getFullYear();
    this.calMonth = d.getMonth();
  }

  mesActual(): void {
    const hoy = new Date();
    this.calYear = hoy.getFullYear();
    this.calMonth = hoy.getMonth();
  }

  get diasCalendario(): any[] {
    // Semana Lun-Dom
    const primero = new Date(this.calYear, this.calMonth, 1);
    const desfase = (primero.getDay() + 6) % 7;
    const inicio = new Date(this.calYear, this.calMonth, 1 - desfase);
    const porDia: Record<string, any[]> = {};
    this.eventosFiltrados.forEach(ev => {
      const k = this.claveEvento(ev);
      if (!k) return;
      (porDia[k] = porDia[k] || []).push(ev);
    });
    Object.values(porDia).forEach(lista =>
      lista.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()));
    const dias: any[] = [];
    for (let i = 0; i < 42; i++) {
      const f = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      const key = this.fechaKey(f);
      dias.push({ date: f, num: f.getDate(), key, inMonth: f.getMonth() === this.calMonth, eventos: porDia[key] || [] });
    }
    return dias;
  }

  estadoLabel(status: string): string {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente', confirmado: 'Confirmado',
      realizado: 'Realizado', cancelado: 'Cancelado'
    };
    return labels[status] || status;
  }

  horaCorta(fecha: any): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  // La creación solo se hace con "+ Nuevo". El clic en un día con eventos
  // abre el detalle; en días vacíos no hace nada.
  abrirDia(dia: any): void {
    if (!dia.eventos || dia.eventos.length === 0) return;
    this.diaKey = dia.key;
    this.showDay = true;
  }

  cerrarDia(): void {
    this.showDay = false;
    this.diaKey = null;
  }

  get eventosDia(): any[] {
    if (!this.diaKey) return [];
    return this.eventosFiltrados.filter(ev => this.claveEvento(ev) === this.diaKey);
  }

  tituloDia(): string {
    if (!this.diaKey) return '';
    const [y, m, d] = this.diaKey.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    const nombre = fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    const n = this.eventosDia.length;
    return `${nombre} · ${n} ${n === 1 ? (this.vista === 'evento' ? 'evento' : 'catering') : (this.vista === 'evento' ? 'eventos' : 'caterings')}`;
  }

  getTotalPaid(ev: any): number {
    if (!ev.payments || ev.payments.length === 0) return 0;
    return ev.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  }

  openForm(ev?: any): void {
    if (ev) {
      this.editingId = ev._id;
      this.form = { ...ev };
      // Format dates for datetime-local
      ['eventDate', 'endDate'].forEach(k => {
        if (this.form[k]) {
          const d = new Date(this.form[k]);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          this.form[k] = d.toISOString().slice(0, 16);
        }
      });
    } else {
      this.editingId = null;
      this.form = {
        customerName: '', customerPhone: '', customerEmail: '',
        eventType: this.vista === 'evento' ? 'evento_local' : 'catering_externo',
        eventDate: '', endDate: '', theme: '',
        numberOfAttendees: 0, kitchenMenu: '', barMenu: '', otherMenu: '', serviceNotes: '',
        totalCost: 0, notes: ''
      };
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  saveEvent(): void {
    this.saving = true;
    const req = this.editingId 
      ? this.api.updateEvent(this.editingId, this.form)
      : this.api.createEvent(this.form);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        this.load();
        Swal.fire('Éxito', 'Evento guardado', 'success');
      },
      error: (err) => {
        this.saving = false;
        Swal.fire('Error', err.error?.message || 'Error al guardar', 'error');
      }
    });
  }

  updateStatus(ev: any, newStatus: string): void {
    this.api.updateEvent(ev._id, { status: newStatus }).subscribe({
      next: () => {
        ev.status = newStatus;
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Estado actualizado', timer: 2000, showConfirmButton: false });
      },
      error: (err) => Swal.fire('Error', err.error?.message, 'error')
    });
  }

  addPayment(ev: any): void {
    const remaining = ev.totalCost - this.getTotalPaid(ev);
    if (remaining <= 0) {
      Swal.fire('Atención', 'El evento ya está pagado en su totalidad', 'info');
      return;
    }

    Swal.fire({
      title: 'Registrar Pago / Abono',
      html: `
        <div style="text-align:left">
          <p>Restante por pagar: <strong>$${remaining}</strong></p>
          <div class="form-group">
            <label>Monto</label>
            <input type="number" id="pay-amount" class="swal2-input" value="${remaining}" style="width:100%; box-sizing:border-box;">
          </div>
          <div class="form-group" style="margin-top:10px">
            <label>Método de Pago</label>
            <select id="pay-method" class="swal2-select" style="width:100%; box-sizing:border-box;">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const amount = parseFloat((document.getElementById('pay-amount') as HTMLInputElement).value);
        const method = (document.getElementById('pay-method') as HTMLSelectElement).value;
        if (!amount || amount <= 0 || amount > remaining) {
          Swal.showValidationMessage('Monto inválido');
          return false;
        }
        return { amount, method };
      }
    }).then((res) => {
      if (res.isConfirmed) {
        this.api.addEventPayment(ev._id, res.value).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Pago registrado (integrado a caja)', 'success');
            this.load();
          },
          error: (err) => Swal.fire('Error', err.error?.message, 'error')
        });
      }
    });
  }
}
