import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MesasComponent } from './mesas.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('MesasComponent', () => {
  let component: MesasComponent;
  let fixture: ComponentFixture<MesasComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let navigateSpy: jasmine.Spy;

  function makeMockTables() {
    return [
      { _id: 't1', number: 1, zona: 'Salón 1', status: 'libre', isOccupied: false, currentSale: null },
      { _id: 't2', number: 2, zona: 'Salón 1', status: 'ocupada', isOccupied: true, currentSale: { _id: 's1', total: 25000 } },
      { _id: 't3', number: 10, zona: 'Salón 2', status: 'reservada', isOccupied: false, currentSale: null, currentReservation: { _id: 'r1', customerName: 'Juan' } },
      { _id: 't0', number: 0, zona: 'Para llevar', status: 'libre', isOccupied: false, currentSale: null }
    ];
  }

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiService', [
      'getTables', 'freeTable', 'createReservation', 'completeReservation', 'cancelReservation', 'cancelSale'
    ]);
    api.getTables.and.callFake(() => of(makeMockTables()));
    api.freeTable.and.returnValue(of({}));
    api.cancelSale.and.returnValue(of({ _id: 's1', status: 'cancelada' }));

    navigateSpy = jasmine.createSpy('navigate');

    await TestBed.configureTestingModule({
      declarations: [MesasComponent],
      imports: [CommonModule],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: AuthService, useValue: { currentUser: { role: 'admin', name: 'Admin' } } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MesasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tables on init', () => {
    expect(api.getTables).toHaveBeenCalled();
    expect(component.tables.length).toBe(4);
  });

  it('should filter tables by status', () => {
    component.filtro = 'ocupada';
    expect(component.mesasFiltradas.length).toBe(1);
    expect(component.mesasFiltradas[0].number).toBe(2);
    component.filtro = 'libre';
    expect(component.mesasFiltradas.length).toBe(2);
  });

  it('should count only the 16 tables (takeout excluded)', () => {
    expect(component.libres).toBe(1);
    expect(component.ocupadas).toBe(1);
    expect(component.reservadas).toBe(1);
  });

  it('should group tables by salon in order', () => {
    const grupos = component.grupos;
    expect(grupos.map(g => g.nombre)).toEqual(['Salón 1', 'Salón 2']);
    expect(grupos[0].mesas.length).toBe(2);
    expect(grupos[1].mesas[0].number).toBe(10);
  });

  it('should expose takeout separately from table groups', () => {
    expect(component.paraLlevar.number).toBe(0);
    expect(component.grupos.every(g => g.nombre !== 'Para llevar')).toBeTrue();
  });

  it('should navigate to pos when free table pedido is confirmed', async () => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.onTableClick(component.tables[0]);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(navigateSpy).toHaveBeenCalledWith(['/pos'], { queryParams: { table: 1 } });
  });

  it('should navigate to pos when occupied table ver pedido is confirmed', async () => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.onTableClick(component.tables[1]);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(navigateSpy).toHaveBeenCalledWith(['/pos'], { queryParams: { table: 2 } });
    expect(api.freeTable).not.toHaveBeenCalled();
  });

  it('should clear the table draft when freeing the table', async () => {
    localStorage.setItem('pos-borradores', JSON.stringify({ '2': [{ productName: 'P' }], '5': [{ productName: 'Q' }] }));
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    component.confirmFreeTable(component.tables[1]);
    await new Promise(resolve => setTimeout(resolve, 0));
    const b = JSON.parse(localStorage.getItem('pos-borradores') || '{}');
    expect(b['2']).toBeUndefined();
    expect(b['5'].length).toBe(1);
  });

  it('should clear the table draft when annulling the sale', async () => {
    localStorage.setItem('pos-borradores', JSON.stringify({ '2': [{ productName: 'P' }] }));
    const fireSpy = spyOn(Swal, 'fire');
    fireSpy.withArgs(jasmine.objectContaining({ confirmButtonText: '🧾 Ver pedido' }))
      .and.returnValue(Promise.resolve({ isDenied: true } as any));
    fireSpy.and.returnValue(Promise.resolve({ isConfirmed: true, value: 'se fue' } as any));
    component.onTableClick(component.tables[1]);
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(api.cancelSale).toHaveBeenCalledWith('s1', { reason: 'se fue' });
    expect(api.freeTable).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('pos-borradores')).toBe('{}');
  });

  it('should free occupied table when liberar is chosen and confirmed', async () => {
    const fireSpy = spyOn(Swal, 'fire');
    fireSpy.and.callFake((opts: any) => {
      if (opts && opts.confirmButtonText === '🧾 Ver pedido') {
        return Promise.resolve({ isDenied: true } as any);
      }
      if (opts && opts.title && String(opts.title).includes('Anular')) {
        return Promise.resolve({ isConfirmed: false } as any);
      }
      return Promise.resolve({ isConfirmed: true } as any);
    });
    // Simular clic en el enlace "Liberar mesa sin anular" del footer
    component.confirmFreeTable(component.tables[1]);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(api.freeTable).toHaveBeenCalledWith('t2');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should NOT call freeTable when dialog is cancelled', async () => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));
    component.onTableClick(component.tables[1]);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(api.freeTable).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
