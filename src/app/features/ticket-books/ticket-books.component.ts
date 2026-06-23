import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { TicketBook } from '../../core/models/interfaces';

@Component({
  selector: 'app-ticket-books',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🎟️ Tiqueteras</h1>
          <p class="page-subtitle">Control de tiqueteras prepago (Almuerzos)</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ Vender Tiquetera</button>
      </div>

      <div class="search-bar">
        <input class="form-input" placeholder="🔍 Buscar cliente..." [(ngModel)]="search" (input)="applySort()" />
        <label class="toggle-label">
           <input type="checkbox" [(ngModel)]="showInactive" (change)="load()" />
           Mostrar agotadas
        </label>
      </div>

      <div class="card table-card">
        <div *ngIf="loading" class="loading-state">Cargando tiqueteras...</div>
        <div *ngIf="!loading && filteredItems.length === 0" class="empty-state">No hay tiqueteras que coincidan con la búsqueda</div>
        <table *ngIf="!loading && filteredItems.length > 0" class="data-table">
          <thead>
            <tr>
              <th (click)="sort('customerName')" class="sortable">Cliente</th>
              <th (click)="sort('phone')" class="sortable">Teléfono</th>
              <th (click)="sort('totalMeals')" class="sortable">Progreso</th>
              <th (click)="sort('pricePaid')" class="sortable">Valor Pagado</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems">
              <td><strong>{{ item.customerName }}</strong></td>
              <td>{{ item.phone || '—' }}</td>
              <td>
                <div class="progress-container">
                  <div class="progress-bar" [style.width]="(item.consumedMeals / item.totalMeals) * 100 + '%'"
                       [class.bg-green]="item.consumedMeals < item.totalMeals"
                       [class.bg-red]="item.consumedMeals >= item.totalMeals"></div>
                </div>
                <small>{{ item.consumedMeals }} / {{ item.totalMeals }} Almuerzos</small>
              </td>
              <td>{{ item.pricePaid | currency }}</td>
              <td>
                <span class="badge" [class.badge-green]="item.isActive" [class.badge-red]="!item.isActive">
                  {{ item.isActive ? 'Activa' : 'Agotada' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem" 
                        *ngIf="item.isActive && item.consumedMeals < item.totalMeals"
                        (click)="consume(item)">
                  🍽️ Marcar Consumo
                </button>
                <button class="btn-icon" title="Editar" (click)="edit(item)">✏️</button>
                <button class="btn-icon btn-icon-danger" title="Eliminar/Desactivar" (click)="remove(item._id)" *ngIf="item.isActive">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Vender Tiquetera -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editing ? '✏️ Editar Tiquetera' : '➕ Vender Tiquetera' }}</h2>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nombre del Cliente *</label>
              <input class="form-input" [(ngModel)]="form.customerName" />
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input class="form-input" [(ngModel)]="form.phone" />
            </div>
            <div class="form-group">
              <label>Valor Pagado *</label>
              <input class="form-input" type="number" [(ngModel)]="form.pricePaid" />
            </div>
            <div class="form-group">
              <label>Cantidad de Almuerzos *</label>
              <input class="form-input" type="number" [(ngModel)]="form.totalMeals" />
            </div>
            <div class="form-group" *ngIf="editing">
              <label>Almuerzos Consumidos</label>
              <input class="form-input" type="number" [(ngModel)]="form.consumedMeals" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Consumo -->
      <div class="modal-overlay" *ngIf="showConsumeModal" (click)="showConsumeModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">🍽️ Registrar Consumo</h2>
          <p style="margin-bottom: 1rem">Registrando almuerzo para <strong>{{ selectedTicketBook?.customerName }}</strong>.</p>
          <div class="form-group full-width">
              <label>Notas adicionales (opcional)</label>
              <input class="form-input" [(ngModel)]="consumeNotes" placeholder="Ej: Llevó jugo extra" />
          </div>
          <div class="modal-actions" style="margin-top: 1rem">
            <button class="btn-outline" (click)="showConsumeModal = false">Cancelar</button>
            <button class="btn-primary" (click)="confirmConsume()" [disabled]="saving">
              {{ saving ? 'Registrando...' : 'Confirmar Consumo' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .search-bar { display:flex; gap:1rem; align-items:center; margin-bottom:1rem; }
    .toggle-label { display:flex; align-items:center; gap:.4rem; font-size:.85rem; color:var(--text-secondary); cursor:pointer; white-space:nowrap; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .full-width { grid-column: 1 / -1; }
    .actions { display:flex; gap:.4rem; align-items: center; }
    .sortable { cursor: pointer; user-select: none; transition: background 0.2s; }
    .sortable:hover { background-color: rgba(0, 229, 255, 0.1); color: var(--text-primary); }
    
    .progress-container {
      width: 100%;
      height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 2px;
    }
    .progress-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .bg-green { background: #00e5ff; }
    .bg-red { background: #ff4081; }
  `]
})
export class TicketBooksComponent implements OnInit {
  items: TicketBook[] = [];
  filteredItems: TicketBook[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  search = ''; sortColumn = 'createdAt'; sortAsc = false; showInactive = false;

  form: any = {};
  private editingId = '';

  showConsumeModal = false;
  selectedTicketBook: TicketBook | null = null;
  consumeNotes = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getTicketBooks().subscribe({
      next: (data) => { 
        this.items = data; 
        this.applySort(); 
        this.loading = false; 
      },
      error: () => this.loading = false
    });
  }

  applySort() {
    let result = this.items;
    
    if (!this.showInactive) {
      result = result.filter(i => i.isActive);
    }

    if (this.search) {
      const s = this.search.toLowerCase();
      result = result.filter(i => i.customerName.toLowerCase().includes(s) || (i.phone && i.phone.includes(s)));
    }
    
    result.sort((a: any, b: any) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
    this.filteredItems = result;
  }

  sort(column: string) {
    if (this.sortColumn === column) this.sortAsc = !this.sortAsc;
    else { this.sortColumn = column; this.sortAsc = true; }
    this.applySort();
  }

  openForm() {
    this.form = { totalMeals: 10, consumedMeals: 0, pricePaid: 150000 };
    this.editing = false; this.editingId = ''; this.showForm = true;
  }
  edit(item: TicketBook) {
    this.form = { ...item };
    this.editing = true; this.editingId = item._id; this.showForm = true;
  }
  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.customerName || !this.form.totalMeals) return alert('Datos incompletos');
    this.saving = true;
    const obs = this.editing ? this.api.updateTicketBook(this.editingId, this.form) : this.api.createTicketBook(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: (err) => { this.saving = false; alert('Error al guardar: ' + (err.error?.message || err.message)); }
    });
  }

  consume(item: TicketBook) {
    this.selectedTicketBook = item;
    this.consumeNotes = '';
    this.showConsumeModal = true;
  }

  confirmConsume() {
    if (!this.selectedTicketBook) return;
    this.saving = true;
    this.api.consumeTicketBook(this.selectedTicketBook._id, { notes: this.consumeNotes }).subscribe({
      next: () => {
         this.saving = false;
         this.showConsumeModal = false;
         this.selectedTicketBook = null;
         this.load();
      },
      error: (err) => {
         this.saving = false;
         alert('Error al registrar consumo: ' + (err.error?.message || err.message));
      }
    });
  }

  remove(id: string) {
    if (!confirm('¿Desactivar esta tiquetera?')) return;
    this.api.deleteTicketBook(id).subscribe({
      next: () => this.load(),
      error: (err) => alert('Error al eliminar: ' + (err.error?.message || err.message))
    });
  }
}
