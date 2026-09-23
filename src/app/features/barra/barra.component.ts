import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-barra',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🍹 Barra</h1>
          <p class="page-subtitle">Ítems del área de barra</p>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn-outline" (click)="iniciarOrden()">🧾 Orden de compra</button>
          <button class="btn-primary" (click)="openForm()">+ Nuevo</button>
        </div>
      </div>
      <div *ngIf="ordenConfirmada.length > 0" class="orden-banner">
        🧾 Orden lista: <strong>{{ ordenConfirmada.length }} ítems</strong>
        <button class="btn-outline btn-sm" (click)="verOrden()">Ver</button>
        <button class="btn-outline btn-sm" (click)="descartarOrden()">Descartar</button>
      </div>

      <div class="card table-card">
        <div *ngIf="loading" style="text-align:center;padding:2rem;color:var(--text-muted)">Cargando insumos de barra...</div>
        <div *ngIf="!loading && items.length === 0" style="text-align:center;padding:2rem;color:var(--text-muted)">Sin insumos asignados a barra.<br>Usa + Nuevo o asigna el área editando cada ítem.</div>
        <table *ngIf="!loading && items.length > 0" class="data-table">
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
            <tr *ngFor="let item of items">
              <td><span class="badge badge-cyan">{{ item.code || item.codigo || '—' }}</span></td>
              <td><strong>{{ item.name || item.nombre }}</strong></td>
              <td><span class="badge badge-gold">{{ categoriaDe(item) }}</span></td>
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
                <button class="btn-icon" title="Editar" (click)="edit(item)">✏️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editing ? '✏️ Editar Ítem' : '➕ Nuevo Ítem de Barra' }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Código</label>
              <input class="form-input" [(ngModel)]="form.code" placeholder="Ej. BB-008" />
            </div>
            <div class="form-group">
              <label>Área</label>
              <select class="form-input" [(ngModel)]="form.area">
                <option value="cocina">Cocina</option>
                <option value="barra">Barra</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="form.name" />
            </div>
            <div class="form-group full-width">
              <label>Ubicación</label>
              <input class="form-input" [(ngModel)]="form.ubicacion" placeholder="Ej. Cava, Nevera barra" />
            </div>
            <div class="form-group">
              <label>Unidad de Medida</label>
              <select class="form-input" [(ngModel)]="form.unit">
                <option value="botella">Botella</option>
                <option value="caja">Caja</option>
                <option value="litro">Litro (L)</option>
                <option value="mililitros">Mililitros (ml)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="gramos">Gramos (g)</option>
                <option value="unidades">Unidades</option>
              </select>
            </div>
            <div class="form-group">
              <label>Costo</label>
              <input class="form-input" type="number" [(ngModel)]="form.cost" />
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
            <button class="btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showOrden" (click)="showOrden = false">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2 class="modal-title" style="margin:0">🧾 Orden de compra — Barra <small style="color:var(--text-muted)">(borrador)</small></h2>
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
                    <option value="litros">L</option>
                    <option value="mililitros">ml</option>
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
              <option value="litros">L</option>
              <option value="mililitros">ml</option>
              <option value="paquete">Paquete</option>
              <option value="caja">Caja</option>
              <option value="botella">Botella</option>
              <option value="rollo">Rollo</option>
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
    .agregar-linea { display: flex; gap: 0.5rem; margin: 0.75rem 0 0.25rem; align-items: center; flex-wrap: wrap; }
    .agregar-linea .form-input { flex: 1; min-width: 90px; }
    .agregar-linea .form-input:disabled { opacity: 0.45; }
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
  `]
})
export class BarraComponent implements OnInit {
  items: any[] = [];
  loading = false; saving = false; showForm = false; editing = false;
  form: any = {};
  private editingId = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getIngredients({ area: 'barra' }).subscribe({
      next: (res: any) => {
        const lista = Array.isArray(res) ? res : (res.items || []);
        this.items = lista.filter((i: any) => this.areaDe(i) === 'barra');
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  areaDe(item: any): string {
    if (item.area === 'cocina' || item.area === 'barra' || item.area === 'servicio') return item.area;
    const code: string = item.code || item.codigo || '';
    if (/^(BB|BI|BP)-/.test(code)) return 'barra';
    if (/^S-/.test(code)) return 'servicio';
    return 'cocina';
  }

  openForm(): void {
    this.form = { area: 'barra', unit: 'botella', stock: 0, minStock: 2, cost: 0 };
    this.editing = false; this.editingId = ''; this.showForm = true;
  }

  edit(item: any): void {
    this.form = { ...item };
    this.editing = true; this.editingId = item._id; this.showForm = true;
  }

  closeForm(): void { this.showForm = false; }

  save(): void {
    if (!this.form.name) return;
    this.saving = true;
    const obs = this.editing
      ? this.api.updateIngredient(this.editingId, this.form)
      : this.api.createIngredient(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.load(); },
      error: () => { this.saving = false; }
    });
  }

  categoriaDe(item: any): string {
    if (item.categoria) return item.categoria;
    const code: string = item.code || item.codigo || '';
    if (/^BB-/.test(code)) return 'Bebidas';
    if (/^BI-/.test(code)) return 'Insumos';
    if (/^BP-/.test(code)) return 'Preparaciones';
    return 'General';
  }

  necesitaPedido(item: any): boolean {
    return (item.stock ?? 0) < (item.minStock ?? 0);
  }

  cantidadAPedir(item: any): number {
    const d = (item.minStock ?? 0) - (item.stock ?? 0);
    return d > 0 ? Math.round(d * 100) / 100 : 0;
  }

  // —— Orden de compra del área (borrador local) ————————————
  showOrden = false;
  lineas: any[] = [];
  ordenConfirmada: any[] = [];
  agregando = false;
  nuevaLinea: any = { nombre: '', qty: 0, unidad: 'unidades' };

  lineaDe(i: any): any {
    const stock = Number(i.stock) || 0;
    const min = Number(i.minStock) || 0;
    const qty = Math.max(0, Math.round((min - stock) * 100) / 100);
    return { _id: i._id, nombre: i.name || i.nombre, unidad: i.unidad || i.unit, stock, minStock: min, qty, incluir: qty > 0 };
  }

  iniciarOrden(): void {
    if (this.items.length === 0) return;
    Swal.fire({
      title: '¿Iniciar orden de compra?',
      text: 'Se listará el inventario actual de Barra para seleccionar artículos.',
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
    Swal.fire({
      title: '¿Desea conservar el producto en el listado del inventario?',
      text: `"${nombre}" se agregará a la orden. Si elige Sí, también quedará en el inventario de Barra.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#D4AF37',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((res) => {
      if (res.isConfirmed) {
        this.api.createIngredient({ name: nombre, unit: unidad, area: 'barra', stock: 0, minStock: 0, cost: 0 }).subscribe({
          next: (creado: any) => {
            this.lineas.push({
              _id: creado._id || ('manual-' + Date.now()),
              nombre, unidad, stock: 0, minStock: 0, qty, incluir: true, manual: true
            });
            this.resetNuevaLinea();
          },
          error: () => {
            this.agregarLineaManual(nombre, unidad, qty);
            this.resetNuevaLinea();
          }
        });
      } else if (res.dismiss === Swal.DismissReason.cancel) {
        this.agregarLineaManual(nombre, unidad, qty);
        this.resetNuevaLinea();
      }
    });
  }

  private agregarLineaManual(nombre: string, unidad: string, qty: number): void {
    this.lineas.push({
      _id: 'manual-' + Date.now(),
      nombre, unidad, stock: 0, minStock: 0, qty, incluir: true, manual: true
    });
  }

  recalcular(l: any): void {
    l.qty = Math.max(0, Math.round(((Number(l.minStock) || 0) - (Number(l.stock) || 0)) * 100) / 100);
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
