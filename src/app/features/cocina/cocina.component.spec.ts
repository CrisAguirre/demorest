import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CocinaComponent } from './cocina.component';

describe('CocinaComponent', () => {
  let component: CocinaComponent;
  let fixture: ComponentFixture<CocinaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CocinaComponent],
      imports: [CommonModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CocinaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with 20 example items', () => {
    expect(component).toBeTruthy();
    expect(component.items.length).toBe(20);
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
    expect(component.items.length).toBe(21);
    component.edit(20);
    component.form.stock = 5;
    component.save();
    expect(component.items[20].stock).toBe(5);
  });

  it('should build order draft on confirm', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.showOrden).toBeTrue();
    expect(component.lineas.length).toBe(20);
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
    expect(component.existencias.length).toBe(20);
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
    expect(component.existencias.length).toBe(21);
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
});
