import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Staff } from '../../core/models/interfaces';

@Component({
  selector: 'app-staff',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">👨‍🍳 Personal</h1>
          <p class="page-subtitle">Gestión de empleados y nómina básica</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ Nuevo Empleado</button>
      </div>

      <div class="search-bar">
        <input class="form-input" placeholder="🔍 Buscar empleado..." [(ngModel)]="search" (input)="applySort()" />
      </div>

      <div class="card table-card">
        <div *ngIf="loading" class="loading-state">Cargando personal...</div>
        <div *ngIf="!loading && filteredItems.length === 0" class="empty-state">No hay empleados que coincidan con la búsqueda</div>
        <table *ngIf="!loading && filteredItems.length > 0" class="data-table">
          <thead>
            <tr>
              <th (click)="sort('name')" class="sortable">Nombre</th>
              <th (click)="sort('position')" class="sortable">Cargo</th>
              <th (click)="sort('phone')" class="sortable">Teléfono</th>
              <th (click)="sort('salary')" class="sortable">Salario</th>
              <th (click)="sort('paymentDate')" class="sortable">Próximo Pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems">
              <td><strong>{{ item.name }}</strong></td>
              <td><span class="badge badge-cyan">{{ item.position }}</span></td>
              <td>{{ item.phone || '—' }}</td>
              <td>{{ item.salary | currency }}</td>
              <td>{{ item.paymentDate | date:'mediumDate' || '—' }}</td>
              <td>
                <span class="badge" [class.badge-green]="item.isActive" [class.badge-red]="!item.isActive">
                  {{ item.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-icon" title="Editar" (click)="edit(item)">✏️</button>
                <button class="btn-icon btn-icon-danger" title="Desactivar" (click)="remove(item._id)" *ngIf="item.isActive">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editing ? '✏️ Editar Empleado' : '➕ Nuevo Empleado' }}</h2>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="form.name" />
            </div>
            <div class="form-group">
              <label>Cargo</label>
              <select class="form-input" [(ngModel)]="form.position">
                <option value="Administrador">Administrador</option>
                <option value="Cajero">Cajero</option>
                <option value="Mesero">Mesero</option>
                <option value="Cocinero">Cocinero</option>
                <option value="Ayudante">Ayudante</option>
                <option value="Repartidor">Repartidor</option>
                <option value="Empleado">Otro Empleado</option>
              </select>
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input class="form-input" [(ngModel)]="form.phone" />
            </div>
            <div class="form-group">
              <label>Salario</label>
              <input class="form-input" type="number" [(ngModel)]="form.salary" />
            </div>
            <div class="form-group">
              <label>Fecha de Pago</label>
              <input class="form-input" type="date" [(ngModel)]="form.paymentDate" />
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
    </div>
  `,
  styles: [`
    .search-bar { display:flex; gap:1rem; align-items:center; margin-bottom:1rem; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .full-width { grid-column: 1 / -1; }
    .actions { display:flex; gap:.4rem; }
    .sortable { cursor: pointer; user-select: none; transition: background 0.2s; }
    .sortable:hover { background-color: rgba(0, 229, 255, 0.1); color: var(--text-primary); }
  `]
})
export class StaffComponent implements OnInit {
  items: Staff[] = [];
  filteredItems: Staff[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  search = ''; sortColumn = 'name'; sortAsc = true;

  form: any = {};
  private editingId = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getStaff().subscribe({
      next: (data) => { this.items = data; this.applySort(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applySort() {
    let result = this.items;
    if (this.search) {
      const s = this.search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(s));
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
    this.form = { position: 'Empleado', salary: 0 };
    this.editing = false; this.editingId = ''; this.showForm = true;
  }
  edit(item: Staff) {
    this.form = { ...item };
    if (this.form.paymentDate) {
      this.form.paymentDate = new Date(this.form.paymentDate).toISOString().split('T')[0];
    }
    this.editing = true; this.editingId = item._id; this.showForm = true;
  }
  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.name) return alert('El Nombre es obligatorio');
    this.saving = true;
    const obs = this.editing ? this.api.updateStaffMember(this.editingId, this.form) : this.api.createStaffMember(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: (err) => { this.saving = false; alert('Error al guardar: ' + (err.error?.message || err.message)); }
    });
  }

  remove(id: string) {
    if (!confirm('¿Desactivar este empleado?')) return;
    this.api.deleteStaffMember(id).subscribe({
      next: () => this.load(),
      error: (err) => alert('Error al eliminar: ' + (err.error?.message || err.message))
    });
  }
}
