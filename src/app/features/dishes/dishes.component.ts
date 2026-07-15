import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Dish, Ingredient } from '../../core/models/interfaces';

@Component({
  selector: 'app-dishes',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🍲 Menú / Platos</h1>
          <p class="page-subtitle">Gestión de la carta del restaurante con recetas</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ Nuevo Plato</button>
      </div>

      <div class="search-bar">
        <input class="form-input" placeholder="🔍 Buscar plato..." [(ngModel)]="search" (input)="applySort()" />
        <select class="form-input" [(ngModel)]="categoryFilter" (change)="applySort()">
          <option value="">Todas las categorías</option>
          <option value="Entradas">Entradas</option>
          <option value="Sopas">Sopas</option>
          <option value="Platos fuertes">Platos fuertes</option>
          <option value="Platos a la carta">Platos a la carta</option>
          <option value="Postres">Postres</option>
          <option value="Bebidas">Bebidas</option>
          <option value="Cócteles">Cócteles</option>
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
              <th>Receta</th>
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
                <span class="badge" [class.badge-green]="item.ingredients.length" [class.badge-red]="!item.ingredients.length">
                  {{ item.ingredients.length ? item.ingredients.length + ' insumos' : 'Sin receta' }}
                </span>
              </td>
              <td>
                <span class="badge" [class.badge-green]="item.isAvailable" [class.badge-red]="!item.isAvailable">
                  {{ item.isAvailable ? 'Disponible' : 'No Disponible' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-icon" title="Editar" (click)="edit(item)">✏️</button>
                <button class="btn-icon" title="Ver receta" (click)="viewRecipe(item)" *ngIf="item.ingredients?.length">📋</button>
                <button class="btn-icon btn-icon-danger" title="Desactivar" (click)="remove(item._id)" *ngIf="item.isAvailable">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editing ? '✏️ Editar Plato' : '➕ Nuevo Plato' }}</h2>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="form.name" />
            </div>
            <div class="form-group">
              <label>Categoría</label>
              <select class="form-input" [(ngModel)]="form.category">
                <option value="Entradas">Entradas</option>
                <option value="Sopas">Sopas</option>
                <option value="Platos fuertes">Platos fuertes</option>
                <option value="Platos a la carta">Platos a la carta</option>
                <option value="Postres">Postres</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Cócteles">Cócteles</option>
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
            <div class="form-group full-width">
              <label>Preparación</label>
              <textarea class="form-input" rows="3" [(ngModel)]="form.preparation" placeholder="Instrucciones de preparación..."></textarea>
            </div>
            <div class="form-group full-width">
              <label>Ingredientes de la receta</label>
              <div class="ingredient-list">
                <div class="ingredient-row" *ngFor="let ing of form.ingredients; let i = index">
                  <select class="form-input" [(ngModel)]="ing.ingredient">
                    <option value="">Seleccionar ingrediente...</option>
                    <option *ngFor="let opt of availableIngredients" [value]="opt._id">{{ opt.name }} ({{ opt.unit }})</option>
                  </select>
                  <input class="form-input ing-qty" type="number" [(ngModel)]="ing.quantity" placeholder="Cant." min="0" step="0.01" />
                  <button class="btn-icon btn-icon-danger" (click)="removeIngredient(i)" title="Quitar">✕</button>
                </div>
              </div>
              <button class="btn-outline btn-sm" (click)="addIngredient()" style="margin-top:0.5rem">+ Agregar ingrediente</button>
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

      <div class="modal-overlay" *ngIf="showRecipe" (click)="showRecipe = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">📋 {{ recipeDish?.name }}</h2>
          <div class="recipe-detail" *ngIf="recipeCost">
            <div class="recipe-cost-summary">
              <div><strong>Precio venta:</strong> {{ recipeCost.salePrice | currency }}</div>
              <div><strong>Costo receta:</strong> {{ recipeCost.recipeCost | currency }}</div>
              <div><strong>Margen:</strong> <span [class.badge-green]="recipeCost.margin >= 40" [class.badge-yellow]="recipeCost.margin >= 20 && recipeCost.margin < 40" [class.badge-red]="recipeCost.margin < 20">{{ recipeCost.margin }}%</span></div>
            </div>
            <table class="data-table" style="margin-top:1rem">
              <thead>
                <tr><th>Ingrediente</th><th>Cant.</th><th>Und</th><th>Costo Und</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let ing of recipeCost.ingredients">
                  <td>{{ ing.name }}</td>
                  <td>{{ ing.quantity }}</td>
                  <td>{{ ing.unit }}</td>
                  <td>{{ ing.costPerUnit | currency }}</td>
                  <td>{{ ing.subtotal | currency }}</td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="recipeDish?.preparation" style="margin-top:1rem">
              <strong>Preparación:</strong>
              <p style="margin-top:0.25rem;white-space:pre-wrap">{{ recipeDish?.preparation }}</p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="showRecipe = false">Cerrar</button>
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
    .ingredient-list { display:flex; flex-direction:column; gap:0.5rem; }
    .ingredient-row { display:flex; gap:0.5rem; align-items:center; }
    .ingredient-row select { flex:2; }
    .ing-qty { flex:0 0 80px; }
    .modal-lg { max-width: 640px; }
    .recipe-detail { padding: 0.5rem 0; }
    .recipe-cost-summary { display:flex; gap:2rem; padding:0.75rem; background:var(--bg-input); border-radius:8px; }
    .btn-sm { font-size:0.8rem; padding:0.3rem 0.75rem; }
  `]
})
export class DishesComponent implements OnInit {
  items: Dish[] = [];
  filteredItems: Dish[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  search = ''; categoryFilter = ''; sortColumn = 'name'; sortAsc = true;
  availableIngredients: Ingredient[] = [];
  showRecipe = false;
  recipeDish: Dish | null = null;
  recipeCost: any = null;

  form: any = {};
  private editingId = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
    this.api.getIngredients({ isActive: true }).subscribe({
      next: (data) => this.availableIngredients = data
    });
  }

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
    this.form = { category: 'Platos fuertes', price: 0, description: '', preparation: '', isAvailable: true, ingredients: [] };
    this.editing = false; this.editingId = ''; this.showForm = true;
  }

  edit(item: Dish) {
    this.form = {
      ...item,
      ingredients: item.ingredients.map(i => ({
        ingredient: typeof i.ingredient === 'string' ? i.ingredient : i.ingredient?._id,
        quantity: i.quantity
      })) || []
    };
    this.editing = true; this.editingId = item._id; this.showForm = true;
  }

  closeForm() { this.showForm = false; }

  addIngredient() {
    this.form.ingredients.push({ ingredient: '', quantity: 0 });
  }

  removeIngredient(index: number) {
    this.form.ingredients.splice(index, 1);
  }

  save() {
    if (!this.form.name) return alert('El Nombre es obligatorio');
    const payload = {
      name: this.form.name,
      category: this.form.category,
      price: this.form.price,
      description: this.form.description,
      preparation: this.form.preparation,
      isAvailable: this.form.isAvailable,
      ingredients: this.form.ingredients.filter((i: any) => i.ingredient && i.quantity > 0)
    };
    this.saving = true;
    const obs = this.editing ? this.api.updateDish(this.editingId, payload) : this.api.createDish(payload);
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

  viewRecipe(dish: Dish) {
    this.recipeDish = dish;
    this.recipeCost = null;
    this.showRecipe = true;
    this.api.getRecipeCost(dish._id).subscribe({
      next: (data) => this.recipeCost = data
    });
  }
}
