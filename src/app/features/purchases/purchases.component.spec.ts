import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { PurchasesComponent } from './purchases.component';
import { ApiService } from '../../core/services/api.service';
import { enviarRequisicion, leerRequisiciones } from './requisiciones.store';

describe('PurchasesComponent requisiciones', () => {
  let component: PurchasesComponent;
  let fixture: ComponentFixture<PurchasesComponent>;
  const apiSpy = jasmine.createSpyObj('ApiService', [
    'getSuppliers', 'getProducts', 'getIngredients', 'getPurchases'
  ]);

  beforeEach(async () => {
    localStorage.clear();
    apiSpy.getSuppliers.and.returnValue(of([]));
    apiSpy.getProducts.and.returnValue(of([]));
    apiSpy.getIngredients.and.returnValue(of([]));
    apiSpy.getPurchases.and.returnValue(of({ purchases: [], pages: 1 }));
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

  it('should receive requisitions sent from areas', () => {
    enviarRequisicion('cocina', [{ codigo: 'CP-002', nombre: 'Pechuga de pollo', cantidad: 4000, unidad: 'g' }]);
    enviarRequisicion('barra', [{ codigo: '', nombre: 'Hielo', cantidad: 5, unidad: 'unidades' }]);
    component.cargarReqs();
    expect(component.pendientesReq).toBe(2);
    expect(component.requisiciones[0].area).toBe('barra');
  });

  it('should manage states and delete', () => {
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
});
