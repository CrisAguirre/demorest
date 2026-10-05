import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { BarraComponent } from './barra.component';
import { ApiService } from '../../core/services/api.service';

describe('BarraComponent', () => {
  let component: BarraComponent;
  let fixture: ComponentFixture<BarraComponent>;
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
      declarations: [BarraComponent],
      imports: [CommonModule, FormsModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(BarraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with 24 example items', () => {
    expect(component).toBeTruthy();
    expect(component.items.length).toBe(24);
  });

  it('should flag items below minimum', () => {
    const vino = component.items.find(i => i.codigo === 'BB-002')!;
    expect(component.necesitaPedido(vino)).toBeTrue();
    expect(component.cantidadAPedir(vino)).toBe(2);
  });

  it('should update stock from the existencias window', () => {
    component.openExistencias();
    expect(component.showExistencias).toBeTrue();
    expect(component.existencias.length).toBe(24);
    component.existencias[0].stock = 99;
    component.guardarExistencias();
    expect(component.showExistencias).toBeFalse();
    expect(component.items[0].stock).toBe(99);
  });

  it('should create a new item with automatic code by category', () => {
    component.openExistencias();
    component.nuevoItem = { nombre: 'Tónica', categoria: 'Sin alcohol', ubicacion: 'Barra', unidad: 'caja', stock: 5, minStock: 2 };
    component.confirmarNuevoItem();
    const creado = component.items[component.items.length - 1];
    expect(creado.nombre).toBe('Tónica');
    expect(creado.codigo).toMatch(/^BB-\d{3}$/);
    expect(component.existencias.length).toBe(25);
  });

  it('should assign the next free code without gaps via Agregar ítem', () => {
    // BB-001..018 están todos ocupados -> BB-019; BI-001..006 -> BI-007
    expect(component.siguienteCodigo('Sin alcohol')).toBe('BB-019');
    expect(component.siguienteCodigo('Insumos')).toBe('BI-007');
    component.openForm();
    component.form = { nombre: 'Ginger beer', categoria: 'Sin alcohol', ubicacion: 'Barra', unidad: 'caja', stock: 3, minStock: 2 };
    component.save();
    expect(component.items[component.items.length - 1].codigo).toBe('BB-019');
  });

  it('should reassign a freed code to the next added item', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    const idx = component.items.findIndex(i => i.codigo === 'BB-002');
    component.eliminar(idx);
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.items.some(i => i.codigo === 'BB-002')).toBeFalse();
    expect(component.siguienteCodigo('Licores y vinos')).toBe('BB-002');
  });

  it('should ask for category when keeping a requisition item in inventory', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.callFake((opts: any) => {
      if (opts && opts.input === 'select') {
        return Promise.resolve({ isConfirmed: true, value: 'Cervezas' } as any);
      }
      return Promise.resolve({ isConfirmed: true } as any);
    });
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    component.agregarLinea();
    component.nuevaLinea.nombre = 'Maltín';
    component.nuevaLinea.qty = 2;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    const creado = component.items.find(i => i.nombre === 'Maltín');
    expect(creado).toBeTruthy();
    expect(creado!.categoria).toBe('Cervezas');
    expect(creado!.codigo).toMatch(/^BB-\d{3}$/);
  });

  it('should build order draft on confirm', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.showOrden).toBeTrue();
    expect(component.lineas.length).toBe(24);
  });

  it('should add manual line and keep it locally on Si', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    component.agregarLinea();
    component.nuevaLinea.nombre = 'Tónica';
    component.nuevaLinea.qty = 4;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.lineas.some(l => l.nombre === 'Tónica')).toBeTrue();
    expect(component.items.some(i => i.nombre === 'Tónica')).toBeTrue();
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
      _id: '64f1a2b3c4d5e6f789012345', code: 'BB-001', name: 'Ron Viejo de Caldas 750ml',
      categoria: 'Licores y vinos', ubicacion: 'Cava', unit: 'botella', stock: 6, minStock: 4,
      ...over
    });

    it('should load items from backend', () => {
      api.getIngredients.and.returnValue(of([doc()]));
      component.cargarInventario();
      expect(component.usandoBackend).toBeTrue();
      expect(component.items.length).toBe(1);
      expect(component.items[0].categoria).toBe('Licores y vinos');
    });

    it('should persist a rename to backend so recipes see it', () => {
      component.usandoBackend = true;
      component.items = [doc()].map((d: any) => (component as any).desdeBackend(d));
      api.updateIngredient.and.returnValue(of(doc({ name: 'Ron Viejo 1000ml' })));
      component.edit(0);
      component.form.nombre = 'Ron Viejo 1000ml';
      component.save();
      expect(api.updateIngredient).toHaveBeenCalledWith(
        '64f1a2b3c4d5e6f789012345',
        jasmine.objectContaining({ name: 'Ron Viejo 1000ml', code: 'BB-001' })
      );
      expect(component.items[0].nombre).toBe('Ron Viejo 1000ml');
    });
  });
});
