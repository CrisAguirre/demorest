import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PreloadService } from './preload.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: Socket | null = null;
  private newOrderSub = new Subject<any>();
  private acceptedSub = new Subject<any>();
  private deliveredSub = new Subject<any>();
  private paidSub = new Subject<any>();
  private deliveryNewSub = new Subject<any>();
  private deliveryAcceptedSub = new Subject<any>();
  private deliveryDispatchedSub = new Subject<any>();
  private deliveryDeliveredSub = new Subject<any>();
  private deliveryCancelledSub = new Subject<any>();
  private dataChangedSub = new Subject<{ entity: string; action: string; data: any }>();

  constructor(private preload: PreloadService, private zone: NgZone) {}

  connect(): void {
    if (this.socket?.connected) return;
    const wsUrl = environment.apiUrl.replace('/api', '');
    this.socket = io(wsUrl, { transports: ['websocket', 'polling'] });
    this.socket.on('kitchen:order:new', d => this.newOrderSub.next(d));
    this.socket.on('kitchen:order:accepted', d => this.acceptedSub.next(d));
    this.socket.on('kitchen:order:delivered', d => this.deliveredSub.next(d));
    this.socket.on('kitchen:order:paid', d => this.paidSub.next(d));
    this.socket.on('delivery:new', d => this.deliveryNewSub.next(d));
    this.socket.on('delivery:accepted', d => this.deliveryAcceptedSub.next(d));
    this.socket.on('delivery:dispatched', d => this.deliveryDispatchedSub.next(d));
    this.socket.on('delivery:delivered', d => this.deliveryDeliveredSub.next(d));
    this.socket.on('delivery:cancelled', d => this.deliveryCancelledSub.next(d));
    this.socket.on('data:changed', (d: any) => {
      this.zone.run(() => {
        this.dataChangedSub.next(d);
        this.invalidateCacheFor(d.entity);
      });
    });
  }

  private invalidateCacheFor(entity: string): void {
    switch (entity) {
      case 'product':
        this.preload.invalidatePrefix('products');
        this.preload.invalidate('all-products');
        break;
      case 'category':
        this.preload.invalidate('categories');
        break;
      case 'supplier':
        this.preload.invalidatePrefix('suppliers');
        break;
      case 'purchase':
        this.preload.invalidatePrefix('purchases');
        break;
      case 'expense':
        this.preload.invalidatePrefix('expenses');
        break;
      case 'sale':
        this.preload.invalidatePrefix('sales');
        this.preload.invalidatePrefix('sales-summary');
        break;
      case 'ingredient':
        this.preload.invalidatePrefix('ingredients');
        break;
      case 'dish':
        this.preload.invalidatePrefix('dishes');
        break;
    }
  }

  joinKitchen(): void {
    this.socket?.emit('join:kitchen');
  }

  onNewOrder(): Observable<any> {
    return this.newOrderSub.asObservable();
  }

  onOrderAccepted(): Observable<any> {
    return this.acceptedSub.asObservable();
  }

  onOrderDelivered(): Observable<any> {
    return this.deliveredSub.asObservable();
  }

  onOrderPaid(): Observable<any> {
    return this.paidSub.asObservable();
  }

  onDeliveryNew(): Observable<any> {
    return this.deliveryNewSub.asObservable();
  }

  onDeliveryAccepted(): Observable<any> {
    return this.deliveryAcceptedSub.asObservable();
  }

  onDeliveryDispatched(): Observable<any> {
    return this.deliveryDispatchedSub.asObservable();
  }

  onDeliveryDelivered(): Observable<any> {
    return this.deliveryDeliveredSub.asObservable();
  }

  onDeliveryCancelled(): Observable<any> {
    return this.deliveryCancelledSub.asObservable();
  }

  onDataChanged(): Observable<{ entity: string; action: string; data: any }> {
    return this.dataChangedSub.asObservable();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}