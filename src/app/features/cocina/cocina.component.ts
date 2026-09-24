import { Component } from '@angular/core';
import Swal from 'sweetalert2';

interface ItemCocina {
  _id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  unidad: string;
  stock: number;
  minStock: number;
}

@Component({
  selector: 'app-cocina',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🍲 Cocina</h1>
          <p class="page-subtitle">Ítems del área de cocina</p>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn-outline" (click)="iniciarOrden()">🧾 Orden de compra</button>
          <button class="btn-primary" (click)="openExistencias()">🔄 Actualizar inventario</button>
        </div>
      </div>
      <div *ngIf="ordenConfirmada.length > 0" class="orden-banner">
        🧾 Orden lista: <strong>{{ ordenConfirmada.length }} ítems</strong>
        <button class="btn-outline btn-sm" (click)="verOrden()">Ver</button>
        <button class="btn-outline btn-sm" (click)="descartarOrden()">Descartar</button>
      </div>

      <div class="card table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Ubicación</th>
              <th>Unidad</th>
              <th>Cantidad actual</th>
              <th>Stock mínimo</th>
              <th>Necesita pedido</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items; let idx = index">
              <td><span class="badge badge-cyan">{{ item.codigo }}</span></td>
              <td><strong>{{ item.nombre }}</strong></td>
              <td><span class="badge badge-gold">{{ item.categoria }}</span></td>
              <td>{{ item.ubicacion || '—' }}</td>
              <td>{{ item.unidad }}</td>
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
                <button class="btn-icon" title="Editar" (click)="edit(idx)">✏️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editing ? '✏️ Editar Ítem' : '➕ Nuevo Ítem de Cocina' }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Código</label>
              <input class="form-input" [(ngModel)]="form.codigo" placeholder="Ej. CP-002" />
            </div>
            <div class="form-group">
              <label>Categoría</label>
              <select class="form-input" [(ngModel)]="form.categoria">
                <option value="Proteínas">Proteínas</option>
                <option value="Verduras y frutas">Verduras y frutas</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Abarrotes">Abarrotes</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="form.nombre" />
            </div>
            <div class="form-group full-width">
              <label>Ubicación</label>
              <input class="form-input" [(ngModel)]="form.ubicacion" placeholder="Ej. Refrigerador 1" />
            </div>
            <div class="form-group">
              <label>Unidad de Medida</label>
              <select class="form-input" [(ngModel)]="form.unidad">
                <option value="kg">Kilogramos (kg)</option>
                <option value="gramos">Gramos (g)</option>
                <option value="g">Gramos (g)</option>
                <option value="litros">Litros (L)</option>
                <option value="mililitros">Mililitros (ml)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="unidades">Unidades</option>
              </select>
            </div>
            <div class="form-group">
              <label>Stock Actual</label>
              <input class="form-input" type="number" [(ngModel)]="form.stock" />
            </div>
            <div class="form-group">
              <label>Stock Mínimo</label>
              <input class="form-input" type="number" [(ngModel)]="form.minStock" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="closeForm()">Cancelar</button>
            <button class="btn-primary" (click)="save()">Guardar</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showExistencias" (click)="showExistencias = false">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2 class="modal-title" style="margin:0">🔄 Actualizar inventario — Cocina</h2>
            <button class="close-btn" (click)="showExistencias = false" title="Cerrar">✕</button>
          </div>
          <p style="font-size:0.8rem;color:var(--text-muted);margin:0 0 0.75rem">
            Ajuste las existencias y mínimos de cada ítem. Se guardan al confirmar.
          </p>
          <div style="overflow-x:auto;max-height:50vh;overflow-y:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Existencias</th>
                <th>Mínimo</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of existencias">
                <td><strong>{{ e.nombre }}</strong><br><small style="color:var(--text-muted)">{{ e.unidad }}</small></td>
                <td><input class="form-input input-sm" type="number" min="0" [(ngModel)]="e.stock" /></td>
                <td><input class="form-input input-sm" type="number" min="0" [(ngModel)]="e.minStock" /></td>
              </tr>
            </tbody>
          </table>
          </div>
          <div class="agregar-linea">
            <button *ngIf="!agregandoItem" class="btn-outline btn-sm" (click)="agregandoItem = true">＋ Nuevo ítem</button>
          </div>
          <div *ngIf="agregandoItem" class="nuevo-grid">
            <div class="form-group">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="nuevoItem.nombre" />
            </div>
            <div class="form-group">
              <label>Categoría</label>
              <select class="form-input" [(ngModel)]="nuevoItem.categoria">
                <option value="Proteínas">Proteínas</option>
                <option value="Verduras y frutas">Verduras y frutas</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Abarrotes">Abarrotes</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ubicación</label>
              <input class="form-input" [(ngModel)]="nuevoItem.ubicacion" />
            </div>
            <div class="form-group">
              <label>Unidad</label>
              <select class="form-input" [(ngModel)]="nuevoItem.unidad">
                <option value="g">Gramos (g)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="litros">Litros (L)</option>
                <option value="unidades">Unidades</option>
              </select>
            </div>
            <div class="form-group">
              <label>Existencias</label>
              <input class="form-input" type="number" min="0" [(ngModel)]="nuevoItem.stock" />
            </div>
            <div class="form-group">
              <label>Mínimo</label>
              <input class="form-input" type="number" min="0" [(ngModel)]="nuevoItem.minStock" />
            </div>
            <div class="nuevo-acciones">
              <button class="btn-primary btn-sm" (click)="confirmarNuevoItem()">✔ Añadir</button>
              <button class="btn-ghost btn-sm" (click)="cancelarNuevoItem()" title="Cancelar">✕</button>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="showExistencias = false">Cancelar</button>
            <button class="btn-primary" (click)="guardarExistencias()">✔ Guardar</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showOrden" (click)="showOrden = false">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2 class="modal-title" style="margin:0">🧾 Orden de compra — Cocina <small style="color:var(--text-muted)">(borrador)</small></h2>
            <button class="close-btn" (click)="showOrden = false" title="Cerrar">✕</button>
          </div>
          <p style="font-size:0.8rem;color:var(--text-muted);margin:0 0 0.75rem">
            Ajuste existencias y cantidades; marque los artículos a incluir. No modifica el inventario real.
          </p>
          <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Producto</th>
                <th>Cantidad actual</th>
                <th>Unidad</th>
                <th>Mínimo</th>
                <th>Cantidad a pedir</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of lineas">
                <td><input type="checkbox" [(ngModel)]="l.incluir" /></td>
                <td><strong>{{ l.nombre }}</strong></td>
                <td><input class="form-input input-sm" type="number" min="0" [(ngModel)]="l.stock" (ngModelChange)="recalcular(l)" /></td>
                <td>
                  <select class="form-input input-sm" [(ngModel)]="l.unidad">
                    <option value="unidades">Unidades</option>
                    <option value="kg">kg</option>
                    <option value="gramos">g</option>
                    <option value="g">g</option>
                    <option value="litros">L</option>
                    <option value="mililitros">ml</option>
                    <option value="ml">ml</option>
                    <option value="paquete">Paquete</option>
                    <option value="caja">Caja</option>
                    <option value="botella">Botella</option>
                    <option value="rollo">Rollo</option>
                    <option value="atado">Atado</option>
                  </select>
                </td>
                <td>{{ l.minStock }}</td>
                <td><input class="form-input input-sm" type="number" min="0" [(ngModel)]="l.qty" /></td>
              </tr>
            </tbody>
          </table>
          </div>
          <div class="agregar-linea">
            <input class="form-input" placeholder="Nombre del ítem" [(ngModel)]="nuevaLinea.nombre" [disabled]="!agregando" />
            <input class="form-input input-sm" type="number" min="0" placeholder="Cantidad" [(ngModel)]="nuevaLinea.qty" [disabled]="!agregando" />
            <select class="form-input input-sm" [(ngModel)]="nuevaLinea.unidad" [disabled]="!agregando">
              <option value="unidades">Unidades</option>
              <option value="kg">kg</option>
              <option value="gramos">g</option>
              <option value="g">g</option>
              <option value="litros">L</option>
              <option value="mililitros">ml</option>
              <option value="ml">ml</option>
              <option value="paquete">Paquete</option>
              <option value="caja">Caja</option>
              <option value="botella">Botella</option>
              <option value="rollo">Rollo</option>
              <option value="atado">Atado</option>
            </select>
            <button class="btn-outline btn-sm" (click)="agregarLinea()">
              {{ agregando ? '✔ Añadir' : '＋ Agregar' }}
            </button>
            <button class="btn-ghost btn-sm" *ngIf="agregando" (click)="cancelarAgregar()" title="Cancelar">✕</button>
          </div>
          <div class="modal-actions">
            <span style="margin-right:auto;font-size:0.85rem;color:var(--text-muted)">{{ lineasSeleccionadas() }} ítems seleccionados</span>
            <button class="btn-outline" (click)="showOrden = false">Cancelar</button>
            <button class="btn-primary" (click)="confirmarOrden()">✔ Confirmar selección</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-table th { text-transform: none; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .full-width { grid-column: 1 / -1; }
    .actions { display:flex; gap:.4rem; }
    .modal-lg { max-width: 760px; }
    .modal-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .modal-head .modal-title { margin: 0; }
    .close-btn {
      background: none; border: 1px solid var(--border); border-radius: 8px;
      padding: 0.35rem 0.65rem; cursor: pointer; color: var(--text-muted); flex-shrink: 0;
    }
    .close-btn:hover { border-color: #e74c3c; color: #e74c3c; }
    .input-sm { padding: 0.3rem 0.5rem; font-size: 0.85rem; max-width: 110px; }
    .orden-banner {
      display: flex; align-items: center; gap: 0.6rem;
      background: rgba(212, 175, 55, 0.1); border: 1px dashed var(--brand-gold);
      border-radius: 10px; padding: 0.5rem 0.8rem; margin-bottom: 1rem; font-size: 0.85rem;
    }
    .agregar-linea { display: flex; gap: 0.5rem; margin: 0.75rem 0 0.25rem; align-items: center; flex-wrap: wrap; }
    .agregar-linea .form-input { flex: 1; min-width: 90px; }
    .agregar-linea .form-input:disabled { opacity: 0.45; }
    .nuevo-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
      border: 1px dashed var(--brand-gold); border-radius: 10px; padding: 0.6rem; margin-top: 0.75rem;
    }
    .nuevo-acciones { grid-column: 1 / -1; display: flex; gap: 0.5rem; justify-content: flex-end; }
    .nuevo-grid .form-group label { font-size: 0.72rem; margin-bottom: 0.15rem; }
  `]
})
export class CocinaComponent {
  items: ItemCocina[] = [
    { _id: 'c1', codigo: 'CP-001', nombre: 'Filete de pescado blanco', categoria: 'Proteínas', ubicacion: 'Refrigerador 1', unidad: 'g', stock: 2500, minStock: 1000 },
    { _id: 'c2', codigo: 'CF-002', nombre: 'Limón tahití', categoria: 'Verduras y frutas', ubicacion: 'Refrigerador 2', unidad: 'g', stock: 800, minStock: 500 },
    { _id: 'c3', codigo: 'CF-003', nombre: 'Cebolla roja', categoria: 'Verduras y frutas', ubicacion: 'Bodega', unidad: 'g', stock: 1200, minStock: 500 },
    { _id: 'c4', codigo: 'CF-004', nombre: 'Ají limo', categoria: 'Verduras y frutas', ubicacion: 'Refrigerador 2', unidad: 'g', stock: 150, minStock: 100 },
    { _id: 'c5', codigo: 'CF-005', nombre: 'Ajo', categoria: 'Verduras y frutas', ubicacion: 'Bodega', unidad: 'g', stock: 400, minStock: 150 },
    { _id: 'c6', codigo: 'CF-006', nombre: 'Apio', categoria: 'Verduras y frutas', ubicacion: 'Refrigerador 2', unidad: 'g', stock: 350, minStock: 150 },
    { _id: 'c7', codigo: 'CF-007', nombre: 'Cilantro', categoria: 'Verduras y frutas', ubicacion: 'Refrigerador 2', unidad: 'g', stock: 180, minStock: 100 },
    { _id: 'c8', codigo: 'CF-008', nombre: 'Camote', categoria: 'Verduras y frutas', ubicacion: 'Bodega', unidad: 'g', stock: 400, minStock: 800 },
    { _id: 'c9', codigo: 'CF-009', nombre: 'Choclo', categoria: 'Verduras y frutas', ubicacion: 'Refrigerador 2', unidad: 'g', stock: 900, minStock: 600 },
    { _id: 'c10', codigo: 'CF-001', nombre: 'Uvilla', categoria: 'Verduras y frutas', ubicacion: 'Refrigerador 1', unidad: 'g', stock: 300, minStock: 400 },
    { _id: 'c11', codigo: 'CF-011', nombre: 'Hierbabuena', categoria: 'Verduras y frutas', ubicacion: 'Refrigerador 2', unidad: 'g', stock: 120, minStock: 80 },
    { _id: 'c12', codigo: 'CL-001', nombre: 'Crema de leche', categoria: 'Lácteos', ubicacion: 'Refrigerador 3', unidad: 'ml', stock: 1200, minStock: 500 },
    { _id: 'c13', codigo: 'CL-002', nombre: 'Cuajada fresca', categoria: 'Lácteos', ubicacion: 'Refrigerador 3', unidad: 'g', stock: 200, minStock: 300 },
    { _id: 'c14', codigo: 'CL-003', nombre: 'Mantequilla sin sal', categoria: 'Lácteos', ubicacion: 'Refrigerador 3', unidad: 'g', stock: 700, minStock: 300 },
    { _id: 'c15', codigo: 'CA-001', nombre: 'Sal', categoria: 'Abarrotes', ubicacion: 'Bodega', unidad: 'g', stock: 1500, minStock: 300 },
    { _id: 'c16', codigo: 'CA-002', nombre: 'Pimienta blanca molida', categoria: 'Abarrotes', ubicacion: 'Bodega', unidad: 'g', stock: 90, minStock: 60 },
    { _id: 'c17', codigo: 'CA-004', nombre: 'Panela', categoria: 'Abarrotes', ubicacion: 'Bodega', unidad: 'g', stock: 900, minStock: 500 },
    { _id: 'c18', codigo: 'CA-008', nombre: 'Azúcar blanca', categoria: 'Abarrotes', ubicacion: 'Bodega', unidad: 'g', stock: 250, minStock: 500 },
    { _id: 'c19', codigo: 'CA-009', nombre: 'Harina de trigo', categoria: 'Abarrotes', ubicacion: 'Bodega', unidad: 'g', stock: 1800, minStock: 600 },
    { _id: 'c20', codigo: 'CA-003', nombre: 'Cancha serrana', categoria: 'Abarrotes', ubicacion: 'Bodega', unidad: 'g', stock: 120, minStock: 200 },
  ];

  showForm = false; editing = false;
  form: any = {};
  private editingId = '';

  showOrden = false;
  lineas: any[] = [];
  ordenConfirmada: any[] = [];
  agregando = false;
  nuevaLinea: any = { nombre: '', qty: 0, unidad: 'unidades' };
  showExistencias = false;
  existencias: any[] = [];

  necesitaPedido(item: ItemCocina): boolean {
    return (item.stock ?? 0) < (item.minStock ?? 0);
  }

  cantidadAPedir(item: ItemCocina): number {
    const d = (item.minStock ?? 0) - (item.stock ?? 0);
    return d > 0 ? Math.round(d * 100) / 100 : 0;
  }

  openForm(): void {
    this.form = { categoria: 'Abarrotes', unidad: 'g', stock: 0, minStock: 5 };
    this.editing = false; this.editingId = ''; this.showForm = true;
  }

  edit(index: number): void {
    this.form = { ...this.items[index] };
    this.editing = true; this.editingId = this.items[index]._id; this.showForm = true;
  }

  closeForm(): void { this.showForm = false; }

  save(): void {
    if (!this.form.nombre) return;
    if (this.editing) {
      const i = this.items.findIndex(x => x._id === this.editingId);
      if (i >= 0) this.items[i] = { ...this.items[i], ...this.form };
    } else {
      this.items.push({ _id: 'local-' + Date.now(), ...this.form });
    }
    this.closeForm();
  }

  openExistencias(): void {
    this.existencias = this.items.map(i => ({
      _id: i._id, nombre: i.nombre, unidad: i.unidad,
      stock: Number(i.stock) || 0, minStock: Number(i.minStock) || 0
    }));
    this.resetNuevoItem();
    this.showExistencias = true;
  }

  guardarExistencias(): void {
    this.existencias.forEach(e => {
      const item = this.items.find(x => x._id === e._id);
      if (item) {
        item.stock = Math.max(0, Number(e.stock) || 0);
        item.minStock = Math.max(0, Number(e.minStock) || 0);
      }
    });
    this.showExistencias = false;
  }

  // —— Nuevo ítem con código automático por categoría ———————————
  agregandoItem = false;
  nuevoItem: any = { nombre: '', categoria: 'Abarrotes', ubicacion: '', unidad: 'g', stock: 0, minStock: 0 };

  resetNuevoItem(): void {
    this.agregandoItem = false;
    this.nuevoItem = { nombre: '', categoria: 'Abarrotes', ubicacion: '', unidad: 'g', stock: 0, minStock: 0 };
  }

  cancelarNuevoItem(): void {
    this.resetNuevoItem();
  }

  siguienteCodigo(categoria: string): string {
    const prefijos: Record<string, string> = {
      'Proteínas': 'CP', 'Verduras y frutas': 'CF',
      'Lácteos': 'CL', 'Abarrotes': 'CA'
    };
    const pref = prefijos[categoria] || 'CG';
    let max = 0;
    this.items.forEach(i => {
      const m = /^([A-Z]+)-(\d+)$/.exec(i.codigo || '');
      if (m && m[1] === pref) max = Math.max(max, parseInt(m[2], 10));
    });
    return `${pref}-${String(max + 1).padStart(3, '0')}`;
  }

  confirmarNuevoItem(): void {
    const nombre = (this.nuevoItem.nombre || '').trim();
    if (!nombre) return;
    const categoria = this.nuevoItem.categoria || 'Abarrotes';
    const codigo = this.siguienteCodigo(categoria);
    const nuevo: ItemCocina = {
      _id: 'local-' + Date.now(),
      codigo,
      nombre,
      categoria,
      ubicacion: this.nuevoItem.ubicacion || '',
      unidad: this.nuevoItem.unidad || 'unidades',
      stock: Math.max(0, Number(this.nuevoItem.stock) || 0),
      minStock: Math.max(0, Number(this.nuevoItem.minStock) || 0)
    };
    this.items.push(nuevo);
    this.existencias.push({
      _id: nuevo._id, nombre: nuevo.nombre, unidad: nuevo.unidad,
      stock: nuevo.stock, minStock: nuevo.minStock
    });
    this.resetNuevoItem();
  }

  private lineaDe(i: any): any {
    const stock = Number(i.stock) || 0;
    const min = Number(i.minStock) || 0;
    const qty = Math.max(0, Math.round((min - stock) * 100) / 100);
    return { _id: i._id, nombre: i.nombre, unidad: i.unidad, stock, minStock: min, qty, incluir: qty > 0 };
  }

  iniciarOrden(): void {
    if (this.items.length === 0) return;
    Swal.fire({
      title: '¿Iniciar orden de compra?',
      text: 'Se listará el inventario actual de Cocina para seleccionar artículos.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#D4AF37',
      confirmButtonText: 'Sí, iniciar',
      cancelButtonText: 'Volver'
    }).then((res) => {
      if (res.isConfirmed) {
        this.lineas = this.items.map(i => this.lineaDe(i));
        this.resetNuevaLinea();
        this.showOrden = true;
      }
    });
  }

  recalcular(l: any): void {
    l.qty = Math.max(0, Math.round(((Number(l.minStock) || 0) - (Number(l.stock) || 0)) * 100) / 100);
  }

  resetNuevaLinea(): void {
    this.nuevaLinea = { nombre: '', qty: 0, unidad: 'unidades' };
  }

  cancelarAgregar(): void {
    this.resetNuevaLinea();
    this.agregando = false;
  }

  agregarLinea(): void {
    if (!this.agregando) {
      this.agregando = true;
      return;
    }
    const nombre = (this.nuevaLinea.nombre || '').trim();
    const qty = Math.max(0, Number(this.nuevaLinea.qty) || 0);
    if (!nombre || qty <= 0) return;
    const unidad = this.nuevaLinea.unidad || 'unidades';
    const self = this;
    Swal.fire({
      title: '¿Desea conservar el producto en el listado del inventario?',
      text: `"${nombre}" se agregará a la orden. Si elige Sí, también quedará en el inventario de Cocina.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#D4AF37',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((res) => {
      if (res.isConfirmed) {
        self.items.push({
          _id: 'local-' + Date.now(), codigo: '', nombre,
          categoria: 'General', ubicacion: '', unidad,
          stock: 0, minStock: 0
        });
      }
      if (res.isConfirmed || res.dismiss === Swal.DismissReason.cancel) {
        self.lineas.push({
          _id: 'manual-' + Date.now(), nombre, unidad,
          stock: 0, minStock: 0, qty, incluir: true, manual: true
        });
        self.resetNuevaLinea();
      }
    });
  }

  lineasSeleccionadas(): number {
    return this.lineas.filter(l => l.incluir && (Number(l.qty) || 0) > 0).length;
  }

  confirmarOrden(): void {
    const sel = this.lineas.filter(l => l.incluir && (Number(l.qty) || 0) > 0);
    if (sel.length === 0) {
      Swal.fire('Atención', 'Seleccione al menos un artículo con cantidad mayor a 0.', 'info');
      return;
    }
    this.ordenConfirmada = sel.map(l => ({ ...l }));
    this.showOrden = false;
    const detalle = sel.map(l => `• ${l.nombre}: ${l.qty} ${l.unidad}`).join('<br>');
    Swal.fire({
      icon: 'success',
      title: `Orden lista (${sel.length} ítems)`,
      html: `<div style="text-align:left;max-height:40vh;overflow:auto">${detalle}</div>`,
      confirmButtonColor: '#D4AF37',
      confirmButtonText: 'Entendido'
    });
  }

  verOrden(): void {
    this.lineas = this.ordenConfirmada.map(l => ({ ...l }));
    this.showOrden = true;
  }

  descartarOrden(): void {
    this.ordenConfirmada = [];
  }
}
