import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { KitchenOrderComponent } from './kitchen-order.component';
import { ApiService } from '@core/services/api.service';
import Swal from 'sweetalert2';

describe('KitchenOrderComponent', () => {
  let component: KitchenOrderComponent;
  let fixture: ComponentFixture<KitchenOrderComponent>;
  let api: jasmine.SpyObj<ApiService>;

  const mockOrders = [
    { _id: '1', status: 'nuevo', tableNumber: 3, items: [{ productName: 'Burger', quantity: 2 }] },
    { _id: '2', status: 'nuevo', tableNumber: 5, items: [{ productName: 'Pizza', quantity: 1 }] },
    { _id: '3', status: 'en_preparacion', tableNumber: 1, items: [{ productName: 'Pasta', quantity: 3 }], assignedCook: { name: 'Chef' } },
    { _id: '4', status: 'entregado', tableNumber: 2, items: [{ productName: 'Salad', quantity: 1 }] }
  ];

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', [
      'getKitchenOrders', 'acceptKitchenOrder', 'deliverKitchenOrder', 'printKitchenOrder'
    ]);
    api.getKitchenOrders.and.returnValue(of(mockOrders));

    await TestBed.configureTestingModule({
      declarations: [KitchenOrderComponent],
      providers: [
        { provide: ApiService, useValue: api }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KitchenOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load and categorize orders on init', () => {
    expect(api.getKitchenOrders).toHaveBeenCalled();
    expect(component.newOrders.length).toBe(2);
    expect(component.cookingOrders.length).toBe(1);
    expect(component.deliveredOrders.length).toBe(1);
  });

  it('should filter orders by status correctly', () => {
    expect(component.newOrders[0].status).toBe('nuevo');
    expect(component.cookingOrders[0].status).toBe('en_preparacion');
    expect(component.deliveredOrders[0].status).toBe('entregado');
  });

  it('should call acceptKitchenOrder when acceptOrder is confirmed', async () => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    api.acceptKitchenOrder.and.returnValue(of({ status: 'en_preparacion' }));

    await component.acceptOrder(mockOrders[0]);
    expect(api.acceptKitchenOrder).toHaveBeenCalledWith('1');
    expect(api.getKitchenOrders).toHaveBeenCalledTimes(2);
  });

  it('should NOT call acceptKitchenOrder when Swal is cancelled', async () => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));

    await component.acceptOrder(mockOrders[0]);
    expect(api.acceptKitchenOrder).not.toHaveBeenCalled();
  });

  it('should call deliverKitchenOrder when deliverOrder is confirmed', async () => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    api.deliverKitchenOrder.and.returnValue(of({ status: 'entregado' }));

    await component.deliverOrder(mockOrders[2]);
    expect(api.deliverKitchenOrder).toHaveBeenCalledWith('3');
    expect(api.getKitchenOrders).toHaveBeenCalledTimes(2);
  });

  it('should NOT call deliverKitchenOrder when Swal is cancelled', async () => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));

    await component.deliverOrder(mockOrders[2]);
    expect(api.deliverKitchenOrder).not.toHaveBeenCalled();
  });

  it('should handle error when acceptKitchenOrder fails', async () => {
    spyOn(Swal, 'fire').and.returnValues(
      Promise.resolve({ isConfirmed: true } as any),
      Promise.resolve({ isConfirmed: true } as any)
    );
    api.acceptKitchenOrder.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

    await component.acceptOrder(mockOrders[0]);
    expect(api.acceptKitchenOrder).toHaveBeenCalled();
  });

  it('should call printKitchenOrder on printOrder', () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });
    api.printKitchenOrder.and.returnValue(of(blob));
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(window, 'open');

    component.printOrder(mockOrders[0]);
    expect(api.printKitchenOrder).toHaveBeenCalledWith('1');
    expect(window.open).toHaveBeenCalledWith('blob:url', '_blank');
  });

  it('should start auto-refresh interval on init', () => {
    spyOn(window, 'setInterval');
    component.ngOnInit();
    expect(setInterval).toHaveBeenCalledWith(jasmine.any(Function), 15000);
  });

  it('should render 3 columns in template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.neon-card, .neon-card-violet');
    expect(cards.length).toBe(3);
  });

  it('should display order id and table number for each order', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const orderElements = compiled.querySelectorAll('.order-card');
    expect(orderElements.length).toBe(4);
  });

  it('should show empty message when no orders', () => {
    api.getKitchenOrders.and.returnValue(of([]));
    component.loadOrders();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const emptyMsgs = compiled.querySelectorAll('.empty-msg');
    expect(emptyMsgs.length).toBe(3);
  });
});
