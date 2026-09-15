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

      <!-- MODAL EDICIÓN / CREACIÓN -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="dish-modal" (click)="$event.stopPropagation()">

          <!-- Columna izquierda: foto -->
          <div class="dish-modal-photo">
            <div class="photo-frame">
              <img *ngIf="photoPreview || form.imageUrl"
                   [src]="photoPreview || form.imageUrl"
                   class="photo-img" alt="Foto del plato">
              <div *ngIf="!photoPreview && !form.imageUrl" class="photo-empty">
                <span class="photo-icon">🍽️</span>
                <p>Sin foto</p>
              </div>
            </div>
            <label class="photo-upload-btn">
              <span>📷 {{ (photoPreview || form.imageUrl) ? 'Cambiar foto' : 'Subir foto' }}</span>
              <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                     (change)="onPhotoSelected($event)" style="display:none">
            </label>
            <div class="photo-hint">JPG · PNG · WebP &bull; Máx. 3 MB</div>

            <!-- Disponibilidad (solo edición) -->
            <div class="avail-toggle" *ngIf="editing">
              <label class="toggle-switch">
                <input type="checkbox" [(ngModel)]="form.isAvailable">
                <span class="toggle-track"></span>
              </label>
              <span class="avail-label" [class.active]="form.isAvailable">
                {{ form.isAvailable ? '✅ Disponible' : '❌ No disponible' }}
              </span>
            </div>
          </div>

          <!-- Columna derecha: form -->
          <div class="dish-modal-form">
            <div class="form-header">
              <h2>{{ editing ? '✏️ Editar Plato' : '➕ Nuevo Plato' }}</h2>
              <button class="close-btn" (click)="closeForm()" title="Cerrar">✕</button>
            </div>

            <!-- Sección: Datos generales -->
            <div class="form-section">
              <div class="section-title">📝 Información General</div>
              <div class="field-group">
                <label class="field-label">Nombre del plato *</label>
                <input class="field-input" [(ngModel)]="form.name" placeholder="Ej. Soupe à l'oignon">
              </div>
              <div class="field-row">
                <div class="field-group">
                  <label class="field-label">Categoría</label>
                  <select class="field-input" [(ngModel)]="form.category">
                    <option value="Entradas">🥗 Entradas</option>
                    <option value="Sopas">🥣 Sopas</option>
                    <option value="Platos fuertes">🍲 Platos fuertes</option>
                    <option value="Platos a la carta">🍽️ Platos a la carta</option>
                    <option value="Postres">🍰 Postres</option>
                    <option value="Bebidas">🥤 Bebidas</option>
                    <option value="Cócteles">🍹 Cócteles</option>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Precio de venta</label>
                  <div class="price-input-wrap">
                    <span class="price-prefix">$</span>
                    <input class="field-input price-input" type="number" [(ngModel)]="form.price" min="0">
                  </div>
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">Descripción (menú)</label>
                <textarea class="field-input" rows="2" [(ngModel)]="form.description"
                          placeholder="Breve descripción para la carta..."></textarea>
              </div>
            </div>

            <!-- Sección: Receta / Ingredientes -->
            <div class="form-section">
              <div class="section-title">🧅 Receta e Ingredientes</div>
              <div class="ing-list">
                <div class="ing-card" *ngFor="let ing of form.ingredients; let i = index">
                  <span class="ing-num">{{ i + 1 }}</span>
                  <select class="field-input ing-select" [(ngModel)]="ing.ingredient">
                    <option value="">Seleccionar insumo...</option>
                    <option *ngFor="let opt of availableIngredients" [value]="opt._id">
                      {{ opt.name }} ({{ opt.unit }})
                    </option>
                  </select>
                  <div class="ing-qty-wrap">
                    <input class="field-input ing-qty" type="number" [(ngModel)]="ing.quantity"
                           placeholder="Cant." min="0" step="0.01">
                  </div>
                  <button class="ing-remove" (click)="removeIngredient(i)" title="Quitar">✕</button>
                </div>
                <div *ngIf="form.ingredients?.length === 0" class="ing-empty">
                  Sin ingredientes cargados. Este plato no desconta insumos del inventario.
                </div>
              </div>
              <button class="add-ing-btn" (click)="addIngredient()">
                + Agregar ingrediente
              </button>
            </div>

            <!-- Sección: Preparación -->
            <div class="form-section">
              <div class="section-title" style="cursor:pointer" (click)="showPrep = !showPrep">
                👨‍🍳 Instrucciones de preparación
                <span style="float:right;font-size:0.8rem;color:var(--text-muted)">{{ showPrep ? '▲ Ocultar' : '▼ Mostrar' }}</span>
              </div>
              <textarea *ngIf="showPrep" class="field-input" rows="4" [(ngModel)]="form.preparation"
                        placeholder="Paso 1: ...
Paso 2: ..."></textarea>
            </div>

            <!-- Acciones -->
            <div class="form-actions">
              <button class="action-cancel" (click)="closeForm()">Cancelar</button>
              <button class="action-save" (click)="save()" [disabled]="saving">
                <span *ngIf="!saving">💾 Guardar plato</span>
                <span *ngIf="saving">⏳ Guardando...</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <div class="modal-overlay" *ngIf="showRecipe" (click)="showRecipe = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <!-- Cabecera con foto en modal receta -->
          <div class="dish-photo-header" *ngIf="recipeDish?.imageUrl" style="border-radius:12px 12px 0 0;overflow:hidden;margin-bottom:0.5rem">
            <img [src]="recipeDish!.imageUrl" class="dish-photo-img" style="max-height:180px" alt="Foto del plato">
          </div>
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
    /* ─── Tabla & Búsqueda ─────────────────────────── */
    .search-bar { display:flex; gap:1rem; align-items:center; margin-bottom:1rem; }
    .actions { display:flex; gap:.4rem; }
    .sortable { cursor: pointer; user-select: none; transition: background 0.2s; }
    .sortable:hover { background-color: rgba(0, 229, 255, 0.1); color: var(--text-primary); }

    /* ─── Modal dish (2 columnas) ──────────────────── */
    .dish-modal {
      display: flex; flex-direction: row;
      background: var(--bg-card); border-radius: 16px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
      max-width: 900px; width: 96vw; max-height: 92vh;
      overflow: hidden; position: relative;
    }

    /* Columna foto */
    .dish-modal-photo {
      width: 240px; flex-shrink: 0;
      background: linear-gradient(160deg, #1a1a2e 0%, #16213e 100%);
      display: flex; flex-direction: column; align-items: center;
      padding: 1.5rem 1rem; gap: 0.75rem;
    }
    .photo-frame {
      width: 180px; height: 180px; border-radius: 16px;
      overflow: hidden; background: rgba(255,255,255,0.06);
      border: 2px dashed rgba(212,175,55,0.3);
      display: flex; align-items: center; justify-content: center;
    }
    .photo-img { width:100%; height:100%; object-fit: cover; display: block; }
    .photo-empty { text-align:center; color: rgba(255,255,255,0.4); padding:1rem; }
    .photo-icon { font-size: 2.8rem; display: block; margin-bottom: 0.4rem; }
    .photo-empty p { font-size: 0.72rem; margin: 0; }
    .photo-upload-btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.4);
      color: var(--brand-gold); border-radius: 20px;
      padding: 0.45rem 1rem; font-size: 0.78rem; cursor: pointer;
      transition: all 0.2s;
    }
    .photo-upload-btn:hover { background: rgba(212,175,55,0.3); }
    .photo-hint { font-size: 0.68rem; color: rgba(255,255,255,0.3); text-align: center; }

    /* Toggle disponibilidad */
    .avail-toggle { display: flex; align-items: center; gap: 0.6rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); width: 100%; }
    .toggle-switch { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-track {
      position: absolute; inset: 0; background: #444; border-radius: 24px;
      transition: background 0.3s; cursor: pointer;
    }
    .toggle-track::after {
      content: ''; position: absolute; top: 3px; left: 3px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #fff; transition: transform 0.3s;
    }
    .toggle-switch input:checked + .toggle-track { background: #27ae60; }
    .toggle-switch input:checked + .toggle-track::after { transform: translateX(18px); }
    .avail-label { font-size: 0.78rem; color: rgba(255,255,255,0.5); }
    .avail-label.active { color: #27ae60; }

    /* Columna formulario */
    .dish-modal-form {
      flex: 1; overflow-y: auto; padding: 1.75rem 2rem;
      display: flex; flex-direction: column; gap: 0;
    }
    .form-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.25rem;
    }
    .form-header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .close-btn {
      background: none; border: none; font-size: 1.1rem;
      cursor: pointer; color: var(--text-muted);
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .close-btn:hover { background: var(--bg-input); color: var(--text-primary); }

    /* Secciones */
    .form-section { margin-bottom: 1.4rem; }
    .section-title {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--brand-gold);
      padding-bottom: 0.5rem; border-bottom: 1px solid rgba(212,175,55,0.15);
      margin-bottom: 0.85rem;
    }
    .field-group { margin-bottom: 0.75rem; }
    .field-label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.3rem; }
    .field-input {
      width: 100%; background: var(--bg-input); border: 1px solid var(--bg-input);
      border-radius: 8px; padding: 0.6rem 0.8rem; font-size: 0.85rem;
      color: var(--text-primary); transition: border-color 0.2s; outline: none;
      font-family: inherit;
    }
    .field-input:focus { border-color: var(--brand-gold); }
    textarea.field-input { resize: vertical; min-height: 64px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .price-input-wrap { position: relative; }
    .price-prefix {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      color: var(--brand-gold); font-weight: 700; font-size: 0.9rem;
    }
    .price-input { padding-left: 1.5rem !important; }

    /* Lista de ingredientes */
    .ing-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.6rem; }
    .ing-card {
      display: flex; align-items: center; gap: 0.5rem;
      background: var(--bg-input); border-radius: 10px; padding: 0.5rem 0.6rem;
      border: 1px solid transparent; transition: border-color 0.2s;
    }
    .ing-card:hover { border-color: rgba(212,175,55,0.2); }
    .ing-num {
      font-size: 0.68rem; font-weight: 700; color: var(--brand-gold);
      background: rgba(212,175,55,0.12); border-radius: 50%;
      width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .ing-select { flex: 2; background: transparent; border: none; padding: 0.2rem 0.4rem; }
    .ing-select:focus { box-shadow: none; border-color: transparent; }
    .ing-qty-wrap { flex: 0 0 80px; }
    .ing-qty { padding: 0.25rem 0.5rem !important; text-align: center; }
    .ing-remove {
      background: none; border: none; cursor: pointer;
      color: #e74c3c; font-size: 0.85rem; padding: 0.2rem 0.4rem;
      border-radius: 6px; transition: background 0.15s;
    }
    .ing-remove:hover { background: rgba(231,76,60,0.1); }
    .ing-empty { font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 0.75rem; font-style: italic; }
    .add-ing-btn {
      background: none; border: 1px dashed rgba(212,175,55,0.35);
      color: var(--brand-gold); border-radius: 8px;
      padding: 0.45rem 0.9rem; font-size: 0.8rem; cursor: pointer;
      width: 100%; transition: all 0.2s;
    }
    .add-ing-btn:hover { background: rgba(212,175,55,0.07); border-style: solid; }

    /* Acciones del form */
    .form-actions {
      display: flex; gap: 0.75rem; justify-content: flex-end;
      padding-top: 1rem; border-top: 1px solid var(--bg-input);
      margin-top: auto;
    }
    .action-cancel {
      background: none; border: 1px solid var(--bg-input);
      color: var(--text-secondary); border-radius: 8px;
      padding: 0.6rem 1.2rem; font-size: 0.85rem; cursor: pointer;
      transition: all 0.15s;
    }
    .action-cancel:hover { border-color: var(--text-muted); color: var(--text-primary); }
    .action-save {
      background: var(--brand-gold); color: #000; border: none;
      border-radius: 8px; padding: 0.6rem 1.5rem; font-size: 0.85rem;
      font-weight: 700; cursor: pointer; transition: all 0.15s;
    }
    .action-save:hover { opacity: 0.88; transform: translateY(-1px); }
    .action-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    /* Modal receta */
    .recipe-detail { padding: 0.5rem 0; }
    .recipe-cost-summary { display:flex; gap:2rem; padding:0.75rem; background:var(--bg-input); border-radius:8px; }
    .dish-photo-header {
      position: relative; display: flex; flex-direction: column; align-items: center;
      justify-content: center; background: var(--bg-input);
      border-radius: 12px 12px 0 0; overflow: hidden;
      min-height: 160px; margin: -1.5rem -1.5rem 1rem -1.5rem;
    }
    .dish-photo-img { width: 100%; max-height: 220px; object-fit: cover; display: block; }
    @media (max-width: 680px) {
      .dish-modal { flex-direction: column; max-height: 98vh; }
      .dish-modal-photo { width: 100%; flex-direction: row; flex-wrap: wrap; padding: 1rem; }
      .photo-frame { width: 120px; height: 120px; }
      .field-row { grid-template-columns: 1fr; }
    }
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
  photoFile: File | null = null;
  photoPreview: string | null = null;
  showPrep = false;

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
    this.photoFile = null; this.photoPreview = null;
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
    this.photoFile = null; this.photoPreview = null;
    this.editing = true; this.editingId = item._id; this.showForm = true;
  }

  closeForm() { this.showForm = false; }

  addIngredient() {
    this.form.ingredients.push({ ingredient: '', quantity: 0 });
  }

  removeIngredient(index: number) {
    this.form.ingredients.splice(index, 1);
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;
    this.photoFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => this.photoPreview = e.target.result;
    reader.readAsDataURL(file);
  }

  save() {
    if (!this.form.name) return alert('El Nombre es obligatorio');
    const fd = new FormData();
    fd.append('name', this.form.name);
    fd.append('category', this.form.category);
    fd.append('price', String(this.form.price));
    fd.append('description', this.form.description || '');
    fd.append('preparation', this.form.preparation || '');
    fd.append('isAvailable', String(this.form.isAvailable ?? true));
    const filteredIngredients = (this.form.ingredients || []).filter((i: any) => i.ingredient && i.quantity > 0);
    fd.append('ingredients', JSON.stringify(filteredIngredients));
    if (this.photoFile) fd.append('photo', this.photoFile);

    this.saving = true;
    const obs = this.editing ? this.api.updateDish(this.editingId, fd) : this.api.createDish(fd);
    obs.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: (err: any) => { this.saving = false; alert('Error al guardar: ' + (err.error?.message || err.message)); }
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
