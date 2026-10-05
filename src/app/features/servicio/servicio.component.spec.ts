import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ServicioComponent } from './servicio.component';
import { ApiService } from '../../core/services/api.service';

describe('ServicioComponent', () => {
  let component: ServicioComponent;
  let fixture: ComponentFixture<ServicioComponent>;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', [
      'createPurchase', 'getIngredients', 'createIngredient', 'updateIngredient', 'deleteIngredient'
    ]);
    api.createPurchase.and.returnValue(of({ _id: 'p1' }));
    api.getIngredients.and.returnValue(of([]));
    api.createIngredient.and.returnValue(of({}));
    api.updateIngredient.and.returnValue(of({}));
    api.deleteIngredient.and.returnValue(of({}));
    await TestBed.configureTestingModule({
      declarations: [ServicioComponent],
      imports: [CommonModule, FormsModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(ServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with 20 example items', () => {
    expect(component).toBeTruthy();
    expect(component.items.length).toBe(20);
  });

  it('should flag items below minimum', () => {
    const velas = component.items.find(i => i.codigo === 'S-012')!;
    expect(component.necesitaPedido(velas)).toBeTrue();
    expect(component.cantidadAPedir(velas)).toBe(2);
  });

  it('should update stock from the existencias window', () => {
    component.openExistencias();
    expect(component.showExistencias).toBeTrue();
    expect(component.existencias.length).toBe(20);
    component.existencias[0].stock = 99;
    component.guardarExistencias();
    expect(component.showExistencias).toBeFalse();
    expect(component.items[0].stock).toBe(99);
  });

  it('should create a new item with automatic code by category', () => {
    component.openExistencias();
    component.nuevoItem = { nombre: 'Jabón', categoria: 'Limpieza', ubicacion: 'Bodega', unidad: 'unidad', stock: 4, minStock: 2 };
    component.confirmarNuevoItem();
    const creado = component.items[component.items.length - 1];
    expect(creado.nombre).toBe('Jabón');
    expect(creado.codigo).toMatch(/^S-\d{3}$/);
    expect(component.existencias.length).toBe(21);
  });

  it('should assign the next free code without gaps via Agregar ítem', () => {
    // S-001..020 ocupados -> S-021
    expect(component.siguienteCodigo('Desechables')).toBe('S-021');
    component.openForm();
    component.form = { nombre: 'Recogedor', categoria: 'Limpieza', ubicacion: 'Bodega', unidad: 'unidad', stock: 1, minStock: 1 };
    component.save();
    expect(component.items[component.items.length - 1].codigo).toBe('S-021');
  });

  it('should reassign a freed code to the next added item', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    const idx = component.items.findIndex(i => i.codigo === 'S-005');
    component.eliminar(idx);
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.items.some(i => i.codigo === 'S-005')).toBeFalse();
    expect(component.siguienteCodigo('Baño')).toBe('S-005');
  });

  it('should ask for category when keeping a requisition item in inventory', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.callFake((opts: any) => {
      if (opts && opts.input === 'select') {
        return Promise.resolve({ isConfirmed: true, value: 'Baño' } as any);
      }
      return Promise.resolve({ isConfirmed: true } as any);
    });
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    component.agregarLinea();
    component.nuevaLinea.nombre = 'Jabón extra';
    component.nuevaLinea.qty = 2;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    const creado = component.items.find(i => i.nombre === 'Jabón extra');
    expect(creado).toBeTruthy();
    expect(creado!.categoria).toBe('Baño');
    expect(creado!.codigo).toMatch(/^S-\d{3}$/);
  });

  it('should build order draft on confirm', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.showOrden).toBeTrue();
    expect(component.lineas.length).toBe(20);
  });

  it('should add manual line and keep it locally on Si', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    component.agregarLinea();
    component.nuevaLinea.nombre = 'Jabón';
    component.nuevaLinea.qty = 2;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.lineas.some(l => l.nombre === 'Jabón')).toBeTrue();
    expect(component.items.some(i => i.nombre === 'Jabón')).toBeTrue();
  });

  it('should confirm selected order lines', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    component.confirmarOrden();
    expect(component.ordenConfirmada.length).toBeGreaterThan(0);
    expect(component.showOrden).toBeFalse();
  });

  describe('inventario central (backend)', () => {
    const doc = (over: any = {}) => ({
      _id: '64f1a2b3c4d5e6f789012345', code: 'S-001', name: 'Servilletas',
      categoria: 'Desechables', ubicacion: 'Bodega', unit: 'paquete', stock: 12, minStock: 10,
      ...over
    });

    it('should load items from backend', () => {
      api.getIngredients.and.returnValue(of([doc()]));
      component.cargarInventario();
      expect(component.usandoBackend).toBeTrue();
      expect(component.items.length).toBe(1);
      expect(component.items[0].categoria).toBe('Desechables');
    });

    it('should persist a rename to backend so recipes see it', () => {
      component.usandoBackend = true;
      component.items = [doc()].map((d: any) => (component as any).desdeBackend(d));
      api.updateIngredient.and.returnValue(of(doc({ name: 'Servilletas extra' })));
      component.edit(0);
      component.form.nombre = 'Servilletas extra';
      component.save();
      expect(api.updateIngredient).toHaveBeenCalledWith(
        '64f1a2b3c4d5e6f789012345',
        jasmine.objectContaining({ name: 'Servilletas extra', code: 'S-001' })
      );
      expect(component.items[0].nombre).toBe('Servilletas extra');
    });
  });
});
