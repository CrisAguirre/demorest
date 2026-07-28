import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-categories',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">📂 Categorías</h1>
          <p class="page-subtitle">Gestión de categorías de productos</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ Nueva Categoría</button>
      </div>

      <div class="search-bar">
        <input class="form-input" placeholder="🔍 Buscar categoría..." [(ngModel)]="search"
               (input)="applyFilter()" />
      </div>

      <div class="card table-card">
        <div *ngIf="loading" class="loading-state">Cargando categorías...</div>
        <div *ngIf="!loading && filtered.length === 0" class="empty-state">
          No hay categorías registradas
        </div>
        <table *ngIf="!loading && filtered.length > 0" class="data-table">
          <thead>
            <tr>
              <th (click)="sort('icon')" class="sortable">Icono</th>
              <th (click)="sort('name')" class="sortable">Nombre <span *ngIf="sortColumn === 'name'">{{ sortAsc ? '▲' : '▼' }}</span></th>
              <th (click)="sort('order')" class="sortable">Orden <span *ngIf="sortColumn === 'order'">{{ sortAsc ? '▲' : '▼' }}</span></th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of filtered">
              <td class="icon-cell">{{ c.icon || '📦' }}</td>
              <td><strong>{{ c.name }}</strong></td>
              <td>{{ c.order ?? '—' }}</td>
              <td>
                <span class="badge" [class.badge-green]="c.isActive !== false" [class.badge-red]="c.isActive === false">
                  {{ c.isActive !== false ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-icon" title="Editar" (click)="edit(c)">✏️</button>
                <button class="btn-icon btn-icon-danger" title="Eliminar"
                        (click)="remove(c._id)" *ngIf="c.isActive !== false">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editing ? '✏️ Editar Categoría' : '➕ Nueva Categoría' }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="form.name" placeholder="Ej: Bebidas" />
            </div>
            <div class="form-group">
              <label>Código (3 letras) *</label>
              <input class="form-input" [(ngModel)]="form.code" placeholder="Ej: BEB" maxlength="3" style="text-transform:uppercase" />
              <small style="color:#888;font-size:0.8rem">Usado para generar códigos de barras automáticos</small>
            </div>
            <div class="form-group">
              <label>Icono (emoji)</label>
              <input class="form-input" [(ngModel)]="form.icon" placeholder="Ej: 🥤" maxlength="5" />
            </div>
            <div class="form-group">
              <label>Orden</label>
              <input class="form-input" type="number" [(ngModel)]="form.order" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Activa</label>
              <label class="toggle-label" style="padding-top: 0.5rem;">
                <input type="checkbox" [(ngModel)]="form.isActive" [checked]="form.isActive !== false" />
                {{ form.isActive !== false ? 'Sí' : 'No' }}
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Guardar') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-bar { display:flex; gap:1rem; margin-bottom:1rem; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .actions { display:flex; gap:.4rem; }
    .icon-cell { font-size:1.5rem; text-align:center; }
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { background: rgba(0, 229, 255, 0.1); color: var(--text-primary); }
    .toggle-label { display:flex; align-items:center; gap:.4rem; font-size:.85rem; color:var(--text-secondary); cursor:pointer; }
  `]
})
export class CategoriesComponent implements OnInit {
  categories: any[] = [];
  filtered: any[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  search = '';
  sortColumn = 'order'; sortAsc = true;
  form: any = {};
  private editingId = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getCategories().subscribe({
      next: (data: any) => {
        this.categories = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilter() {
    let result = [...this.categories];
    if (this.search) {
      const q = this.search.toLowerCase();
      result = result.filter(c => c.name?.toLowerCase().includes(q));
    }
    this.applySort(result);
  }

  applySort(data?: any[]) {
    const list = data || this.filtered;
    list.sort((a, b) => {
      let valA: any, valB: any;
      if (this.sortColumn === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (this.sortColumn === 'order') {
        valA = a.order ?? 999;
        valB = b.order ?? 999;
      } else {
        valA = a[this.sortColumn] || '';
        valB = b[this.sortColumn] || '';
      }
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
    this.filtered = list;
  }

  openForm() {
    this.form = { name: '', code: '', icon: '', order: 0, isActive: true };
    this.editing = false;
    this.editingId = '';
    this.showForm = true;
  }

  edit(c: any) {
    this.form = { name: c.name, code: c.code || '', icon: c.icon || '', order: c.order ?? 0, isActive: c.isActive !== false };
    this.editing = true;
    this.editingId = c._id;
    this.showForm = true;
  }

  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.name?.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    if (!this.form.code?.trim()) {
      alert('El código de 3 letras es obligatorio');
      return;
    }
    this.form.code = this.form.code.toUpperCase();
    this.saving = true;
    const obs = this.editing
      ? this.api.updateCategory(this.editingId, this.form)
      : this.api.createCategory(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: (err) => {
        this.saving = false;
        alert('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  remove(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    this.api.deleteCategory(id).subscribe({
      next: () => this.load(),
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
    });
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }
    this.applySort();
  }
}
