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

    <!-- Modal selector: día con más de un evento -->
    <div class="modal-overlay" *ngIf="showChooser" (click)="cerrarChooser()">
      <div class="modal-content chooser-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>📅 {{ tituloChooser() }}</h2>
          <button class="close-btn" (click)="cerrarChooser()">✕</button>
        </div>
        <div class="chooser-list">
          <p class="chooser-hint">Hay {{ eventosChooser.length }} en este día. ¿Cuál desea ver?</p>
          <button *ngFor="let ev of eventosChooser" class="chooser-item" (click)="abrirBEO(ev)">
            <span class="chooser-time">{{ horaCorta(ev.eventDate) }}{{ ev.endDate ? ' → ' + horaCorta(ev.endDate) : '' }}</span>
            <span class="chooser-name">{{ ev.theme || ev.customerName }}</span>
            <span class="prop-pill" [ngClass]="'pill-' + ev.status">{{ estadoLabel(ev.status) }}</span>
          </button>
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
          <div class="form-section">🕐 Cronograma</div>
          <div class="grid-2">
            <div class="prop-row">
              <span class="prop-icon">🔧</span>
              <input type="datetime-local" class="input-field prop-input" name="setupTime" [(ngModel)]="form.setupTime" title="Montaje">
            </div>
            <div class="prop-row">
              <span class="prop-icon">▶️</span>
              <input type="datetime-local" class="input-field prop-input" name="eventDate" [(ngModel)]="form.eventDate" required title="Inicio">
            </div>
          </div>
          <div class="prop-row" style="margin-top:0.5rem">
            <span class="prop-icon">🏁</span>
            <input type="datetime-local" class="input-field prop-input" name="endDate" [(ngModel)]="form.endDate" title="Fin">
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
          <div class="grid-2">
            <div class="form-group">
              <label>Personal asignado</label>
              <textarea class="input-field" name="staffAssigned" [(ngModel)]="form.staffAssigned" rows="2" placeholder="Ej. 2 meseros, 1 cocinero, capitán"></textarea>
            </div>
            <div class="form-group">
              <label>Montaje y equipos</label>
              <textarea class="input-field" name="rentals" [(ngModel)]="form.rentals" rows="2" placeholder="Ej. carpa, sillas, sonido"></textarea>
            </div>
          </div>
          <div class="form-group">
            <label>⚠️ Alergias y restricciones</label>
            <textarea class="input-field" name="allergies" [(ngModel)]="form.allergies" rows="2" placeholder="Ej. maní, gluten, lactosa"></textarea>
          </div>
          <div class="form-group">
            <label>Consideraciones del servicio</label>
            <textarea class="input-field" name="serviceNotes" [(ngModel)]="form.serviceNotes" rows="2" placeholder="Ej. montaje, horarios, personal"></textarea>
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
    .notion-cal { background: transparent; max-width: 980px; margin: 0 auto; }
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
      min-height: 72px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);
      background: transparent; padding: 0.25rem 0.3rem; cursor: pointer; overflow: hidden;
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
    /* Modal selector de evento */
    .chooser-modal { max-width: 480px; }
    .chooser-list { overflow-y: auto; padding: 1rem 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .chooser-hint { font-size: 0.85rem; color: var(--text-muted); margin: 0 0 0.25rem; }
    .chooser-item {
      display: flex; align-items: center; gap: 0.6rem; text-align: left;
      border: 1px solid var(--border); background: var(--bg-input); border-radius: 10px;
      padding: 0.6rem 0.8rem; cursor: pointer; font-size: 0.85rem; color: var(--text-main);
    }
    .chooser-item:hover { border-color: var(--brand-gold); }
    .chooser-time { font-weight: 800; flex-shrink: 0; }
    .chooser-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .prop-pill {
      font-size: 0.78rem; font-weight: 600; border-radius: 4px; padding: 1px 8px;
      background: #eee; color: #666; flex-shrink: 0;
    }
    .pill-pendiente { background: rgba(255, 200, 0, 0.25); color: #8a6d00; }
    .pill-confirmado { background: rgba(66, 153, 225, 0.18); color: #2b6cb0; }
    .pill-realizado { background: rgba(72, 187, 120, 0.2); color: #276749; }
    .pill-cancelado { background: rgba(160, 174, 192, 0.25); color: #718096; }
    @media (max-width: 768px) {
      .cal-day { min-height: 52px; padding: 0.2rem; }
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
    setupTime: '',
    theme: '',
    numberOfAttendees: 0,
    kitchenMenu: '',
    barMenu: '',
    otherMenu: '',
    staffAssigned: '',
    rentals: '',
    allergies: '',
    serviceNotes: '',
    totalCost: 0,
    notes: ''
  };
  showChooser = false;
  eventosChooser: any[] = [];
  chooserKey = '';

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

  // La creación solo se hace con "+ Nuevo".
  // Clic en día: sin eventos no hace nada; 1 evento abre su BEO;
  // varios piden especificar cuál antes de abrir la BEO.
  abrirDia(dia: any): void {
    const lista = (dia.eventos || []).slice().sort((a: any, b: any) =>
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    if (lista.length === 0) return;
    if (lista.length === 1) {
      this.abrirBEO(lista[0]);
      return;
    }
    this.eventosChooser = lista;
    this.chooserKey = dia.key;
    this.showChooser = true;
  }

  cerrarChooser(): void {
    this.showChooser = false;
    this.eventosChooser = [];
    this.chooserKey = '';
  }

  tituloChooser(): string {
    if (!this.chooserKey) return '';
    const [y, m, d] = this.chooserKey.split('-').map(Number);
    const nombre = new Date(y, m - 1, d)
      .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    return `${nombre} · ${this.eventosChooser.length} para elegir`;
  }

  fechaLarga(fecha: any): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }

  abrirBEO(ev: any): void {
    this.cerrarChooser();
    const pagado = this.getTotalPaid(ev);
    const total = ev.totalCost || 0;
    const resta = total - pagado;
    const porAsistente = ev.numberOfAttendees > 0 ? Math.round(total / ev.numberOfAttendees) : 0;
    const tipo = ev.eventType === 'catering_externo' ? 'CATERING EXTERNO' : 'EVENTO LOCAL';
    const fila = (label: string, valor: string) =>
      valor ? `<tr><td style="padding:5px 8px;color:#555;width:180px;">${label}</td><td style="padding:5px 8px;"><strong>${valor}</strong></td></tr>` : '';
    const bloque = (label: string, valor: string) =>
      valor ? `<div style="margin-top:8px;"><div style="font-size:11px;color:#555;font-weight:bold;">${label}</div><div style="white-space:pre-wrap;">${valor}</div></div>` : '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>BEO — ${ev.customerName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #222; padding: 24px; max-width: 760px; margin: 0 auto; }
    .head { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 14px; }
    .head h1 { font-size: 20px; letter-spacing: 2px; }
    .head .sub { font-size: 11px; color: #555; margin-top: 4px; }
    h2 { font-size: 13px; background: #f0f0f0; padding: 5px 8px; margin: 14px 0 4px; letter-spacing: 1px; }
    table { width: 100%; border-collapse: collapse; }
    .alert { border: 2px solid #c00; border-radius: 6px; padding: 8px; margin-top: 8px; }
    .alert-title { color: #c00; font-weight: bold; font-size: 12px; }
    .sign { display: flex; gap: 40px; margin-top: 36px; }
    .sign div { flex: 1; border-top: 1px solid #000; padding-top: 4px; font-size: 11px; text-align: center; }
    .foot { margin-top: 14px; font-size: 10px; color: #777; text-align: center; }
    .toolbar { text-align: right; margin: 16px 0 4px; }
    .toolbar button { font-size: 16px; padding: 6px 12px; cursor: pointer; }
    @media print { body { padding: 0; } .toolbar { display: none; } }
  </style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()" title="Imprimir">🖨️</button></div>
  <div class="head">
    <h1>📋 BEO — ORDEN DE EVENTO</h1>
    <div class="sub">${tipo} · Estado: ${this.estadoLabel(ev.status)} · Emitida: ${new Date().toLocaleString('es-CO')}</div>
  </div>

  <h2>CLIENTE Y FECHA</h2>
  <table>
    ${fila('Cliente', ev.customerName)}
    ${fila('Teléfono', ev.customerPhone || '')}
    ${fila('Correo', ev.customerEmail || '')}
    ${fila('Tema', ev.theme || '')}
    ${fila('Fecha', this.fechaLarga(ev.eventDate))}
    ${fila('Montaje', ev.setupTime ? this.fechaLarga(ev.setupTime) : '')}
    ${fila('Finalización', ev.endDate ? this.fechaLarga(ev.endDate) : '')}
    ${fila('Asistentes', ev.numberOfAttendees ? String(ev.numberOfAttendees) : '')}
  </table>

  <h2>MENÚ</h2>
  <table>
    ${fila('Cocina', (ev.kitchenMenu || '').replace(/\n/g, '<br>'))}
    ${fila('Bar / Bebidas', (ev.barMenu || '').replace(/\n/g, '<br>'))}
    ${fila('Otros', (ev.otherMenu || '').replace(/\n/g, '<br>'))}
    ${fila('Costo por asistente', porAsistente ? '$' + porAsistente.toLocaleString('es-CO') : '')}
  </table>

  <h2>OPERACIÓN</h2>
  <table>
    ${fila('Personal asignado', (ev.staffAssigned || '').replace(/\n/g, '<br>'))}
    ${fila('Montaje y equipos', (ev.rentals || '').replace(/\n/g, '<br>'))}
    ${fila('Consideraciones', (ev.serviceNotes || '').replace(/\n/g, '<br>'))}
    ${fila('Notas', (ev.notes || '').replace(/\n/g, '<br>'))}
  </table>
  ${ev.allergies ? `<div class="alert"><div class="alert-title">⚠️ ALERGIAS Y RESTRICCIONES</div><div style="white-space:pre-wrap;">${ev.allergies}</div></div>` : ''}

  <h2>VALORES</h2>
  <table>
    ${fila('Total', '$' + total.toLocaleString('es-CO'))}
    ${fila('Abonado', '$' + pagado.toLocaleString('es-CO'))}
    ${fila('Resta', '$' + resta.toLocaleString('es-CO'))}
  </table>

  <div class="sign">
    <div>Firma cliente<br><br>Nombre y cédula</div>
    <div>Firma responsable<br><br>Nombre y cargo</div>
  </div>
  <div class="foot">Sistema La Soupe · BEO generada automáticamente</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
    }
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
      ['eventDate', 'endDate', 'setupTime'].forEach(k => {
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
        eventDate: '', endDate: '', setupTime: '', theme: '',
        numberOfAttendees: 0, kitchenMenu: '', barMenu: '', otherMenu: '',
        staffAssigned: '', rentals: '', allergies: '', serviceNotes: '',
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
