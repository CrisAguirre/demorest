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

  const mockItems = [
    { _id: 'i1', name: 'Pescado', code: 'CP-001', unit: 'g', stock: 500, minStock: 1000, area: 'cocina' },
    { _id: 'i2', name: 'Sal', code: 'CA-001', unit: 'g', stock: 2000, minStock: 300, area: 'cocina' },
  ];

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', ['getIngredients', 'createIngredient', 'updateIngredient']);
    api.getIngredients.and.returnValue(of(mockItems));
    api.createIngredient.and.returnValue(of({ _id: 'i3' }));
    api.updateIngredient.and.returnValue(of({ _id: 'i1' }));

    await TestBed.configureTestingModule({
      declarations: [CocinaComponent],
      imports: [CommonModule, FormsModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(CocinaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load cocina ingredients on init', () => {
    expect(api.getIngredients).toHaveBeenCalledWith({ area: 'cocina' });
    expect(component.items.length).toBe(2);
  });

  it('should filter out other areas and infer area by code', () => {
    api.getIngredients.and.returnValue(of([
      { _id: 'a', name: 'Pisco', code: 'BB-001', unit: 'botella', stock: 1, minStock: 2 },
      { _id: 'b', name: 'Vino', unit: 'botella', stock: 1, minStock: 2, area: 'barra' },
      { _id: 'c', name: 'Sal', unit: 'g', stock: 5, minStock: 1 },
    ]));
    component.load();
    expect(component.items.length).toBe(1);
    expect(component.items[0].name).toBe('Sal');
  });

  it('should flag items below minimum', () => {
    expect(component.necesitaPedido(mockItems[0])).toBeTrue();
    expect(component.necesitaPedido(mockItems[1])).toBeFalse();
    expect(component.cantidadAPedir(mockItems[0])).toBe(500);
  });

  it('should create ingredient with cocina area', () => {
    component.openForm();
    component.form.name = 'Ajo';
    component.save();
    expect(api.createIngredient).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Ajo', area: 'cocina' }));
  });

  it('should update ingredient on save when editing', () => {
    component.edit(mockItems[0]);
    component.save();
    expect(api.updateIngredient).toHaveBeenCalledWith('i1', jasmine.objectContaining({ name: 'Pescado' }));
  });

  it('should build order draft on confirm', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.showOrden).toBeTrue();
    expect(component.lineas.length).toBe(2);
    expect(component.lineas[0].qty).toBe(500);
    expect(component.lineas[0].incluir).toBeTrue();
    expect(component.lineas[1].incluir).toBeFalse();
  });

  it('should confirm selected order lines', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    component.confirmarOrden();
    expect(component.ordenConfirmada.length).toBe(1);
    expect(component.showOrden).toBeFalse();
  });

  it('should add a manual line when fields are enabled and confirmed', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    const antes = component.lineas.length;
    component.agregarLinea();
    expect(component.agregando).toBeTrue();
    expect(component.lineas.length).toBe(antes);
    component.nuevaLinea.nombre = 'Ajo';
    component.nuevaLinea.qty = 5;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.lineas.length).toBe(antes + 1);
    expect(component.lineas[component.lineas.length - 1].nombre).toBe('Ajo');
    expect(component.agregando).toBeTrue();
  });

  it('should not add a manual line without name', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    const antes = component.lineas.length;
    component.agregarLinea();
    component.nuevaLinea.qty = 3;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.lineas.length).toBe(antes);
  });

  it('should cancel manual entry with the x button', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    const antes = component.lineas.length;
    component.agregarLinea();
    component.nuevaLinea.nombre = 'Ajo';
    component.cancelarAgregar();
    expect(component.agregando).toBeFalse();
    expect(component.lineas.length).toBe(antes);
  });

  it('should keep the item in inventory when confirmed with Si', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    component.agregarLinea();
    component.nuevaLinea.nombre = 'Ajo';
    component.nuevaLinea.qty = 5;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(api.createIngredient).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: 'Ajo', area: 'cocina' }));
    expect(component.lineas[component.lineas.length - 1].nombre).toBe('Ajo');
  });

  it('should add only to the order when answered No', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.callFake((opts: any) => {
      if (opts && opts.title && String(opts.title).includes('conservar')) {
        return Promise.resolve({ dismiss: Swal.default.DismissReason.cancel } as any);
      }
      return Promise.resolve({ isConfirmed: true } as any);
    });
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    const antes = component.lineas.length;
    (api.createIngredient as jasmine.Spy).calls.reset();
    component.agregarLinea();
    component.nuevaLinea.nombre = 'Ajo';
    component.nuevaLinea.qty = 5;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(api.createIngredient).not.toHaveBeenCalled();
    expect(component.lineas.length).toBe(antes + 1);
  });
});
