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

  const mockItems = [
    { _id: 'i1', name: 'Servilletas', code: 'S-001', unit: 'paquete', stock: 12, minStock: 10, area: 'servicio' },
  ];

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', ['getIngredients', 'createIngredient', 'updateIngredient']);
    api.getIngredients.and.returnValue(of(mockItems));
    api.createIngredient.and.returnValue(of({ _id: 'i2' }));
    api.updateIngredient.and.returnValue(of({ _id: 'i1' }));

    await TestBed.configureTestingModule({
      declarations: [ServicioComponent],
      imports: [CommonModule, FormsModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();

    fixture = TestBed.createComponent(ServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load servicio ingredients on init', () => {
    expect(api.getIngredients).toHaveBeenCalledWith({ area: 'servicio' });
    expect(component.items.length).toBe(1);
  });

  it('should create ingredient with servicio area', () => {
    component.openForm();
    component.form.name = 'Velas';
    component.save();
    expect(api.createIngredient).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Velas', area: 'servicio' }));
  });

  it('should build order draft on confirm', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.showOrden).toBeTrue();
    expect(component.lineas.length).toBe(1);
  });

  it('should add a manual line when fields are enabled and confirmed', async () => {
    const Swal = await import('sweetalert2');
    spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.iniciarOrden();
    await new Promise(resolve => setTimeout(resolve, 0));
    const antes = component.lineas.length;
    component.agregarLinea();
    expect(component.agregando).toBeTrue();
    component.nuevaLinea.nombre = 'Velas';
    component.nuevaLinea.qty = 2;
    component.agregarLinea();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(component.lineas.length).toBe(antes + 1);
    expect(component.lineas[component.lineas.length - 1].nombre).toBe('Velas');
    expect(api.createIngredient).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: 'Velas', area: 'servicio' }));
  });
});
