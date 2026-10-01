import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { PurchasesComponent } from './purchases.component';
import { ApiService } from '../../core/services/api.service';
import { enviarRequisicion, leerRequisiciones } from './requisiciones.store';

describe('PurchasesComponent requisiciones', () => {
  let component: PurchasesComponent;
  let fixture: ComponentFixture<PurchasesComponent>;
  const apiSpy = jasmine.createSpyObj('ApiService', [
    'getSuppliers', 'getProducts', 'getIngredients', 'getPurchases', 'createPurchase', 'updatePurchaseStatus'
  ]);

  beforeEach(async () => {
    localStorage.clear();
    apiSpy.getSuppliers.and.returnValue(of([]));
    apiSpy.getProducts.and.returnValue(of([]));
    apiSpy.getIngredients.and.returnValue(of([]));
    apiSpy.getPurchases.and.returnValue(of({ purchases: [], pages: 1 }));
    apiSpy.createPurchase.and.returnValue(of({ _id: 'p1' }));
    apiSpy.updatePurchaseStatus.and.returnValue(of({ _id: 'p1', status: 'recibida' }));
    apiSpy.createPurchase.calls.reset();
    apiSpy.updatePurchaseStatus.calls.reset();
    apiSpy.getPurchases.calls.reset();
    await TestBed.configureTestingModule({
      declarations: [PurchasesComponent],
      imports: [CommonModule, FormsModule],
      providers: [{ provide: ApiService, useValue: apiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(PurchasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with empty inbox', () => {
    expect(component).toBeTruthy();
    expect(component.vista).toBe('compras');
    expect(component.pendientesReq).toBe(0);
  });

  it('should upload local requisitions to backend on load', () => {
    enviarRequisicion('cocina', [{ codigo: 'CP-002', nombre: 'Pechuga de pollo', cantidad: 4000, unidad: 'g' }]);
    enviarRequisicion('barra', [{ codigo: '', nombre: 'Hielo', cantidad: 5, unidad: 'unidades' }]);
    component.cargarReqs();
    expect(apiSpy.createPurchase).toHaveBeenCalledTimes(2);
    expect(apiSpy.createPurchase).toHaveBeenCalledWith(jasmine.objectContaining({ origen: 'requisicion', area: 'cocina' }));
    expect(leerRequisiciones().length).toBe(0);
  });

  it('should keep locals when offline', () => {
    apiSpy.createPurchase.and.returnValue(throwError(() => new Error('offline')));
    enviarRequisicion('cocina', [{ codigo: 'CP-002', nombre: 'Pechuga', cantidad: 1, unidad: 'g' }]);
    component.cargarReqs();
    expect(component.pendientesReq).toBe(1);
    expect(leerRequisiciones().length).toBe(1);
  });

  it('should manage states and delete', () => {
    apiSpy.createPurchase.and.returnValue(throwError(() => new Error('offline')));
    const r = enviarRequisicion('servicio', [{ codigo: 'S-01', nombre: 'Servilletas', cantidad: 100, unidad: 'unidades' }]);
    component.cargarReqs();
    component.atenderReq(r.id);
    expect(component.pendientesReq).toBe(0);
    expect(leerRequisiciones()[0].estado).toBe('atendida');
    component.reabrirReq(r.id);
    expect(component.pendientesReq).toBe(1);
    component.descartarReq(r.id);
    expect(component.pendientesReq).toBe(0);
    component.borrarReq(r.id);
    expect(leerRequisiciones().length).toBe(0);
  });

  it('should label areas and states', () => {
    expect(component.areaLabel('cocina')).toContain('Cocina');
    expect(component.reqEstadoLabel('pendiente')).toContain('Pendiente');
  });

  it('should merge backend requisitions and receive them (stock via API)', () => {
    apiSpy.getPurchases.and.returnValue(of({ purchases: [{
      _id: 'b1', area: 'cocina', createdAt: new Date().toISOString(), status: 'pendiente',
      items: [{ itemName: 'Papa', quantity: 5, unit: 'g' }]
    }], pages: 1 }));
    component.cargarReqs();
    expect(component.requisiciones.length).toBe(1);
    expect(component.pendientesReq).toBe(1);
    component.atenderReq('b1');
    expect(apiSpy.updatePurchaseStatus).toHaveBeenCalledWith('b1', 'recibida');
  });
});
