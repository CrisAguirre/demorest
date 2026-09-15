import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Purchase, Supplier, Product, Ingredient } from '../../core/models/interfaces';

type PurchaseType = 'product' | 'ingredient';

interface CatalogItem {
  _id: string;
  name: string;
  stock: number;
  cost: number;        // purchasePrice for products, cost for ingredients
  unit: string;
  itemType: PurchaseType;
}

interface CartItem {
  itemId: string;
  itemName: string;
  itemType: PurchaseType;
  unit: string;
  quantity: number;
  unitCost: number;
  stock: number;       // current stock (for post-purchase preview)
  updateCost: boolean;
}

@Component({
  selector: 'app-purchases',
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">🛒 Compras</h1>
          <p class="page-subtitle">Gestión unificada de ingresos de inventario — productos e insumos en una sola orden</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ Nueva Compra</button>
      </div>

      <!-- Filtros -->
      <div class="filter-bar">
        <select class="filter-chip" [(ngModel)]="filterStatus" (change)="load()">
          <option value="">Todos los estados</option>
          <option value="recibida">✅ Recibida</option>
          <option value="pendiente">⏳ Pendiente</option>
          <option value="anulada">❌ Anulada</option>
        </select>
        <div class="date-range">
          <input class="filter-chip" type="date" [(ngModel)]="filterFrom" (change)="load()" title="Desde" />
          <span class="date-sep">→</span>
          <input class="filter-chip" type="date" [(ngModel)]="filterTo" (change)="load()" title="Hasta" />
        </div>
        <button class="filter-chip btn-clear" *ngIf="filterStatus || filterFrom || filterTo" (click)="clearFilters()">✕ Limpiar</button>
      </div>

      <!-- Tabla Historial -->
      <div class="card table-card">
        <div *ngIf="loading" class="state-box">
          <div class="spinner"></div>
          <span>Cargando compras...</span>
        </div>
        <div *ngIf="!loading && purchases.length === 0" class="state-box empty">
          <span style="font-size:2.5rem">🛒</span>
          <p>Sin compras registradas</p>
          <button class="btn-primary" (click)="openForm()">Registrar primera compra</button>
        </div>

        <table *ngIf="!loading && purchases.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Factura</th>
              <th>Ítems</th>
              <th>Tipos</th>
              <th class="num-col">Total</th>
              <th>Pago</th>
              <th>Estado</th>
              <th class="actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of purchases" class="table-row" (click)="viewDetail(p)" style="cursor:pointer">
              <td class="date-col">
                <div class="date-line">{{ p.createdAt | date:'dd MMM' }}</div>
                <div class="date-year">{{ p.createdAt | date:'yyyy' }}</div>
              </td>
              <td><span class="supplier-name">{{ p.supplierName }}</span></td>
              <td class="invoice-col">{{ p.invoiceNumber || '—' }}</td>
              <td><span class="items-badge">{{ p.items.length }}</span></td>
              <td>
                <div class="type-pills">
                  <span class="type-pill prod" *ngIf="hasProducts(p)">📦 Prod.</span>
                  <span class="type-pill ing" *ngIf="hasIngredients(p)">🧅 Ins.</span>
                </div>
              </td>
              <td class="amount-col">{{ p.total | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
              <td class="payment-col">{{ paymentLabel(p.paymentMethod) }}</td>
              <td (click)="$event.stopPropagation()">
                <span class="badge"
                  [class.badge-success]="p.status==='recibida'"
                  [class.badge-warning]="p.status==='pendiente'"
                  [class.badge-danger]="p.status==='anulada'">
                  {{ statusLabel(p.status) }}
                </span>
              </td>
              <td class="actions" (click)="$event.stopPropagation()">
                <button class="icon-btn" title="Ver detalle" (click)="viewDetail(p)">👁️</button>
                <button class="icon-btn danger" title="Anular compra y revertir inventario"
                  *ngIf="p.status !== 'anulada'" (click)="annul(p._id)">❌</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Paginación -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button class="page-btn" [disabled]="page === 1" (click)="changePage(page - 1)">‹ Anterior</button>
          <span class="page-info">{{ page }} / {{ totalPages }}</span>
          <button class="page-btn" [disabled]="page === totalPages" (click)="changePage(page + 1)">Siguiente ›</button>
        </div>
      </div>
    </div>

    <!-- ══════════════════ MODAL: Nueva Compra ══════════════════ -->
    <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
      <div class="modal-shell" (click)="$event.stopPropagation()">

        <!-- Modal Header -->
        <div class="modal-head">
          <div>
            <h2 class="modal-h">📦 Nueva Orden de Compra</h2>
            <p class="modal-sub">Al confirmar, el inventario se actualizará automáticamente.</p>
          </div>
          <button class="close-btn" (click)="closeForm()">✕</button>
        </div>

        <!-- Datos generales -->
        <div class="general-grid">
          <div class="field-group">
            <label class="field-label">Proveedor</label>
            <select class="field-input" [(ngModel)]="form.supplierId" (change)="onSupplierChange()">
              <option value="">Sin proveedor específico</option>
              <option *ngFor="let s of suppliers" [value]="s._id">{{ s.name }}</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">N° Factura / Remisión</label>
            <input class="field-input" [(ngModel)]="form.invoiceNumber" placeholder="Ej: FV-2024-001" />
          </div>
          <div class="field-group">
            <label class="field-label">Método de Pago</label>
            <select class="field-input" [(ngModel)]="form.paymentMethod">
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="credito">📋 Crédito</option>
              <option value="mixto">🔀 Mixto</option>
            </select>
          </div>
        </div>

        <!-- Layout Catálogo + Carrito -->
        <div class="order-layout">

          <!-- Catálogo Izquierdo -->
          <div class="catalog-panel">
            <div class="catalog-header">
              <h3 class="panel-title">📋 Catálogo</h3>
              <div class="type-tabs">
                <button class="type-tab" [class.active]="catalogTab === 'product'" (click)="setCatalogTab('product')">📦 Productos</button>
                <button class="type-tab" [class.active]="catalogTab === 'ingredient'" (click)="setCatalogTab('ingredient')">🧅 Insumos</button>
              </div>
            </div>
            <input class="search-input" placeholder="🔍 Buscar en catálogo..." [(ngModel)]="catalogSearch" />
            <div class="catalog-list">
              <div *ngIf="filteredCatalog.length === 0" class="catalog-empty">
                <span style="font-size:1.5rem">🔍</span>
                <p>No se encontraron {{ catalogTab === 'product' ? 'productos' : 'insumos' }}</p>
              </div>
              <div class="catalog-item" *ngFor="let item of filteredCatalog"
                [class.in-cart]="isInCart(item._id, item.itemType)"
                (click)="toggleCartItem(item)">
                <div class="ci-check">
                  <span *ngIf="isInCart(item._id, item.itemType)" class="ci-tick">✓</span>
                </div>
                <div class="ci-body">
                  <div class="ci-name">{{ item.name }}</div>
                  <div class="ci-meta">
                    <span class="ci-stock" [class.low-stock]="item.stock < 5">Stock: {{ item.stock }} {{ item.unit }}</span>
                    <span class="ci-price">{{ item.cost | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Carrito Derecho -->
          <div class="cart-panel">
            <div class="cart-header">
              <h3 class="panel-title">🛒 Carrito <span class="cart-count" *ngIf="cart.length > 0">{{ cart.length }}</span></h3>
            </div>

            <div *ngIf="cart.length === 0" class="cart-empty">
              <span style="font-size:2rem">🛒</span>
              <p>Selecciona ítems del catálogo</p>
            </div>

            <div class="cart-list" *ngIf="cart.length > 0">
              <div class="cart-item" *ngFor="let item of cart; let i = index">
                <div class="ci-row-top">
                  <span class="type-dot" [class.dot-product]="item.itemType==='product'" [class.dot-ingredient]="item.itemType==='ingredient'">
                    {{ item.itemType === 'product' ? '📦' : '🧅' }}
                  </span>
                  <span class="ci-item-name">{{ item.itemName }}</span>
                  <button class="rm-btn" (click)="removeFromCart(i)" title="Quitar">✕</button>
                </div>
                <div class="ci-row-controls">
                  <div class="ci-ctrl">
                    <label>Cantidad</label>
                    <div class="qty-wrap">
                      <button class="qty-btn" (click)="item.quantity = max(0.5, item.quantity - 1)">−</button>
                      <input class="qty-input" type="number" min="0.001" step="0.5" [(ngModel)]="item.quantity" />
                      <button class="qty-btn" (click)="item.quantity = item.quantity + 1">+</button>
                    </div>
                    <span class="ci-unit">{{ item.unit }}</span>
                  </div>
                  <div class="ci-ctrl">
                    <label>Costo Unit.</label>
                    <div class="price-wrap">
                      <span class="price-sym">$</span>
                      <input class="price-input" type="number" min="0" [(ngModel)]="item.unitCost" />
                    </div>
                  </div>
                  <div class="ci-ctrl subtotal">
                    <label>Subtotal</label>
                    <div class="subtotal-val">{{ (item.quantity * item.unitCost) | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
                  </div>
                </div>
                <div class="ci-row-opts">
                  <label class="toggle-label">
                    <input type="checkbox" [(ngModel)]="item.updateCost" />
                    Actualizar costo en catálogo
                  </label>
                  <span class="stock-after">→ Stock post-compra: <strong>{{ (item.stock + item.quantity) | number:'1.1-2' }} {{ item.unit }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Footer carrito -->
            <div class="cart-footer" *ngIf="cart.length > 0">
              <div class="cart-summary">
                <div class="summary-row">
                  <span>Ítems:</span>
                  <strong>{{ cart.length }}</strong>
                </div>
                <div class="summary-row total-row">
                  <span>Total Orden:</span>
                  <strong class="total-amount">{{ orderTotal | currency:'COP':'symbol-narrow':'1.0-0' }}</strong>
                </div>
              </div>
              <div class="field-group" style="margin-top:.75rem">
                <label class="field-label">Notas (opcional)</label>
                <textarea class="field-input" [(ngModel)]="form.notes" rows="2" placeholder="Observaciones..."></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones Modal -->
        <div class="modal-actions">
          <button class="btn-secondary" (click)="closeForm()">Cancelar</button>
          <button class="btn-primary" (click)="save()" [disabled]="saving || cart.length === 0">
            <span *ngIf="!saving">✅ Confirmar Compra</span>
            <span *ngIf="saving" class="loading-text">⏳ Guardando...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════ MODAL: Detalle ══════════════════ -->
    <div class="modal-overlay" *ngIf="showDetail" (click)="showDetail = false">
      <div class="modal-detail" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h2 class="modal-h">📋 Detalle de Compra</h2>
          <button class="close-btn" (click)="showDetail = false">✕</button>
        </div>
        <div *ngIf="selected" class="detail-body">
          <div class="detail-meta-grid">
            <div class="detail-meta-item">
              <span class="dm-label">Proveedor</span>
              <span class="dm-val">{{ selected.supplierName }}</span>
            </div>
            <div class="detail-meta-item">
              <span class="dm-label">Factura</span>
              <span class="dm-val">{{ selected.invoiceNumber || '—' }}</span>
            </div>
            <div class="detail-meta-item">
              <span class="dm-label">Estado</span>
              <span class="badge" [class.badge-success]="selected.status==='recibida'" [class.badge-warning]="selected.status==='pendiente'" [class.badge-danger]="selected.status==='anulada'">
                {{ statusLabel(selected.status) }}
              </span>
            </div>
            <div class="detail-meta-item">
              <span class="dm-label">Pago</span>
              <span class="dm-val">{{ paymentLabel(selected.paymentMethod) }}</span>
            </div>
            <div class="detail-meta-item">
              <span class="dm-label">Fecha</span>
              <span class="dm-val">{{ selected.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="detail-meta-item" *ngIf="selected.notes">
              <span class="dm-label">Notas</span>
              <span class="dm-val">{{ selected.notes }}</span>
            </div>
          </div>

          <table class="detail-table">
            <thead>
              <tr>
                <th>Tipo</th><th>Ítem</th><th>Unidad</th><th>Cantidad</th><th>Costo Unit.</th><th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let it of selected.items">
                <td><span class="type-pill" [class.prod]="it.itemType==='product'" [class.ing]="it.itemType==='ingredient'">{{ it.itemType === 'product' ? '📦 Prod.' : '🧅 Ins.' }}</span></td>
                <td class="item-name-col">{{ it.itemName }}</td>
                <td>{{ it.unit }}</td>
                <td><span class="qty-badge">+{{ it.quantity }}</span></td>
                <td>{{ it.unitCost | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                <td class="sub-col">{{ it.subtotal | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="detail-total">Total: <strong>{{ selected.total | currency:'COP':'symbol-narrow':'1.0-0' }}</strong></div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="showDetail = false">Cerrar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ─── Page ─────────────────────────────────────────── */
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .page-subtitle { font-size:.875rem; color:var(--text-muted); margin-top:.25rem; }

    /* ─── Filtros ───────────────────────────────────────── */
    .filter-bar { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .filter-chip { background:var(--bg-card); border:1px solid var(--border); border-radius:8px; padding:.45rem .75rem; color:var(--text-primary); font-size:.85rem; cursor:pointer; transition:border-color .2s; }
    .filter-chip:hover { border-color:var(--brand-gold); }
    select.filter-chip, input.filter-chip { min-width:140px; }
    .date-range { display:flex; align-items:center; gap:.5rem; }
    .date-sep { color:var(--text-muted); font-size:.8rem; }
    .btn-clear { color:#e74c3c; border-color:rgba(231,76,60,.3); background:rgba(231,76,60,.05); }

    /* ─── Tabla ─────────────────────────────────────────── */
    .card.table-card { background:var(--bg-card); border-radius:12px; border:1px solid var(--border); overflow:hidden; }
    .data-table { width:100%; border-collapse:collapse; font-size:.875rem; }
    .data-table th { padding:.75rem 1rem; text-align:left; font-size:.75rem; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:rgba(0,0,0,.15); border-bottom:1px solid var(--border); }
    .data-table td { padding:.75rem 1rem; border-bottom:1px solid rgba(255,255,255,.04); vertical-align:middle; }
    .table-row:hover td { background:rgba(212,175,55,.04); }
    .table-row:last-child td { border-bottom:none; }
    .date-col .date-line { font-weight:600; font-size:.9rem; }
    .date-col .date-year { font-size:.75rem; color:var(--text-muted); }
    .supplier-name { font-weight:600; }
    .invoice-col { font-size:.8rem; color:var(--text-muted); }
    .items-badge { background:rgba(212,175,55,.15); color:var(--brand-gold); border-radius:20px; padding:.2rem .6rem; font-size:.75rem; font-weight:700; }
    .type-pills { display:flex; gap:.35rem; flex-wrap:wrap; }
    .type-pill { font-size:.72rem; border-radius:20px; padding:.2rem .5rem; font-weight:600; }
    .type-pill.prod { background:rgba(66,153,225,.12); color:#4299e1; }
    .type-pill.ing  { background:rgba(72,187,120,.12); color:#48bb78; }
    .amount-col { font-weight:700; color:var(--brand-gold); }
    .payment-col { font-size:.8rem; color:var(--text-secondary); text-transform:capitalize; }
    .num-col, .actions-col { text-align:right; }
    .actions { display:flex; gap:.35rem; justify-content:flex-end; }
    .icon-btn { background:none; border:1px solid var(--border); border-radius:7px; padding:.3rem .45rem; cursor:pointer; font-size:.85rem; transition:all .2s; }
    .icon-btn:hover { border-color:var(--brand-gold); transform:translateY(-1px); }
    .icon-btn.danger:hover { border-color:#e74c3c; }

    .badge { display:inline-flex; align-items:center; gap:.3rem; padding:.3rem .7rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .badge-success { background:rgba(72,187,120,.15); color:#48bb78; }
    .badge-warning  { background:rgba(255,200,0,.15);  color:#ffc800; }
    .badge-danger   { background:rgba(231,76,60,.15);  color:#e74c3c; }

    /* ─── Estado vacío / cargando ───────────────────────── */
    .state-box { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.75rem; padding:3rem; color:var(--text-muted); }
    .spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--brand-gold); border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* ─── Paginación ────────────────────────────────────── */
    .pagination { display:flex; align-items:center; justify-content:center; gap:1rem; padding:1rem; border-top:1px solid var(--border); }
    .page-btn { background:var(--bg-input); border:1px solid var(--border); border-radius:8px; padding:.4rem .9rem; cursor:pointer; font-size:.85rem; color:var(--text-primary); transition:all .2s; }
    .page-btn:hover:not(:disabled) { border-color:var(--brand-gold); color:var(--brand-gold); }
    .page-btn:disabled { opacity:.4; cursor:not-allowed; }
    .page-info { font-size:.85rem; color:var(--text-muted); }

    /* ─── Modal Shell ───────────────────────────────────── */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:1000; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
    .modal-shell { background:var(--bg-card); border:1px solid rgba(212,175,55,.2); border-radius:16px; width:100%; max-width:1100px; max-height:90vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,.5); }
    .modal-detail { background:var(--bg-card); border:1px solid rgba(212,175,55,.2); border-radius:16px; width:100%; max-width:760px; max-height:85vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,.5); }

    .modal-head { display:flex; justify-content:space-between; align-items:flex-start; padding:1.25rem 1.5rem; border-bottom:1px solid var(--border); flex-shrink:0; }
    .modal-h { font-size:1.2rem; font-weight:700; margin:0; }
    .modal-sub { font-size:.8rem; color:var(--brand-gold); margin:.25rem 0 0; }
    .close-btn { background:none; border:1px solid var(--border); border-radius:8px; padding:.35rem .6rem; cursor:pointer; color:var(--text-muted); transition:all .2s; flex-shrink:0; }
    .close-btn:hover { border-color:#e74c3c; color:#e74c3c; }

    /* ─── General Grid ──────────────────────────────────── */
    .general-grid { display:grid; grid-template-columns:2fr 1fr 1fr; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid var(--border); flex-shrink:0; }
    @media(max-width:768px) { .general-grid { grid-template-columns:1fr; } }
    .field-group { display:flex; flex-direction:column; gap:.35rem; }
    .field-label { font-size:.75rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; }
    .field-input { background:var(--bg-input); border:1px solid var(--border); border-radius:8px; padding:.55rem .75rem; color:var(--text-primary); font-family:inherit; font-size:.875rem; transition:border-color .2s; width:100%; box-sizing:border-box; }
    .field-input:focus { outline:none; border-color:var(--brand-gold); }
    textarea.field-input { resize:vertical; min-height:56px; }

    /* ─── Order Layout ──────────────────────────────────── */
    .order-layout { display:grid; grid-template-columns:1fr 1fr; flex:1; overflow:hidden; }
    @media(max-width:900px) { .order-layout { grid-template-columns:1fr; overflow:auto; } }

    /* ─── Catalog Panel ─────────────────────────────────── */
    .catalog-panel { border-right:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; }
    .catalog-header { padding:1rem 1.25rem .5rem; display:flex; justify-content:space-between; align-items:center; gap:.75rem; flex-wrap:wrap; flex-shrink:0; }
    .panel-title { font-size:1rem; font-weight:700; margin:0; }
    .type-tabs { display:flex; gap:.35rem; }
    .type-tab { background:var(--bg-input); border:1px solid var(--border); border-radius:8px; padding:.35rem .75rem; font-size:.8rem; cursor:pointer; color:var(--text-muted); transition:all .2s; }
    .type-tab.active { background:rgba(212,175,55,.15); border-color:var(--brand-gold); color:var(--brand-gold); font-weight:600; }
    .search-input { margin:.25rem 1.25rem .75rem; background:var(--bg-input); border:1px solid var(--border); border-radius:8px; padding:.5rem .75rem; color:var(--text-primary); font-size:.875rem; }
    .search-input:focus { outline:none; border-color:var(--brand-gold); }
    .catalog-list { flex:1; overflow-y:auto; padding:0 .75rem .75rem; display:flex; flex-direction:column; gap:.4rem; }
    .catalog-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.5rem; color:var(--text-muted); padding:2rem; text-align:center; font-size:.85rem; }
    .catalog-item { display:flex; align-items:center; gap:.75rem; padding:.65rem .75rem; border-radius:10px; border:1px solid var(--border); cursor:pointer; transition:all .2s; background:var(--bg-input); }
    .catalog-item:hover { border-color:var(--brand-gold); transform:translateX(2px); }
    .catalog-item.in-cart { border-color:var(--brand-gold); background:rgba(212,175,55,.06); }
    .ci-check { width:20px; height:20px; border:2px solid var(--border); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s; }
    .catalog-item.in-cart .ci-check { background:var(--brand-gold); border-color:var(--brand-gold); }
    .ci-tick { color:#1a1a1a; font-size:.75rem; font-weight:900; }
    .ci-body { flex:1; min-width:0; }
    .ci-name { font-weight:600; font-size:.875rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ci-meta { display:flex; justify-content:space-between; align-items:center; margin-top:.2rem; }
    .ci-stock { font-size:.75rem; color:var(--text-muted); }
    .ci-stock.low-stock { color:#e74c3c; }
    .ci-price { font-size:.8rem; color:var(--brand-gold); font-weight:600; }

    /* ─── Cart Panel ────────────────────────────────────── */
    .cart-panel { display:flex; flex-direction:column; overflow:hidden; }
    .cart-header { padding:1rem 1.25rem .5rem; flex-shrink:0; }
    .cart-count { display:inline-flex; align-items:center; justify-content:center; background:var(--brand-gold); color:#1a1a1a; border-radius:50%; width:20px; height:20px; font-size:.72rem; font-weight:900; }
    .cart-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.5rem; color:var(--text-muted); padding:3rem 1rem; text-align:center; font-size:.875rem; }
    .cart-list { flex:1; overflow-y:auto; padding:0 1rem .5rem; display:flex; flex-direction:column; gap:.75rem; }

    .cart-item { background:var(--bg-input); border:1px solid var(--border); border-radius:12px; padding:.85rem; }
    .ci-row-top { display:flex; align-items:center; gap:.6rem; margin-bottom:.65rem; }
    .type-dot { font-size:.9rem; flex-shrink:0; }
    .ci-item-name { flex:1; font-weight:600; font-size:.875rem; }
    .rm-btn { background:none; border:none; color:var(--text-muted); cursor:pointer; padding:.15rem .35rem; border-radius:5px; font-size:.85rem; transition:all .2s; }
    .rm-btn:hover { background:rgba(231,76,60,.12); color:#e74c3c; }

    .ci-row-controls { display:flex; gap:.75rem; flex-wrap:wrap; }
    .ci-ctrl { display:flex; flex-direction:column; gap:.3rem; flex:1; min-width:80px; }
    .ci-ctrl label { font-size:.7rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; }
    .qty-wrap { display:flex; align-items:center; }
    .qty-btn { background:var(--bg-card); border:1px solid var(--border); width:26px; height:28px; cursor:pointer; font-size:1rem; color:var(--text-primary); transition:all .2s; }
    .qty-btn:first-child { border-radius:6px 0 0 6px; }
    .qty-btn:last-child { border-radius:0 6px 6px 0; }
    .qty-btn:hover { border-color:var(--brand-gold); color:var(--brand-gold); }
    .qty-input { width:50px; height:28px; border:1px solid var(--border); border-left:none; border-right:none; background:var(--bg-card); color:var(--text-primary); text-align:center; font-size:.85rem; font-family:inherit; }
    .qty-input:focus { outline:none; }
    .ci-unit { font-size:.72rem; color:var(--text-muted); align-self:flex-end; }
    .price-wrap { display:flex; align-items:center; background:var(--bg-card); border:1px solid var(--border); border-radius:6px; overflow:hidden; }
    .price-sym { padding:.2rem .4rem; font-size:.8rem; color:var(--brand-gold); font-weight:700; background:rgba(212,175,55,.08); border-right:1px solid var(--border); }
    .price-input { background:none; border:none; padding:.2rem .4rem; color:var(--text-primary); font-size:.85rem; width:80px; font-family:inherit; }
    .price-input:focus { outline:none; }
    .ci-ctrl.subtotal { align-items:flex-start; }
    .subtotal-val { font-weight:700; color:var(--brand-gold); font-size:.95rem; padding-top:.2rem; font-family:'Outfit',sans-serif; }

    .ci-row-opts { display:flex; justify-content:space-between; align-items:center; margin-top:.65rem; padding-top:.65rem; border-top:1px dashed var(--border); flex-wrap:wrap; gap:.5rem; }
    .toggle-label { display:flex; align-items:center; gap:.4rem; font-size:.75rem; color:var(--text-muted); cursor:pointer; }
    .toggle-label input { accent-color:var(--brand-gold); }
    .stock-after { font-size:.75rem; color:var(--text-muted); }
    .stock-after strong { color:#48bb78; }

    .cart-footer { padding:.75rem 1rem 1rem; border-top:1px solid var(--border); flex-shrink:0; }
    .cart-summary { background:var(--bg-input); border-radius:10px; padding:.75rem 1rem; }
    .summary-row { display:flex; justify-content:space-between; align-items:center; font-size:.875rem; margin-bottom:.35rem; }
    .summary-row:last-child { margin-bottom:0; }
    .total-row { border-top:1px solid var(--border); padding-top:.5rem; margin-top:.5rem; font-size:1rem; }
    .total-amount { color:var(--brand-gold); font-family:'Outfit',sans-serif; font-size:1.1rem; }

    /* ─── Acciones Modal ────────────────────────────────── */
    .modal-actions { display:flex; justify-content:flex-end; gap:.75rem; padding:1rem 1.5rem; border-top:1px solid var(--border); flex-shrink:0; }
    .loading-text { animation:pulse 1s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

    /* ─── Detalle ───────────────────────────────────────── */
    .detail-body { padding:1.25rem 1.5rem; overflow-y:auto; flex:1; }
    .detail-meta-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:.75rem; margin-bottom:1.25rem; }
    .detail-meta-item { background:var(--bg-input); border-radius:10px; padding:.75rem 1rem; display:flex; flex-direction:column; gap:.25rem; }
    .dm-label { font-size:.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600; }
    .dm-val { font-weight:600; font-size:.9rem; }
    .detail-table { width:100%; border-collapse:collapse; font-size:.875rem; margin-bottom:1rem; }
    .detail-table th { padding:.6rem .75rem; font-size:.72rem; text-transform:uppercase; color:var(--text-muted); border-bottom:1px solid var(--border); text-align:left; }
    .detail-table td { padding:.6rem .75rem; border-bottom:1px solid rgba(255,255,255,.04); }
    .item-name-col { font-weight:600; }
    .qty-badge { background:rgba(72,187,120,.15); color:#48bb78; border-radius:20px; padding:.2rem .5rem; font-weight:700; font-size:.8rem; }
    .sub-col { font-weight:700; color:var(--brand-gold); }
    .detail-total { text-align:right; font-size:1rem; border-top:1px solid var(--border); padding-top:.75rem; }
    .detail-total strong { color:var(--brand-gold); font-family:'Outfit',sans-serif; font-size:1.15rem; }
  `]
})
export class PurchasesComponent implements OnInit {
  purchases: Purchase[] = [];
  suppliers: Supplier[] = [];
  allProducts: Product[] = [];
  allIngredients: Ingredient[] = [];
  loading = false;
  saving = false;
  showForm = false;
  showDetail = false;
  selected: Purchase | null = null;

  // Filters
  filterStatus = '';
  filterFrom = '';
  filterTo = '';
  page = 1;
  totalPages = 1;

  // Form state
  form = { supplierId: '', invoiceNumber: '', paymentMethod: 'efectivo', notes: '' };
  cart: CartItem[] = [];

  // Catalog
  catalogTab: PurchaseType = 'product';
  catalogSearch = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getSuppliers({ active: 'true' }).subscribe((s: Supplier[]) => this.suppliers = s);
    this.api.getProducts({ active: 'true', limit: 1000 }).subscribe((d: any) => this.allProducts = d.products || d);
    this.api.getIngredients().subscribe((d: any) => this.allIngredients = Array.isArray(d) ? d : (d.ingredients || []));
    this.load();
  }

  load() {
    this.loading = true;
    const params: any = { page: this.page, limit: 20 };
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterFrom)   params.from   = this.filterFrom;
    if (this.filterTo)     params.to     = this.filterTo;

    this.api.getPurchases(params).subscribe({
      next: (d: any) => {
        this.purchases  = d.purchases;
        this.totalPages = d.pages;
        this.loading    = false;
      },
      error: () => this.loading = false
    });
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterFrom   = '';
    this.filterTo     = '';
    this.page = 1;
    this.load();
  }

  changePage(p: number) { this.page = p; this.load(); }

  openForm() {
    this.form = { supplierId: '', invoiceNumber: '', paymentMethod: 'efectivo', notes: '' };
    this.cart = [];
    this.catalogSearch = '';
    this.catalogTab = 'product';
    this.showForm = true;
  }

  closeForm() { this.showForm = false; }

  onSupplierChange() {
    // Future: filter catalog by supplier if needed
  }

  // ─── Catalog ─────────────────────────────────────────────────────────────

  setCatalogTab(tab: PurchaseType) {
    this.catalogTab   = tab;
    this.catalogSearch = '';
  }

  get filteredCatalog(): CatalogItem[] {
    const term = this.catalogSearch.toLowerCase();
    let items: CatalogItem[];

    if (this.catalogTab === 'product') {
      items = this.allProducts.map(p => ({
        _id:      p._id,
        name:     p.name,
        stock:    p.stock || 0,
        cost:     p.purchasePrice || 0,
        unit:     (p as any).unit || 'unidades',
        itemType: 'product' as PurchaseType
      }));
    } else {
      items = this.allIngredients.map(i => ({
        _id:      i._id,
        name:     i.name,
        stock:    i.stock || 0,
        cost:     i.cost || 0,
        unit:     i.unit || 'unidades',
        itemType: 'ingredient' as PurchaseType
      }));
    }

    return term
      ? items.filter(i => i.name.toLowerCase().includes(term))
      : items;
  }

  isInCart(id: string, type: PurchaseType): boolean {
    return this.cart.some(c => c.itemId === id && c.itemType === type);
  }

  toggleCartItem(item: CatalogItem) {
    const idx = this.cart.findIndex(c => c.itemId === item._id && c.itemType === item.itemType);
    if (idx >= 0) {
      this.cart.splice(idx, 1);
    } else {
      this.cart.push({
        itemId:     item._id,
        itemName:   item.name,
        itemType:   item.itemType,
        unit:       item.unit,
        quantity:   1,
        unitCost:   item.cost,
        stock:      item.stock,
        updateCost: true
      });
    }
  }

  removeFromCart(i: number) { this.cart.splice(i, 1); }

  max(a: number, b: number) { return Math.max(a, b); }

  get orderTotal(): number {
    return this.cart.reduce((s, c) => s + (c.quantity * c.unitCost), 0);
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  save() {
    if (this.cart.length === 0) return;
    this.saving = true;

    const payload = {
      supplierId:    this.form.supplierId || null,
      supplierName:  this.suppliers.find(s => s._id === this.form.supplierId)?.name || 'Sin proveedor',
      invoiceNumber: this.form.invoiceNumber,
      paymentMethod: this.form.paymentMethod,
      notes:         this.form.notes,
      items: this.cart.map(c => ({
        itemType:   c.itemType,
        itemId:     c.itemId,
        quantity:   c.quantity,
        unitCost:   c.unitCost,
        updateCost: c.updateCost
      }))
    };

    this.api.createPurchase(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        // Reload local inventories for next time
        this.api.getProducts({ active: 'true', limit: 1000 }).subscribe((d: any) => this.allProducts = d.products || d);
        this.api.getIngredients().subscribe((d: any) => this.allIngredients = Array.isArray(d) ? d : (d.ingredients || []));
        this.load();
      },
      error: (err) => {
        this.saving = false;
        alert('Error al registrar la compra: ' + (err.error?.message || err.message));
      }
    });
  }

  // ─── Detail & Annul ───────────────────────────────────────────────────────

  viewDetail(p: Purchase) { this.selected = p; this.showDetail = true; }

  annul(id: string) {
    if (!confirm('¿Anular esta compra? Se revertirá el stock de todos los ítems ingresados.')) return;
    this.api.updatePurchaseStatus(id, 'anulada').subscribe({
      next: () => {
        this.api.getProducts({ active: 'true', limit: 1000 }).subscribe((d: any) => this.allProducts = d.products || d);
        this.api.getIngredients().subscribe((d: any) => this.allIngredients = Array.isArray(d) ? d : (d.ingredients || []));
        this.load();
      },
      error: (err) => alert('Error al anular: ' + (err.error?.message || err.message))
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  hasProducts(p: Purchase)     { return p.items.some(i => i.itemType === 'product'); }
  hasIngredients(p: Purchase)  { return p.items.some(i => i.itemType === 'ingredient'); }

  statusLabel(s: string) {
    return { recibida: '✅ Recibida', pendiente: '⏳ Pendiente', anulada: '❌ Anulada' }[s] || s;
  }

  paymentLabel(s: string) {
    return { efectivo: '💵 Efectivo', transferencia: '🏦 Transferencia', credito: '📋 Crédito', mixto: '🔀 Mixto' }[s] || s;
  }
}
