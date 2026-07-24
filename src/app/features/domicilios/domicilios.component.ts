import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { WebSocketService } from '@core/services/websocket.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-domicilios',
  template: `
    <div class="page-header">
      <h1>🛵 Domicilios</h1>
      <span class="badge badge-cyan">{{ pendingCount }} pendientes</span>
    </div>

    <div class="delivery-grid">
      <div class="neon-card">
        <h3 style="color:var(--brand-gold);margin-bottom:1rem">🆕 Pendientes</h3>
        <div *ngFor="let o of pendientes" class="delivery-card" (click)="acceptOrder(o)">
          <div class="deliv-header">
            <strong>{{ o.customerName }}</strong>
            <span class="order-id">#{{ o._id.toString().slice(-6).toUpperCase() }}</span>
          </div>
          <div class="deliv-info">📍 {{ o.customerAddress }}</div>
          <div class="deliv-info" *ngIf="o.customerPhone">📞 {{ o.customerPhone }}</div>
          <div class="deliv-items">
            <div *ngFor="let i of o.items" class="deliv-item">{{ i.quantity }}x {{ i.productName }}</div>
          </div>
        </div>
        <p *ngIf="pendientes.length===0" class="empty-msg">Sin pedidos pendientes</p>
      </div>

      <div class="neon-card-violet">
        <h3 style="color:var(--brand-bronze);margin-bottom:1rem">👨‍🍳 En Preparación</h3>
        <div *ngFor="let o of enPreparacion" class="delivery-card" (click)="dispatchOrder(o)">
          <div class="deliv-header">
            <strong>{{ o.customerName }}</strong>
            <span class="order-id">#{{ o._id.toString().slice(-6).toUpperCase() }}</span>
          </div>
          <div class="deliv-info">📍 {{ o.customerAddress }}</div>
          <div class="deliv-items">
            <div *ngFor="let i of o.items" class="deliv-item">{{ i.quantity }}x {{ i.productName }}</div>
          </div>
        </div>
        <p *ngIf="enPreparacion.length===0" class="empty-msg">Nada en preparación</p>
      </div>

      <div class="neon-card" style="border-color:#FF8C00">
        <h3 style="color:#FF8C00;margin-bottom:1rem">🛵 En Camino</h3>
        <div *ngFor="let o of enCamino" class="delivery-card" (click)="deliverOrder(o)">
          <div class="deliv-header">
            <strong>{{ o.customerName }}</strong>
            <span class="order-id">#{{ o._id.toString().slice(-6).toUpperCase() }}</span>
          </div>
          <div class="deliv-info">📍 {{ o.customerAddress }}</div>
          <div class="deliv-info" *ngIf="o.assignedDriver">🛵 {{ o.assignedDriver?.name || 'Repartidor' }}</div>
        </div>
        <p *ngIf="enCamino.length===0" class="empty-msg">Ninguno en camino</p>
      </div>

      <div class="neon-card" style="border-color:#2E8B57">
        <h3 style="color:#2E8B57;margin-bottom:1rem">✅ Entregados</h3>
        <div *ngFor="let o of entregados" class="delivery-card delivered">
          <div class="deliv-header">
            <strong>{{ o.customerName }}</strong>
            <span class="order-id">#{{ o._id.toString().slice(-6).toUpperCase() }}</span>
          </div>
          <div class="deliv-info">📍 {{ o.customerAddress }}</div>
        </div>
        <p *ngIf="entregados.length===0" class="empty-msg">Sin entregados hoy</p>
      </div>
    </div>
  `,
  styles: [`
    .delivery-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .delivery-card {
      background: var(--bg-input); border-radius: var(--radius-sm);
      padding: 0.75rem; margin-bottom: 0.75rem; cursor: pointer;
      transition: all 0.2s;
    }
    .delivery-card:hover { transform: translateY(-2px); }
    .delivery-card.delivered { cursor: default; opacity: 0.7; }
    .deliv-header { display: flex; justify-content: space-between; margin-bottom: 0.4rem; }
    .order-id { font-family: monospace; font-size: 0.75rem; opacity: 0.6; }
    .deliv-info { font-size: 0.8rem; opacity: 0.8; margin-bottom: 0.2rem; }
    .deliv-items { margin-top: 0.4rem; }
    .deliv-item { font-size: 0.75rem; padding: 0.1rem 0; }
    .empty-msg { color: var(--text-muted); text-align: center; padding: 2rem; font-size: 0.85rem; }
    @media (max-width: 1100px) { .delivery-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .delivery-grid { grid-template-columns: 1fr; } }
  `]
})
export class DomiciliosComponent implements OnInit, OnDestroy {
  pendientes: any[] = [];
  enPreparacion: any[] = [];
  enCamino: any[] = [];
  entregados: any[] = [];
  private subs: Subscription[] = [];

  constructor(private api: ApiService, private ws: WebSocketService) {}

  ngOnInit() {
    this.load();
    this.ws.connect();
    this.ws.joinKitchen();
    this.subs.push(
      this.ws.onDeliveryNew().subscribe(() => this.load()),
      this.ws.onDeliveryAccepted().subscribe(() => this.load()),
      this.ws.onDeliveryDispatched().subscribe(() => this.load()),
      this.ws.onDeliveryDelivered().subscribe(() => this.load()),
      this.ws.onDeliveryCancelled().subscribe(() => this.load())
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  get pendingCount() { return this.pendientes.length + this.enPreparacion.length + this.enCamino.length; }

  load() {
    this.api.getAllDeliveries().subscribe({
      next: (orders: any[]) => {
        this.pendientes = orders.filter((o: any) => o.status === 'pendiente');
        this.enPreparacion = orders.filter((o: any) => o.status === 'en_preparacion');
        this.enCamino = orders.filter((o: any) => o.status === 'en_camino');
        this.entregados = orders.filter((o: any) => o.status === 'entregado');
      }
    });
  }

  acceptOrder(o: any) {
    Swal.fire({
      title: '¿Aceptar domicilio?',
      text: `${o.customerName} — ${o.items.length} item(s)`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '✅ Aceptar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.api.acceptDelivery(o._id).subscribe({
          next: () => { Swal.fire('Éxito', 'Pedido en preparación', 'success'); this.load(); },
          error: (err) => Swal.fire('Error', err.error?.message || 'Error', 'error')
        });
      }
    });
  }

  dispatchOrder(o: any) {
    Swal.fire({
      title: '¿Despachar domicilio?',
      text: `${o.customerName} — ${o.customerAddress}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '🛵 En camino',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.api.dispatchDelivery(o._id).subscribe({
          next: () => { Swal.fire('Éxito', 'Repartidor en camino', 'success'); this.load(); },
          error: (err) => Swal.fire('Error', err.error?.message || 'Error', 'error')
        });
      }
    });
  }

  deliverOrder(o: any) {
    Swal.fire({
      title: '¿Confirmar entrega?',
      text: `${o.customerName} — ${o.customerAddress}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '✅ Entregado',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.api.deliverDelivery(o._id).subscribe({
          next: () => { Swal.fire('Éxito', 'Pedido entregado', 'success'); this.load(); },
          error: (err) => Swal.fire('Error', err.error?.message || 'Error', 'error')
        });
      }
    });
  }
}