import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Ingredient } from '../../core/models/interfaces';

@Component({
  selector: 'app-ingredients',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🧅 Ingredientes</h1>
          <p class="page-subtitle">Gestión del inventario de insumos del restaurante</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ Nuevo Ingrediente</button>
      </div>

      <div class="search-bar">
        <input class="form-input" placeholder="🔍 Buscar ingrediente..." [(ngModel)]="search" (input)="applySort()" />
      </div>

      <div class="card table-card">
        <div *ngIf="loading" class="loading-state">Cargando ingredientes...</div>
        <div *ngIf="!loading && filteredItems.length === 0" class="empty-state">No hay ingredientes registrados o que coincidan con la búsqueda</div>
        <table *ngIf="!loading && filteredItems.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Ubicación</th>
              <th>Unidad</th>
              <th>Cantidad actual</th>
              <th>Stock mínimo</th>
              <th>Necesita pedido</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems">
              <td><strong>{{ item.name }}</strong></td>
              <td>{{ item.ubicacion || '—' }}</td>
              <td>{{ item.unit }}</td>
              <td>
                <span class="badge" [ngClass]="{'badge-red': necesitaPedido(item), 'badge-green': !necesitaPedido(item)}">
                  {{ item.stock }}
                </span>
              </td>
              <td>{{ item.minStock }}</td>
              <td>
                <span class="badge" [ngClass]="{'badge-red': necesitaPedido(item), 'badge-green': !necesitaPedido(item)}">
                  {{ necesitaPedido(item) ? 'PEDIR' : 'OK' }}
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
          <h2 class="modal-title">{{ editing ? '✏️ Editar Ingrediente' : '➕ Nuevo Ingrediente' }}</h2>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="form.name" />
            </div>
            <div class="form-group full-width">
              <label>Ubicación</label>
              <input class="form-input" [(ngModel)]="form.ubicacion" placeholder="Ej. Refrigerador 1, Congelador 2" />
            </div>
            <div class="form-group">
              <label>Stock Actual</label>
              <input class="form-input" type="number" [(ngModel)]="form.stock" />
            </div>
            <div class="form-group">
              <label>Stock Mínimo</label>
              <input class="form-input" type="number" [(ngModel)]="form.minStock" />
            </div>
            <div class="form-group">
              <label>Unidad de Medida</label>
              <select class="form-input" [(ngModel)]="form.unit">
                <option value="kg">Kilogramos (kg)</option>
                <option value="gramos">Gramos (g)</option>
                <option value="litros">Litros (L)</option>
                <option value="mililitros">Mililitros (ml)</option>
                <option value="unidades">Unidades</option>
              </select>
            </div>
            <div class="form-group">
              <label>Costo</label>
              <input class="form-input" type="number" [(ngModel)]="form.cost" />
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
    .data-table th { text-transform: none; }
  `]
})
export class IngredientsComponent implements OnInit {
  items: Ingredient[] = [];
  filteredItems: Ingredient[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  search = '';

  form: any = {};
  private editingId = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getIngredients().subscribe({
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
    // Orden fijo alfabético por Producto
    result = [...result].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    this.filteredItems = result;
  }

  necesitaPedido(item: Ingredient): boolean {
    return (item.stock ?? 0) < (item.minStock ?? 0);
  }

  cantidadAPedir(item: Ingredient): number {
    const d = (item.minStock ?? 0) - (item.stock ?? 0);
    return d > 0 ? Math.round(d * 100) / 100 : 0;
  }

  openForm() {
    this.form = { unit: 'unidades', stock: 0, minStock: 5, cost: 0 };
    this.editing = false; this.editingId = ''; this.showForm = true;
  }
  edit(item: Ingredient) {
    this.form = { ...item };
    this.editing = true; this.editingId = item._id; this.showForm = true;
  }
  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.name) return alert('El Nombre es obligatorio');
    this.saving = true;
    const obs = this.editing ? this.api.updateIngredient(this.editingId, this.form) : this.api.createIngredient(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: (err) => { this.saving = false; alert('Error al guardar: ' + (err.error?.message || err.message)); }
    });
  }

  remove(id: string) {
    if (!confirm('¿Desactivar este ingrediente?')) return;
    this.api.deleteIngredient(id).subscribe({
      next: () => this.load(),
      error: (err) => alert('Error al eliminar: ' + (err.error?.message || err.message))
    });
  }
}
