import { Component, OnInit, HostListener } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pos',
  template: `
    <div class="pos-layout">
      <!-- Panel Productos -->
      <div class="pos-products">
        <div class="pos-search" style="display: flex; gap: 0.5rem; align-items: center; position: relative;">
          <input class="form-input" placeholder="🔍 Buscar producto o escanear código..."
                 [(ngModel)]="searchTerm" (input)="filterProducts()" #searchInput style="flex: 1;">

        </div>
        <div class="pos-categories">
          <button class="cat-btn" [class.active]="!selectedCategory" (click)="selectedCategory='';filterProducts()">Todos</button>
          <button class="cat-btn" *ngFor="let c of categories" [class.active]="selectedCategory === c._id"
                  (click)="selectedCategory = c._id; filterProducts()">{{ c.icon }} {{ c.name }}</button>
        </div>
        <div class="product-grid">
          <div class="product-tile neon-card" *ngFor="let p of filteredProducts" (click)="addToCart(p)"
               style="padding:0.75rem;cursor:pointer;animation:none">
            <div class="product-tile-name">{{ p.name }}</div>
            <div class="flex-between">
              <span class="product-tile-price">\${{ p.price | number:'1.0-0' }}</span>
              <span class="badge" [class]="p.isAvailable ? 'badge-green' : 'badge-red'">{{ p.isAvailable ? 'Disp' : 'Agot' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Carrito -->
      <div class="pos-cart neon-card-violet" style="animation:none">
        <h3 style="margin-bottom:1rem">
          🛒 Venta Actual
          <span *ngIf="isTableOccupied()" class="tabs-inline">
            <button class="tab-btn" [class.active]="activeTab === 'venta'" (click)="activeTab = 'venta'">🧾 Venta</button>
            <button class="tab-btn" [class.active]="activeTab === 'agregar'" (click)="activeTab = 'agregar'">➕ Agregar</button>
          </span>
          <span *ngIf="selectedTable === 0" class="badge badge-gold" style="float: right;">🛍️ Para llevar</span>
          <span *ngIf="selectedTable !== null && selectedTable !== 0" class="badge badge-cyan" style="float: right;">Mesa {{ selectedTable }}</span>
        </h3>
        <!-- Venta actual de la mesa ocupada (solo lectura, lista plana + total) -->
        <div class="cart-items" *ngIf="isTableOccupied() && activeTab === 'venta'">
          <div class="cart-item" *ngFor="let item of ventaItems">
            <div class="cart-item-info">
              <span class="cart-item-name">{{ item.productName }}</span>
              <span class="cart-item-price">\${{ item.unitPrice | number:'1.0-0' }} c/u</span>
            </div>
            <div class="cart-item-controls">
              <span class="qty-display">× {{ item.quantity }}</span>
              <span class="cart-item-subtotal">\${{ item.subtotal | number:'1.0-0' }}</span>
            </div>
          </div>
          <div *ngIf="ventaItems.length === 0" style="text-align:center;padding:2rem;color:var(--text-muted)">
            Sin ítems registrados en la venta
          </div>
        </div>
        <!-- Carrito editable: venta nueva o pestaña Agregar -->
        <div class="cart-items" *ngIf="!isTableOccupied() || activeTab === 'agregar'">
          <div *ngIf="isTableOccupied()" class="adicional-hint">➕ Productos nuevos — en la comanda saldrá solo lo nuevo de esta tanda</div>
          <div class="cart-item" *ngFor="let item of cart; let i = index">
            <div class="cart-item-info">
              <span class="cart-item-name">{{ item.productName }}</span>
              <span class="cart-item-price">\${{ item.unitPrice | number:'1.0-0' }} c/u</span>
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn" (click)="changeQty(i, -1)" aria-label="Reducir cantidad">−</button>
              <span class="qty-display">{{ item.quantity }}</span>
              <button class="qty-btn" (click)="changeQty(i, 1)" aria-label="Aumentar cantidad">+</button>
              <span class="cart-item-subtotal">\${{ item.subtotal | number:'1.0-0' }}</span>
              <button class="btn-ghost btn-sm" (click)="removeItem(i)">✕</button>
            </div>
          </div>
          <div *ngIf="cart.length === 0" style="text-align:center;padding:2rem;color:var(--text-muted)">
            {{ isTableOccupied() ? 'Agregue productos nuevos' : 'Agregue productos para empezar' }}
          </div>
        </div>
        <div class="cart-footer">
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <select class="form-input" [(ngModel)]="selectedTable" (ngModelChange)="onTableChange()" style="flex:1">
              <option [ngValue]="null">🪑 Sin mesa</option>
              <option *ngFor="let t of tables" [ngValue]="t.number">
                {{ t.number === 0 ? '🛍️ Para llevar' : 'Mesa ' + t.number }} {{ (t.status === 'ocupada' || t.isOccupied) ? '(Ocupada)' : '' }}
              </option>
            </select>
          </div>
          <div class="cart-total" style="flex-direction: column; align-items: stretch; gap: 0.25rem;">
            <div style="display:flex; justify-content: space-between; align-items: center;" *ngIf="isTableOccupied() && activeTab === 'venta'">
              <span>VENTA ACTUAL</span>
              <span class="total-amount">\${{ ventaTotal | number:'1.0-0' }}</span>
            </div>
            <div *ngIf="isTableOccupied() && activeTab === 'venta' && cart.length > 0" class="pending-hint">
              ⚠️ Tiene {{ cart.length }} producto(s) pendiente(s) en Agregar
            </div>
            <div style="display:flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary);" *ngIf="isTableOccupied() && activeTab === 'agregar'">
              <span>Consumo Actual</span>
              <span>\${{ ventaTotal | number:'1.0-0' }}</span>
            </div>
            <div style="display:flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary);" *ngIf="isTableOccupied() && activeTab === 'agregar' && cart.length > 0">
              <span>Esta tanda</span>
              <span>\${{ total | number:'1.0-0' }}</span>
            </div>
            <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;" *ngIf="isTableOccupied() && activeTab === 'agregar'">
              <span>TOTAL ACUMULADO</span>
              <span class="total-amount">\${{ (ventaTotal + total) | number:'1.0-0' }}</span>
            </div>
            <div style="display:flex; justify-content: space-between; align-items: center;" *ngIf="!isTableOccupied()">
              <span>TOTAL</span>
              <span class="total-amount">\${{ total | number:'1.0-0' }}</span>
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <select class="form-input" [(ngModel)]="paymentMethod" style="flex:1">
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">📱 Transferencia</option>
              <option value="mixto">🔄 Mixto</option>
            </select>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem" *ngIf="isTableOccupied() && activeTab === 'venta'">
            <button class="btn-warning" style="flex:1" (click)="payTableSale()" [disabled]="processing || cart.length > 0" title="Si tiene productos pendientes en Agregar, agréguelos primero">
              💵 Cobrar Cuenta
            </button>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem" *ngIf="isTableOccupied() && activeTab === 'agregar'">
            <button class="btn-danger" style="flex:1" (click)="clearCart()" [disabled]="cart.length === 0">🗑️ Limpiar</button>
            <button class="btn-success" style="flex:2" (click)="finalizeSale()" [disabled]="processing || cart.length === 0">
              {{ processing ? '⏳' : '➕ Agregar y Comandar' }}
            </button>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem" *ngIf="esAperturaMesa">
            <button class="btn-danger" style="flex:1" (click)="clearCart()" [disabled]="cart.length === 0">🗑️ Limpiar</button>
            <button class="btn-success" style="flex:2" (click)="finalizeSale()" [disabled]="processing || cart.length === 0" title="Registra la venta y abre la mesa. La comanda imprime solo esta tanda.">
              {{ processing ? '⏳' : '🖨️ Comandar' }}
            </button>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem" *ngIf="!isTableOccupied() && !esAperturaMesa">
            <button class="btn-danger" style="flex:1" (click)="clearCart()" [disabled]="cart.length === 0">🗑️ Limpiar</button>
            <button class="btn-info" style="flex:1" (click)="printCurrentComanda()" [disabled]="cart.length === 0" title="Ticket de cocina (no registra venta)">🖨️ Comanda</button>
            <button class="btn-success" style="flex:1.5" (click)="finalizeSale()" [disabled]="processing || cart.length === 0">
              {{ processing ? '⏳' : '✅ Cobrar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pos-layout { display: grid; grid-template-columns: 1fr 360px; gap: 1rem; min-height: calc(100vh - 100px); }
    .pos-search { margin-bottom: 0.75rem; }
    .pos-categories {
      display: flex; gap: 0.375rem; flex-wrap: wrap; padding-bottom: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .cat-btn {
      padding: 0.375rem 0.75rem; border-radius: 20px; border: 1px solid var(--bg-input);
      background: #fff; font-size: 0.75rem; white-space: nowrap; cursor: pointer;
      transition: all 0.15s;
    }
    .cat-btn.active { background: var(--brand-gold); color: #fff; border-color: var(--brand-gold); }
    .product-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem;
      max-height: calc(100vh - 240px); overflow-y: auto;
    }
    .product-tile:hover { transform: translateY(-2px); border-color: var(--brand-gold); }
    .product-tile-name { font-size: 0.82rem; font-weight: 600; margin-bottom: 0.375rem; line-height: 1.3; }
    .product-tile-price { font-family: 'Outfit'; font-weight: 700; color: var(--brand-bronze); }
    .pos-cart { display: flex; flex-direction: column; position: sticky; top: 76px; max-height: calc(100vh - 100px); }
    .cart-items { flex: 1; overflow-y: auto; }
    .cart-item {
      padding: 0.6rem 0; border-bottom: 1px solid var(--bg-input);
    }
    .cart-item-info { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
    .cart-item-name { font-size: 0.82rem; font-weight: 600; }
    .cart-item-price { font-size: 0.75rem; color: var(--text-secondary); }
    .cart-item-controls { display: flex; align-items: center; gap: 0.5rem; }
    .qty-btn {
      width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--bg-input);
      background: #fff; font-weight: 700; cursor: pointer; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
    }
    .qty-display { font-weight: 700; min-width: 20px; text-align: center; }
    .cart-item-subtotal { font-family: 'Outfit'; font-weight: 700; margin-left: auto; }
    .cart-total {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 0.75rem; border-top: 2px solid var(--brand-bronze);
      font-weight: 700;
    }
    .total-amount {
      font-family: 'Outfit'; font-size: 1.5rem;
      color: var(--brand-gold);
    }
    .badge-gold { background: rgba(212, 175, 55, 0.2); color: var(--brand-gold); border: 1px solid var(--brand-gold); }
    .tabs-inline { display: inline-flex; gap: 0.25rem; margin-left: 0.5rem; vertical-align: middle; }
    .tab-btn {
      padding: 0.2rem 0.6rem; border-radius: 20px; border: 1px solid var(--bg-input);
      background: #fff; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.15s;
    }
    .tab-btn.active { background: var(--brand-gold); color: #fff; border-color: var(--brand-gold); }
    .adicional-hint {
      font-size: 0.75rem; color: var(--brand-gold); font-weight: 600;
      background: rgba(212, 175, 55, 0.1); border: 1px dashed var(--brand-gold);
      border-radius: 8px; padding: 0.4rem 0.6rem; margin-bottom: 0.5rem; text-align: center;
    }
    .pending-hint {
      font-size: 0.75rem; color: #b26a00; font-weight: 600; text-align: center;
      background: rgba(255, 143, 0, 0.12); border-radius: 8px; padding: 0.4rem 0.6rem;
    }
    @media (max-width: 768px) {
      .pos-layout { grid-template-columns: 1fr; }
      .pos-cart { position: relative; top: 0; }
    }
  `]
})
export class PosComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  cart: any[] = [];
  categories = [
    { _id: 'Entradas', name: 'Entradas', icon: '🥗' },
    { _id: 'Sopas', name: 'Sopas', icon: '🥣' },
    { _id: 'Platos fuertes', name: 'Platos fuertes', icon: '🍲' },
    { _id: 'Platos a la carta', name: 'Platos a la carta', icon: '🍽️' },
    { _id: 'Postres', name: 'Postres', icon: '🍰' },
    { _id: 'Bebidas', name: 'Bebidas', icon: '🥤' },
    { _id: 'Cócteles', name: 'Cócteles', icon: '🍹' }
  ];
  searchTerm = '';
  selectedCategory = '';
  paymentMethod = 'efectivo';
  processing = false;
  tables: any[] = [];
  selectedTable: number | null = null;
  settings: any = null;
  activeTab: 'venta' | 'agregar' = 'venta';
  ventaActual: any = null;

  get total(): number {
    return this.cart.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get ventaTotal(): number {
    return this.ventaActual?.total ?? this.getSelectedTableObj()?.currentSale?.total ?? 0;
  }

  get ventaItems(): any[] {
    const items: any[] = [];
    if (this.ventaActual?.items) {
      this.ventaActual.items.forEach((i: any) => items.push({
        productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice,
        subtotal: i.subtotal
      }));
    }
    if (this.ventaActual?.dishItems) {
      this.ventaActual.dishItems.forEach((i: any) => items.push({
        productName: i.dishName, quantity: i.quantity, unitPrice: i.unitPrice,
        subtotal: i.subtotal
      }));
    }
    return items;
  }

  nombreMesa(n: number | null): string {
    return n === 0 ? 'Para llevar' : n !== null && n !== undefined ? `Mesa ${n}` : 'Mostrador';
  }

  getSelectedTableObj(): any {
    return this.tables.find(t => t.number === this.selectedTable);
  }

  isTableOccupied(): boolean {
    const t = this.getSelectedTableObj();
    return t ? (t.status === 'ocupada' || t.isOccupied) : false;
  }

  // Mesa libre (o Para llevar libre) en post-pago: el primer Comandar abre la venta
  get esAperturaMesa(): boolean {
    return !this.isTableOccupied() && this.settings?.paymentMode === 'post-pago' && this.selectedTable !== null;
  }

  // —— Tandas: cada línea recuerda cuánto ya se comandó (impreso) ————————
  // Cada impresión solo saca lo nuevo (cantidad actual − cantidad impresa).
  // Así ninguna impresión repite un producto ya comandado.
  pendienteQty(item: any): number {
    return item.quantity - (item.impresoQty || 0);
  }

  get pendientesComanda(): any[] {
    return this.cart.filter(i => this.pendienteQty(i) > 0);
  }

  // Convierte líneas del carrito a líneas imprimibles (solo el delta no comandado)
  soloNuevos(items: any[]): any[] {
    return items
      .filter(i => this.pendienteQty(i) > 0)
      .map(i => ({ ...i, quantity: this.pendienteQty(i), subtotal: this.pendienteQty(i) * i.unitPrice }));
  }

  marcarComandado(items: any[]): void {
    items.forEach(i => { i.impresoQty = i.quantity; });
  }

  constructor(
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.api.getDishes().subscribe({
      next: (res: any) => { 
        this.products = res.filter((p: any) => p.isAvailable !== false); 
        this.filteredProducts = [...this.products]; 
      }
    });
    this.api.getTables().subscribe({
      next: (res: any) => { this.tables = res; this.loadVentaActual(); }
    });
    this.api.getSettings().subscribe({
      next: (res: any) => this.settings = res
    });

    this.route.queryParams.subscribe(params => {
      if (params['table'] !== undefined) {
        this.selectedTable = parseInt(params['table'], 10);
        this.onTableChange();
      }
    });
  }

  onTableChange(): void {
    this.activeTab = 'venta';
    this.loadVentaActual();
  }

  loadVentaActual(): void {
    const t = this.getSelectedTableObj();
    const saleRef = t?.currentSale;
    const saleId = saleRef?._id || saleRef;
    if (t && (t.status === 'ocupada' || t.isOccupied) && saleId && typeof saleId === 'string') {
      this.api.getSale(saleId).subscribe({
        next: (res: any) => { this.ventaActual = res; },
        error: () => { this.ventaActual = null; }
      });
    } else {
      this.ventaActual = null;
    }
  }

  @HostListener('document:click')
  onDocumentClick() {}

  normalizeString(str: string): string {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
  }

  filterProducts(): void {
    const searchTerms = this.normalizeString(this.searchTerm).split(' ').filter(t => t.length > 0);
    
    this.filteredProducts = this.products.filter(p => {
      const pName = this.normalizeString(p.name);
      
      const matchSearch = searchTerms.length === 0 || searchTerms.every(term => 
        pName.includes(term)
      );

      const matchCat = !this.selectedCategory || p.category === this.selectedCategory;

      return matchSearch && matchCat;
    });
  }

  addToCart(product: any): void {
    if (!product.isAvailable) return;
    const existing = this.cart.find(i => i.product === product._id);
    if (existing) {
      existing.quantity++;
      existing.subtotal = existing.quantity * existing.unitPrice;
    } else {
      this.cart.push({
        product: product._id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        subtotal: product.price,
        impresoQty: 0
      });
    }
  }

  changeQty(index: number, delta: number): void {
    const item = this.cart[index];
    item.quantity += delta;
    if (item.quantity <= 0) { this.cart.splice(index, 1); return; }
    item.subtotal = item.quantity * item.unitPrice;
  }

  removeItem(index: number): void { this.cart.splice(index, 1); }
  clearCart(): void { this.cart = []; }

  printCurrentComanda(): void {
    const nuevos = this.soloNuevos(this.cart);
    if (nuevos.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'ℹ️ Sin nada nuevo',
        text: 'Todo lo del carrito ya fue comandado. Agregue productos nuevos para otra tanda.',
        confirmButtonColor: '#D4AF37'
      });
      return;
    }
    this.printComanda(nuevos, this.selectedTable, 'cocina');
    this.marcarComandado(this.cart);
  }

  finalizeSale(): void {
    this.processing = true;
    const payload: any = {
      items: this.cart.map(i => ({ product: i.product, quantity: i.quantity })),
      paymentMethod: this.paymentMethod
    };
    if (this.selectedTable !== null) {
      payload.tableNumber = this.selectedTable;
    }
    
    const t = this.getSelectedTableObj();
    if (t && (t.status === 'ocupada' || t.isOccupied) && t.currentSale) {
      // Snapshot del carrito para la comanda antes de limpiarlo (solo productos nuevos)
      const commandaItems = [...this.cart];
      const tableNum = this.selectedTable;
      const saleId = (t.currentSale as any)?._id || t.currentSale;
      this.api.addItemsToSale(saleId, payload).subscribe({
        next: () => {
          this.processing = false;
          this.cart = [];
          this.activeTab = 'venta';
          this.ngOnInit();
          this.loadVentaActual();
          this.offerPrintComanda(this.soloNuevos(commandaItems), tableNum, 'adicional');
        },
        error: (err: any) => {
          this.processing = false;
          Swal.fire('❌ Error', err.error?.message || 'Error al agregar ítems', 'error');
        }
      });
    } else {
      const commandaItems = [...this.cart];
      const tableNum = this.selectedTable;
      this.api.createSale(payload).subscribe({
        next: () => {
          this.processing = false;
          const isPostPago = this.settings?.paymentMode === 'post-pago' && this.selectedTable !== null;
          this.cart = [];
          this.ngOnInit();
          // Apertura (cocina): solo lo nuevo de la tanda. Factura: todo lo cobrado.
          this.offerPrintComanda(isPostPago ? this.soloNuevos(commandaItems) : commandaItems, tableNum, isPostPago ? 'cocina' : 'venta');
        },
        error: (err: any) => {
          this.processing = false;
          Swal.fire('❌ Error', err.error?.message || 'Error al procesar venta', 'error');
        }
      });
    }
  }

  payTableSale(): void {
    const t = this.getSelectedTableObj();
    if (!t || !t.currentSale) return;

    Swal.fire({
      title: `¿Cobrar ${this.nombreMesa(t.number)}?`,
      text: "Se marcará la venta como pagada y se liberará la mesa.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#D4AF37',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cobrar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.processing = true;
        const saleId = t.currentSale._id || t.currentSale;
        this.api.paySale(saleId, { paymentMethod: this.paymentMethod }).subscribe({
          next: (res: any) => {
            this.processing = false;
            this.selectedTable = null;
            this.activeTab = 'venta';
            this.ventaActual = null;
            this.ngOnInit();
            
            const allItems: any[] = [];
            if (res.items) res.items.forEach((i: any) => allItems.push(i));
            if (res.dishItems) res.dishItems.forEach((i: any) => {
               allItems.push({ productName: i.dishName, quantity: i.quantity, subtotal: i.subtotal });
            });

            this.offerPrintComanda(allItems, t.number, 'venta');
          },
          error: (err: any) => {
            this.processing = false;
            Swal.fire('❌ Error', err.error?.message || 'Error al cobrar la cuenta', 'error');
          }
        });
      }
    });
  }

  offerPrintComanda(items: any[], tableNum: number | null, type: 'venta' | 'cocina' | 'adicional'): void {
    const destino = this.nombreMesa(tableNum);
    if (items.length === 0) {
      Swal.fire({
        icon: 'info',
        title: '✅ Registrado',
        text: 'Todo ya estaba comandado, no hay nada nuevo por imprimir en esta tanda.',
        confirmButtonColor: '#D4AF37'
      });
      return;
    }
    const titles: Record<string, string> = {
      'venta': '✅ Venta Registrada',
      'cocina': '✅ Orden Enviada a Cocina',
      'adicional': '✅ Ítems Agregados'
    };
    const texts: Record<string, string> = {
      'venta': `Total cobrado: $${items.reduce((s, i) => s + i.subtotal, 0).toLocaleString('es-CO')}`,
      'cocina': 'El pedido fue enviado a preparación.',
      'adicional': `Se añadieron ${items.length} ítem(s) a ${destino}. Solo se comanda lo nuevo de esta tanda.`
    };

    Swal.fire({
      icon: 'success',
      title: titles[type] || '✅ Listo',
      text: texts[type] || '',
      confirmButtonColor: '#D4AF37',
      confirmButtonText: type === 'venta' ? '🖨️ Imprimir Factura' : '🖨️ Imprimir Comanda',
      showDenyButton: true,
      denyButtonText: 'Cerrar',
      denyButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.printComanda(items, tableNum, type);
      }
    });
  }

  printComanda(items: any[], tableNum: number | null, type: string): void {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CO');
    const hora = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const mesaLabel = tableNum === 0 ? 'Para llevar' : tableNum ? `Mesa ${tableNum}` : 'Mostrador';
    const tipoLabel = type === 'adicional' ? 'COMANDA' : type === 'cocina' ? 'PEDIDO' : 'VENTA';
    const total = items.reduce((s, i) => s + i.subtotal, 0);

    const lineas = items.map(i =>
      `<tr>
        <td style="padding:4px 2px;">${i.productName}</td>
        <td style="text-align:center;padding:4px;">${i.quantity}</td>
        <td style="text-align:right;padding:4px;">$${i.subtotal.toLocaleString('es-CO')}</td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comanda</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; padding: 8px; }
    .center { text-align: center; }
    .title { font-size: 15px; font-weight: bold; margin: 6px 0; }
    .badge { font-size: 11px; border: 1px solid #000; padding: 2px 8px; border-radius: 4px; display: inline-block; margin: 4px 0; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { border-bottom: 1px solid #000; padding: 3px 2px; font-size: 11px; text-align: left; }
    .total-row td { border-top: 1px dashed #000; font-weight: bold; padding-top: 6px; padding-bottom: 4px; }
    .footer { margin-top: 8px; font-size: 10px; color: #555; }
    @media print { body { width: 100%; } }
  </style>
</head>
<body>
  <div class="center">
    <div class="title">${type === 'venta' ? '🧾 FACTURA' : '🍲 COMANDA'}</div>
    <div class="badge">${tipoLabel}</div>
    ${type === 'adicional' ? '<div style="font-size:10px;margin-top:4px;">Solo lo nuevo de esta tanda — la venta inicial ya fue comandada</div>' : ''}
    <div style="margin-top:4px;"><strong>${mesaLabel}</strong></div>
    <div style="font-size:10px;color:#555;">${fecha} — ${hora}</div>
  </div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:center;">Cant.</th>
        <th style="text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${lineas}</tbody>
    ${type !== 'cocina' ? `<tfoot><tr class="total-row">
      <td colspan="2">TOTAL</td>
      <td style="text-align:right;">$${total.toLocaleString('es-CO')}</td>
    </tr></tfoot>` : ''}
  </table>
  <div class="divider"></div>
  <div class="footer center">Sistema La Soupe · Generado automáticamente</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=350,height=600');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    }
  }
}
