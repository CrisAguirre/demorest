import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import Swal from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let auth: jasmine.SpyObj<AuthService>;

  function makeMockTables() {
    return [
      { _id: 't1', number: 1, isOccupied: false, currentSale: null },
      { _id: 't2', number: 2, isOccupied: true, currentSale: { _id: '662e1a1b2c3d4e5f6a7b8c9d' } },
      { _id: 't3', number: 3, isOccupied: true, currentSale: { _id: '772e1a1b2c3d4e5f6a7b8c9e' } },
      { _id: 't4', number: 4, isOccupied: false, currentSale: null }
    ];
  }

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', [
      'getTables', 'getSalesSummary', 'getProducts', 'getAlerts', 'getTopProducts', 'freeTable'
    ]);
    api.getTables.and.callFake(() => of(makeMockTables()));
    api.getSalesSummary.and.returnValue(of({ totalRevenue: 50000, totalTransactions: 5 }));
    api.getProducts.and.returnValue(of({ total: 10 }));
    api.getAlerts.and.returnValue(of({ unread: 3 }));
    api.getTopProducts.and.returnValue(of([{ name: 'Burger', totalQuantity: 20 }]));

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

  it('should load tables on init', () => {
    expect(api.getTables).toHaveBeenCalled();
    expect(component.tables.length).toBe(4);
  });

  it('should call freeTable when occupied table is clicked and confirmed', async () => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    api.freeTable.and.returnValue(of({}));

    const table = component.tables[1];
    await component.freeTable(table);
    expect(api.freeTable).toHaveBeenCalledWith('t2');
    expect(table.isOccupied).toBe(false);
    expect(table.currentSale).toBeNull();
  });

  it('should NOT call freeTable when table is already free', () => {
    component.freeTable(component.tables[0]);
    expect(api.freeTable).not.toHaveBeenCalled();
  });

  it('should NOT call freeTable when Swal is cancelled', async () => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));

    await component.freeTable(component.tables[1]);
    expect(api.freeTable).not.toHaveBeenCalled();
  });

  it('should load stats on init', () => {
    expect(component.todaySales).toBe(50000);
    expect(component.todayTransactions).toBe(5);
    expect(component.totalProducts).toBe(10);
    expect(component.unreadAlerts).toBe(3);
    expect(component.topProducts.length).toBe(1);
  });

  it('should track occupied tables correctly via component state', () => {
    expect(component.tables[0].isOccupied).toBeFalse();
    expect(component.tables[1].isOccupied).toBeTrue();
    expect(component.tables[2].isOccupied).toBeTrue();
    expect(component.tables[3].isOccupied).toBeFalse();
  });

  it('should have currentSale with _id on occupied tables', () => {
    expect(component.tables[1].currentSale?._id).toBe('662e1a1b2c3d4e5f6a7b8c9d');
    expect(component.tables[2].currentSale?._id).toBe('772e1a1b2c3d4e5f6a7b8c9e');
    expect(component.tables[0].currentSale).toBeNull();
    expect(component.tables[3].currentSale).toBeNull();
  });
});
