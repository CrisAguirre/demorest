import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-events',
  template: `
    <div class="page-header">
      <h1>📅 Eventos y Catering</h1>
      <button class="btn btn-primary" (click)="openForm()">+ Nuevo Evento</button>
    </div>

    <div class="table-responsive neon-card">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Asistentes</th>
            <th>Costo Total</th>
            <th>Abonado</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let ev of events">
            <td>{{ ev.eventDate | date:'mediumDate' }}</td>
            <td>
              <strong>{{ ev.customerName }}</strong><br>
              <small style="color: var(--text-muted)">{{ ev.customerPhone }}</small>
            </td>
            <td>
              <span class="badge" [ngClass]="ev.eventType === 'evento_local' ? 'badge-cyan' : 'badge-gold'">
                {{ ev.eventType === 'evento_local' ? 'Local' : 'Catering' }}
              </span>
            </td>
            <td>{{ ev.numberOfAttendees }}</td>
            <td>\${{ ev.totalCost | number:'1.0-0' }}</td>
            <td>
              \${{ getTotalPaid(ev) | number:'1.0-0' }}
              <br>
              <small [style.color]="(ev.totalCost - getTotalPaid(ev)) === 0 ? '#48bb78' : '#f56565'">
                Resta: \${{ (ev.totalCost - getTotalPaid(ev)) | number:'1.0-0' }}
              </small>
            </td>
            <td>
              <select class="status-select" [ngModel]="ev.status" (ngModelChange)="updateStatus(ev, $event)">
                <option value="pendiente">⏳ Pendiente</option>
                <option value="confirmado">👍 Confirmado</option>
                <option value="realizado">✅ Realizado</option>
                <option value="cancelado">❌ Cancelado</option>
              </select>
            </td>
            <td style="display:flex; gap:0.5rem">
              <button class="icon-btn" title="Abonar" (click)="addPayment(ev)">💰</button>
              <button class="icon-btn" title="Editar" (click)="openForm(ev)">✏️</button>
            </td>
          </tr>
          <tr *ngIf="events.length === 0">
            <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted)">
              No hay eventos registrados
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Formulario -->
    <div class="modal-overlay" *ngIf="showForm">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>{{ editingId ? 'Editar Evento' : 'Nuevo Evento' }}</h2>
          <button class="close-btn" (click)="closeForm()">✕</button>
        </div>
        <form (ngSubmit)="saveEvent()" #formCtrl="ngForm">
          <div class="grid-2">
            <div class="form-group">
              <label>Nombre del Cliente *</label>
              <input type="text" class="input-field" name="customerName" [(ngModel)]="form.customerName" required>
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input type="text" class="input-field" name="customerPhone" [(ngModel)]="form.customerPhone">
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Tipo *</label>
              <select class="input-field" name="eventType" [(ngModel)]="form.eventType" required>
                <option value="evento_local">Evento Local</option>
                <option value="catering_externo">Catering Externo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Fecha y Hora *</label>
              <input type="datetime-local" class="input-field" name="eventDate" [(ngModel)]="form.eventDate" required>
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Número de Asistentes</label>
              <input type="number" class="input-field" name="numberOfAttendees" [(ngModel)]="form.numberOfAttendees">
            </div>
            <div class="form-group">
              <label>Costo Total ($) *</label>
              <input type="number" class="input-field" name="totalCost" [(ngModel)]="form.totalCost" required>
            </div>
          </div>
          <div class="form-group">
            <label>Notas</label>
            <textarea class="input-field" name="notes" [(ngModel)]="form.notes" rows="3"></textarea>
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
  `]
})
export class EventsComponent implements OnInit {
  events: any[] = [];
  showForm = false;
  saving = false;
  editingId: string | null = null;

  form: any = {
    customerName: '',
    customerPhone: '',
    eventType: 'evento_local',
    eventDate: '',
    numberOfAttendees: 0,
    totalCost: 0,
    notes: ''
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getEvents().subscribe({
      next: (res) => this.events = res
    });
  }

  getTotalPaid(ev: any): number {
    if (!ev.payments || ev.payments.length === 0) return 0;
    return ev.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  }

  openForm(ev?: any): void {
    if (ev) {
      this.editingId = ev._id;
      this.form = { ...ev };
      // Format date for datetime-local
      if (this.form.eventDate) {
        const d = new Date(this.form.eventDate);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        this.form.eventDate = d.toISOString().slice(0, 16);
      }
    } else {
      this.editingId = null;
      this.form = {
        customerName: '', customerPhone: '', eventType: 'evento_local',
        eventDate: '', numberOfAttendees: 0, totalCost: 0, notes: ''
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
