import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioComponent } from './servicio.component';

describe('ServicioComponent', () => {
  let component: ServicioComponent;
  let fixture: ComponentFixture<ServicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ServicioComponent],
      imports: [CommonModule, FormsModule]
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
});
