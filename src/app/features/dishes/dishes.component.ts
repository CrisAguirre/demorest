import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Dish } from '../../core/models/interfaces';

@Component({
  selector: 'app-dishes',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🍲 Menú / Platos</h1>
          <p class="page-subtitle">Gestión de la carta del restaurante</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ Nuevo Plato</button>
      </div>

      <div class="search-bar">
        <input class="form-input" placeholder="🔍 Buscar plato..." [(ngModel)]="search" (input)="applySort()" />
        <select class="form-input" [(ngModel)]="categoryFilter" (change)="applySort()">
          <option value="">Todas las categorías</option>
          <option value="Menú ejecutivo">Menú ejecutivo</option>
          <option value="Ejecutivo especial">Ejecutivo especial</option>
          <option value="Especialidades">Especialidades</option>
          <option value="Servicio de tiquetera">Servicio de tiquetera</option>
        </select>
      </div>

      <div class="card table-card">
        <div *ngIf="loading" class="loading-state">Cargando platos...</div>
        <div *ngIf="!loading && filteredItems.length === 0" class="empty-state">No hay platos que coincidan con la búsqueda</div>
        <table *ngIf="!loading && filteredItems.length > 0" class="data-table">
          <thead>
            <tr>
              <th (click)="sort('name')" class="sortable">Nombre</th>
              <th (click)="sort('category')" class="sortable">Categoría</th>
              <th (click)="sort('price')" class="sortable">Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems">
              <td><strong>{{ item.name }}</strong></td>
              <td><span class="badge badge-violet">{{ item.category }}</span></td>
              <td>{{ item.price | currency }}</td>
              <td>
                <span class="badge" [class.badge-green]="item.isAvailable" [class.badge-red]="!item.isAvailable">
                  {{ item.isAvailable ? 'Disponible' : 'No Disponible' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-icon" title="Editar" (click)="edit(item)">✏️</button>
                <button class="btn-icon btn-icon-danger" title="Desactivar" (click)="remove(item._id)" *ngIf="item.isAvailable">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editing ? '✏️ Editar Plato' : '➕ Nuevo Plato' }}</h2>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="form.name" />
            </div>
            <div class="form-group">
              <label>Categoría</label>
              <select class="form-input" [(ngModel)]="form.category">
                <option value="Menú ejecutivo">Menú ejecutivo</option>
                <option value="Ejecutivo especial">Ejecutivo especial</option>
                <option value="Especialidades">Especialidades</option>
                <option value="Servicio de tiquetera">Servicio de tiquetera</option>
              </select>
            </div>
            <div class="form-group">
              <label>Precio</label>
              <input class="form-input" type="number" [(ngModel)]="form.price" />
            </div>
            <div class="form-group full-width">
              <label>Descripción</label>
              <textarea class="form-input" rows="2" [(ngModel)]="form.description"></textarea>
            </div>
            <div class="form-group full-width" *ngIf="editing">
               <label>
                  <input type="checkbox" [(ngModel)]="form.isAvailable"> Disponible para la venta
               </label>
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
export class DishesComponent implements OnInit {
  items: Dish[] = [];
  filteredItems: Dish[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  search = ''; categoryFilter = ''; sortColumn = 'name'; sortAsc = true;

  form: any = {};
  private editingId = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getDishes().subscribe({
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
    if (this.categoryFilter) {
      result = result.filter(i => i.category === this.categoryFilter);
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
    this.form = { category: 'Menú ejecutivo', price: 0, description: '', isAvailable: true };
    this.editing = false; this.editingId = ''; this.showForm = true;
  }
  edit(item: Dish) {
    this.form = { ...item };
    this.editing = true; this.editingId = item._id; this.showForm = true;
  }
  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.name) return alert('El Nombre es obligatorio');
    this.saving = true;
    const obs = this.editing ? this.api.updateDish(this.editingId, this.form) : this.api.createDish(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: (err) => { this.saving = false; alert('Error al guardar: ' + (err.error?.message || err.message)); }
    });
  }

  remove(id: string) {
    if (!confirm('¿Desactivar este plato?')) return;
    this.api.deleteDish(id).subscribe({
      next: () => this.load(),
      error: (err) => alert('Error al eliminar: ' + (err.error?.message || err.message))
    });
  }
}
