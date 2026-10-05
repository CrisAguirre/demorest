import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { CocinaComponent } from './cocina.component';
import { ApiService } from '../../core/services/api.service';

describe('CocinaComponent', () => {
  let component: CocinaComponent;
  let fixture: ComponentFixture<CocinaComponent>;
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
      declarations: [CocinaComponent],
      imports: [CommonModule, FormsModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(CocinaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with 55 example items', () => {
    expect(component).toBeTruthy();
    expect(component.items.length).toBe(55);
  });

  it('should flag items below minimum', () => {
    const camote = component.items.find(i => i.codigo === 'CF-008')!;
    expect(component.necesitaPedido(camote)).toBeTrue();
    expect(component.cantidadAPedir(camote)).toBe(400);
    const sal = component.items.find(i => i.codigo === 'CA-001')!;
    expect(component.necesitaPedido(sal)).toBeFalse();
  });

  it('should create and edit items locally', () => {
    component.openForm();
    component.form = { nombre: 'Ajo', categoria: 'Verduras y frutas', unidad: 'g', stock: 1, minStock: 2 };
    component.save();
    expect(component.items.length).toBe(56);
    const creado = component.items[55];
    expect(creado.codigo).toMatch(/^CF-\d{3}$/);
    component.edit(55);
    component.form.stock = 5;
    component.save();
    expect(component.items[55].stock).toBe(5);
    expect(component.items[55].codigo).toBe(creado.codigo);
  });

  it('should reuse the smallest free number per prefix without gaps', () => {
    // Abarrotes tiene CA-001..004 y salta a CA-008: el primero libre es CA-005
    expect(component.siguienteCodigo('Abarrotes')).toBe('CA-005');
  });

  it('should reassign a freed code to the next added item', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    const idx = component.items.findIndex(i => i.codigo === 'CA-002');
    expect(idx).toBeGreaterThanOrEqual(0);
    component.eliminar(idx);
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.items.some(i => i.codigo === 'CA-002')).toBeFalse();
    expect(component.siguienteCodigo('Abarrotes')).toBe('CA-002');
    component.openForm();
    component.form = { nombre: 'Nuevo abarrotes', categoria: 'Abarrotes', unidad: 'g', stock: 1, minStock: 1 };
    component.save();
    expect(component.items[component.items.length - 1].codigo).toBe('CA-002');
  });

  it('should reassign code when editing changes category', () => {
    const idx = component.items.findIndex(i => i.codigo === 'CA-001');
    component.edit(idx);
    component.form.categoria = 'Lácteos';
    component.save();
    // Lácteos tiene CL-001..004: el libre es CL-002? No: CL-001,002,003,004 existen -> CL-005
    expect(component.items[idx].codigo).toMatch(/^CL-\d{3}$/);
    expect(component.items[idx].categoria).toBe('Lácteos');
  });

  it('should ask for category when keeping a requisition item in inventory', async () => {
    const Swal = await import('sweetalert2');
    let llamadas = 0;
    spyOn(Swal.default, 'fire').and.callFake((opts: any) => {
      llamadas++;
      if (opts && opts.input === 'select') {
        return Promise.resolve({ isConfirmed: true, value: 'Lácteos' } as any);
      }
      return Promise.resolve({ isConfirmed: true } as any);
    });
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    component.agregarLinea();
    component.nuevaLinea.nombre = 'Queso fresco';
    component.nuevaLinea.qty = 2;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    const creado = component.items.find(i => i.nombre === 'Queso fresco');
    expect(creado).toBeTruthy();
    expect(creado!.categoria).toBe('Lácteos');
    expect(creado!.codigo).toMatch(/^CL-\d{3}$/);
    expect(llamadas).toBeGreaterThanOrEqual(2);
    expect(component.lineas.some(l => l.nombre === 'Queso fresco')).toBeTrue();
  });

  it('should build order draft on confirm', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.showOrden).toBeTrue();
    expect(component.lineas.length).toBe(55);
  });

  it('should add manual line and keep it in local inventory on Si', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    component.agregarLinea();
    component.nuevaLinea.nombre = 'Orégano';
    component.nuevaLinea.qty = 3;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.lineas.some(l => l.nombre === 'Orégano')).toBeTrue();
    expect(component.items.some(i => i.nombre === 'Orégano')).toBeTrue();
  });

  it('should add only to the order on No', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.callFake((opts: any) => {
      if (opts && opts.title && String(opts.title).includes('conservar')) {
        return Promise.resolve({ dismiss: Swal.default.DismissReason.cancel } as any);
      }
      return Promise.resolve({ isConfirmed: true } as any);
    });
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    const antesItems = component.items.length;
    const antesLineas = component.lineas.length;
    component.agregarLinea();
    component.nuevaLinea.nombre = 'Tomillo';
    component.nuevaLinea.qty = 2;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.lineas.length).toBe(antesLineas + 1);
    expect(component.items.length).toBe(antesItems);
  });

  it('should update stock from the existencias window', () => {
    component.openExistencias();
    expect(component.showExistencias).toBeTrue();
    expect(component.existencias.length).toBe(55);
    component.existencias[0].stock = 999;
    component.existencias[0].minStock = 111;
    component.guardarExistencias();
    expect(component.showExistencias).toBeFalse();
    expect(component.items[0].stock).toBe(999);
    expect(component.items[0].minStock).toBe(111);
  });

  it('should create a new item with automatic code by category', () => {
    component.openExistencias();
    component.nuevoItem = { nombre: 'Orégano', categoria: 'Abarrotes', ubicacion: 'Bodega', unidad: 'g', stock: 100, minStock: 50 };
    component.confirmarNuevoItem();
    const creado = component.items[component.items.length - 1];
    expect(creado.nombre).toBe('Orégano');
    expect(creado.codigo).toMatch(/^CA-\d{3}$/);
    expect(component.existencias.some(e => e._id === creado._id)).toBeTrue();
    expect(component.existencias.length).toBe(56);
  });

  it('should not create a new item without name', () => {
    component.openExistencias();
    const antes = component.items.length;
    component.nuevoItem = { nombre: '  ', categoria: 'Lácteos', unidad: 'g', stock: 0, minStock: 0 };
    component.confirmarNuevoItem();
    expect(component.items.length).toBe(antes);
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

  it('should send requisition to backend API', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    component.confirmarOrden();
    component.enviarACompras();
    expect(api.createPurchase).toHaveBeenCalledWith(jasmine.objectContaining({
      origen: 'requisicion', area: 'cocina', status: 'pendiente'
    }));
    expect(component.ordenConfirmada.length).toBe(0);
  });

  describe('inventario central (backend)', () => {
    const doc = (over: any = {}) => ({
      _id: '64f1a2b3c4d5e6f789012345', code: 'CP-001', name: 'Filete de pescado blanco',
      categoria: 'Proteínas', ubicacion: 'Refrigerador 1', unit: 'g', stock: 2500, minStock: 1000,
      ...over
    });

    it('should load items from backend and map categories', () => {
      api.getIngredients.and.returnValue(of([doc(), doc({ _id: '64f1a2b3c4d5e6f789012346', code: 'CA-001', name: 'Sal', categoria: 'Abarrotes', unit: 'g', stock: 1500, minStock: 300 })]));
      component.cargarInventario();
      expect(component.usandoBackend).toBeTrue();
      expect(component.items.length).toBe(2);
      expect(component.items[0].nombre).toBe('Filete de pescado blanco');
      expect(component.items[0].categoria).toBe('Proteínas');
    });

    it('should fall back to prefix category when backend doc has none', () => {
      api.getIngredients.and.returnValue(of([doc({ categoria: '' })]));
      component.cargarInventario();
      expect(component.items[0].categoria).toBe('Proteínas');
    });

    it('should stay local when backend is empty or unreachable', () => {
      api.getIngredients.and.returnValue(of([]));
      component.cargarInventario();
      expect(component.usandoBackend).toBeFalse();
      expect(component.items.length).toBe(55);
    });

    it('should persist a rename to backend so recipes see it', () => {
      component.usandoBackend = true;
      component.items = [doc()].map((d: any) => (component as any).desdeBackend(d));
      api.updateIngredient.and.returnValue(of(doc({ name: 'Filete de pescado 100g' })));
      component.edit(0);
      component.form.nombre = 'Filete de pescado 100g';
      component.save();
      expect(api.updateIngredient).toHaveBeenCalledWith(
        '64f1a2b3c4d5e6f789012345',
        jasmine.objectContaining({ name: 'Filete de pescado 100g', code: 'CP-001', categoria: 'Proteínas' })
      );
      expect(component.items[0].nombre).toBe('Filete de pescado 100g');
    });

    it('should create through backend when connected', () => {
      component.usandoBackend = true;
      component.items = [];
      api.createIngredient.and.returnValue(of(doc({ _id: '64f1a2b3c4d5e6f789012347', code: 'CP-001', name: 'Mero' }) as any));
      component.openForm();
      component.form = { nombre: 'Mero', categoria: 'Proteínas', unidad: 'g', stock: 1, minStock: 1 };
      component.save();
      expect(api.createIngredient).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'Mero', code: 'CP-001', area: 'cocina', categoria: 'Proteínas'
      }));
      expect(component.items.length).toBe(1);
      expect(component.items[0].nombre).toBe('Mero');
    });
  });
});
