import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { WebSocketService } from '@core/services/websocket.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

registerLocaleData(localeEsCo);

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let auth: jasmine.SpyObj<AuthService>;
  let ws: jasmine.SpyObj<WebSocketService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', [
      'getSalesSummary', 'getProducts', 'getAlerts', 'getTopProducts', 'getAllDeliveries',
      'getTables', 'getCurrentCash'
    ]);
    api.getSalesSummary.and.returnValue(of({ totalRevenue: 50000, totalTransactions: 5 }));
    api.getProducts.and.returnValue(of({ total: 10 }));
    api.getAlerts.and.returnValue(of({ unread: 3, alerts: [] }));
    api.getTopProducts.and.returnValue(of([{ name: 'Burger', totalQuantity: 20 }]));
    api.getAllDeliveries.and.returnValue(of([]));
    api.getTables.and.returnValue(of([{ number: 1, status: 'libre' }, { number: 2, status: 'ocupada' }]));
    api.getCurrentCash.and.returnValue(of({ open: true, currentTotalSales: 30000, currentTransactions: 3, cashClosing: { user: { name: 'Admin' }, initialCash: 100000 } }));

    auth = jasmine.createSpyObj('AuthService', [], {
      currentUser: { name: 'Admin User', role: 'admin' }
    });

    ws = jasmine.createSpyObj('WebSocketService', [
      'connect', 'onDeliveryNew', 'onDeliveryAccepted', 'onDeliveryDispatched',
      'onDeliveryDelivered', 'onDeliveryCancelled', 'onNewOrder', 'onOrderPaid', 'onDataChanged'
    ]);
    ws.onDeliveryNew.and.returnValue(of());
    ws.onDeliveryAccepted.and.returnValue(of());
    ws.onDeliveryDispatched.and.returnValue(of());
    ws.onDeliveryDelivered.and.returnValue(of());
    ws.onDeliveryCancelled.and.returnValue(of());
    ws.onNewOrder.and.returnValue(of());
    ws.onOrderPaid.and.returnValue(of());
    ws.onDataChanged.and.returnValue(of());

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth },
        { provide: WebSocketService, useValue: ws }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load stats on init', () => {
    expect(component.todaySales).toBe(50000);
    expect(component.todayTransactions).toBe(5);
    expect(component.totalProducts).toBe(10);
    expect(component.unreadAlerts).toBe(3);
    expect(component.topProducts.length).toBe(1);
  });

  it('should load active deliveries on init', () => {
    expect(api.getAllDeliveries).toHaveBeenCalled();
    expect(component.loadingDeliveries).toBeFalse();
  });
});
