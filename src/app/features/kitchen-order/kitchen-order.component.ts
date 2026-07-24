import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { WebSocketService } from '@core/services/websocket.service';
import { NotificationSoundService } from '@core/services/notification-sound.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-kitchen-order',
  template: `
    <div class="page-header">
      <h1>🍳 Órdenes de Cocina</h1>
      <span class="ws-badge" [class.connected]="wsConnected">⚡</span>
    </div>

    <div class="kitchen-grid">
      <div class="neon-card">
        <h3 style="color:var(--brand-gold);margin-bottom:1rem">🆕 Nuevos</h3>
        <div *ngFor="let o of newOrders" class="order-card new-order" (click)="acceptOrder(o)">
          <div class="order-header">
            <span class="order-table">Mesa {{ o.tableNumber || 'Domicilio' }}</span>
            <span class="order-id">#{{ o._id.toString().slice(-6).toUpperCase() }}</span>
          </div>
          <div class="order-items">
            <div *ngFor="let item of o.items" class="order-item">
              <span class="item-qty">{{ item.quantity }}x</span>
              <span class="item-name">{{ item.productName }}</span>
            </div>
          </div>
          <div class="order-print" (click)="printOrder(o);$event.stopPropagation()">🖨️</div>
        </div>
        <p *ngIf="newOrders.length === 0" class="empty-msg">Sin pedidos nuevos</p>
      </div>

      <div class="neon-card-violet">
        <h3 style="color:var(--brand-bronze);margin-bottom:1rem">👨‍🍳 En Preparación</h3>
        <div *ngFor="let o of cookingOrders" class="order-card cooking-order" (click)="deliverOrder(o)">
          <div class="order-header">
            <span class="order-table">Mesa {{ o.tableNumber || 'Domicilio' }}</span>
            <span class="order-id">#{{ o._id.toString().slice(-6).toUpperCase() }}</span>
          </div>
          <div class="order-items">
            <div *ngFor="let item of o.items" class="order-item">
              <span class="item-qty">{{ item.quantity }}x</span>
              <span class="item-name">{{ item.productName }}</span>
            </div>
          </div>
          <div class="order-assign" *ngIf="o.assignedCook">
            👨‍🍳 {{ o.assignedCook?.name || 'Cocinero' }}
          </div>
        </div>
        <p *ngIf="cookingOrders.length === 0" class="empty-msg">Nada en preparación</p>
      </div>

      <div class="neon-card" style="border-color:var(--brand-green, #2E8B57)">
        <h3 style="color:#2E8B57;margin-bottom:1rem">✅ Entregados</h3>
        <div *ngFor="let o of deliveredOrders" class="order-card delivered-order">
          <div class="order-header">
            <span class="order-table">Mesa {{ o.tableNumber || 'Domicilio' }}</span>
            <span class="order-id">#{{ o._id.toString().slice(-6).toUpperCase() }}</span>
          </div>
          <div class="order-items">
            <div *ngFor="let item of o.items" class="order-item">
              <span class="item-qty">{{ item.quantity }}x</span>
              <span class="item-name">{{ item.productName }}</span>
            </div>
          </div>
        </div>
        <p *ngIf="deliveredOrders.length === 0" class="empty-msg">Sin entregados</p>
      </div>
    </div>
  `,
  styles: [`
    .ws-badge { font-size: 0.8rem; opacity: 0.4; transition: opacity 0.3s; }
    .ws-badge.connected { opacity: 1; }
    .kitchen-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .order-card {
      background: var(--bg-input); border-radius: var(--radius-sm);
      padding: 0.75rem; margin-bottom: 0.75rem; cursor: pointer;
      transition: all 0.2s; position: relative;
    }
    .order-card:hover { transform: translateY(-2px); }
    .new-order { border-left: 3px solid var(--brand-gold); }
    .cooking-order { border-left: 3px solid var(--brand-bronze); }
    .delivered-order { border-left: 3px solid #2E8B57; cursor: default; }
    .order-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .order-table { font-weight: 700; font-size: 0.9rem; }
    .order-id { font-family: monospace; font-size: 0.75rem; opacity: 0.6; }
    .order-items { display: flex; flex-direction: column; gap: 0.2rem; }
    .order-item { display: flex; gap: 0.5rem; font-size: 0.8rem; }
    .item-qty { font-weight: 700; color: var(--brand-gold); min-width: 24px; }
    .item-name { flex: 1; }
    .order-assign { margin-top: 0.4rem; font-size: 0.7rem; opacity: 0.7; }
    .order-print { position: absolute; top: 0.5rem; right: 0.5rem; cursor: pointer; font-size: 1rem; }
    .order-print:hover { transform: scale(1.2); }
    .empty-msg { color: var(--text-muted); text-align: center; padding: 2rem; font-size: 0.85rem; }
    .page-header { display: flex; align-items: center; gap: 1rem; }
    @media (max-width: 900px) { .kitchen-grid { grid-template-columns: 1fr; } }
  `]
})
export class KitchenOrderComponent implements OnInit, OnDestroy {
  newOrders: any[] = [];
  cookingOrders: any[] = [];
  deliveredOrders: any[] = [];
  wsConnected = false;
  private subs: Subscription[] = [];

  constructor(
    private api: ApiService,
    private ws: WebSocketService,
    private sound: NotificationSoundService
  ) {}

  ngOnInit(): void {
    this.ws.connect();
    this.ws.joinKitchen();
    this.loadOrders();
    this.subs.push(
      this.ws.onNewOrder().subscribe(o => this.handleNewOrder(o)),
      this.ws.onOrderAccepted().subscribe(o => this.handleOrderUpdate(o)),
      this.ws.onOrderDelivered().subscribe(o => this.handleOrderUpdate(o)),
      this.ws.onOrderPaid().subscribe(o => this.removeOrder(o))
    );
    setTimeout(() => this.wsConnected = true, 1000);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadOrders(): void {
    this.api.getKitchenOrders().subscribe({
      next: (orders: any[]) => {
        this.newOrders = orders.filter((o: any) => o.status === 'nuevo');
        this.cookingOrders = orders.filter((o: any) => o.status === 'en_preparacion');
        this.deliveredOrders = orders.filter((o: any) => o.status === 'entregado');
      }
    });
  }

  private handleNewOrder(order: any): void {
    this.newOrders.unshift(order);
    this.sound.playOrderChime();
  }

  private handleOrderUpdate(order: any): void {
    this.removeOrder(order);
    if (order.status === 'en_preparacion') this.cookingOrders.unshift(order);
    if (order.status === 'entregado') this.deliveredOrders.unshift(order);
  }

  private removeOrder(order: any): void {
    this.newOrders = this.newOrders.filter(o => o._id !== order._id);
    this.cookingOrders = this.cookingOrders.filter(o => o._id !== order._id);
    this.deliveredOrders = this.deliveredOrders.filter(o => o._id !== order._id);
  }

  acceptOrder(order: any): void {
    Swal.fire({
      title: '¿Aceptar pedido?',
      text: `Mesa ${order.tableNumber || 'Domicilio'} — ${order.items.length} item(s)`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#D4AF37',
      confirmButtonText: '✅ Aceptar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.api.acceptKitchenOrder(order._id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Pedido en preparación', timer: 1000, showConfirmButton: false });
          },
          error: (err: any) => Swal.fire('Error', err.error?.message || 'Error al aceptar', 'error')
        });
      }
    });
  }

  deliverOrder(order: any): void {
    Swal.fire({
      title: '¿Entregar pedido?',
      text: `Mesa ${order.tableNumber || 'Domicilio'}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2E8B57',
      confirmButtonText: '✅ Entregado',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.api.deliverKitchenOrder(order._id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Pedido entregado', timer: 1000, showConfirmButton: false });
          },
          error: (err: any) => Swal.fire('Error', err.error?.message || 'Error al entregar', 'error')
        });
      }
    });
  }

  printOrder(order: any): void {
    this.api.printKitchenOrder(order._id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => Swal.fire('Error', 'No se pudo generar el ticket', 'error')
    });
  }
}
