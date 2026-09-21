import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', [
      'getSalesSummary', 'getProducts', 'getAlerts', 'getTopProducts', 'getAllDeliveries'
    ]);
    api.getSalesSummary.and.returnValue(of({ totalRevenue: 50000, totalTransactions: 5 }));
    api.getProducts.and.returnValue(of({ total: 10 }));
    api.getAlerts.and.returnValue(of({ unread: 3 }));
    api.getTopProducts.and.returnValue(of([{ name: 'Burger', totalQuantity: 20 }]));
    api.getAllDeliveries.and.returnValue(of([]));

    auth = jasmine.createSpyObj('AuthService', [], {
      currentUser: { name: 'Admin User', role: 'admin' }
    });

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth }
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
