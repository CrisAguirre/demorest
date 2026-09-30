import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { EventsComponent } from './events.component';
import { ApiService } from '../../core/services/api.service';

describe('EventsComponent', () => {
  let component: EventsComponent;
  let fixture: ComponentFixture<EventsComponent>;
  const apiSpy = jasmine.createSpyObj('ApiService', ['getEvents']);

  const mkEv = (over: any = {}) => ({
    _id: 'e1', customerName: 'Cliente Prueba', eventType: 'evento_local',
    eventDate: new Date(2026, 8, 28, 18, 0).toISOString(),
    endDate: new Date(2026, 8, 28, 22, 0).toISOString(),
    status: 'pendiente', numberOfAttendees: 10, totalCost: 100, payments: [],
    ...over
  });

  beforeEach(async () => {
    apiSpy.getEvents.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      declarations: [EventsComponent],
      imports: [CommonModule, FormsModule],
      providers: [{ provide: ApiService, useValue: apiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in month view', () => {
    expect(component).toBeTruthy();
    expect(component.viewMode).toBe('mes');
  });

  it('should filter by tab, client and status', () => {
    component.events = [
      mkEv({}),
      mkEv({ _id: 'e2', eventType: 'catering_externo', customerName: 'Empresa X', status: 'confirmado' })
    ];
    expect(component.eventosFiltrados.length).toBe(1);
    component.filtroCliente = 'empresa';
    component.vista = 'catering';
    expect(component.eventosFiltrados.length).toBe(1);
    component.filtroEstado = 'pendiente';
    expect(component.eventosFiltrados.length).toBe(0);
  });

  it('should build week with 7 days and group events', () => {
    component.events = [mkEv({})];
    component.anchorDate = new Date(2026, 8, 28); // lunes
    const sem = component.diasSemana;
    expect(sem.length).toBe(7);
    expect(sem[0].key).toBe('2026-09-28');
    expect(sem[0].eventos.length).toBe(1);
  });

  it('should open drawer on single event and ask on empty day', async () => {
    const ev = mkEv({});
    component.abrirDia({ date: new Date(2026, 8, 28), eventos: [ev] });
    expect(component.showDrawer).toBeTrue();
    expect(component.selectedEv).toBe(ev);

    const Swal = await import('sweetalert2');
    const fire = spyOn(Swal.default, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true }) as any);
    const formSpy = spyOn(component, 'openForm');
    component.vista = 'evento';
    component.abrirDia({ date: new Date(2026, 8, 29), eventos: [] });
    await Promise.resolve();
    expect(fire).toHaveBeenCalled();
    expect(formSpy).toHaveBeenCalled();
    const prefill = formSpy.calls.mostRecent().args[1] as Date;
    expect(prefill.getDate()).toBe(29);
  });

  it('should prefill date when creating from empty day', () => {
    component.openForm(undefined, new Date(2026, 8, 29));
    expect(component.showForm).toBeTrue();
    expect(component.form.fechaEvento).toBe('2026-09-29');
    expect(component.form.horaInicio).toBe('12:00');
  });

  it('should navigate title per view', () => {
    component.setView('dia');
    component.anchorDate = new Date(2026, 8, 28);
    expect(component.tituloVista()).toContain('2026');
    component.setView('semana');
    expect(component.tituloVista()).toContain('Semana');
    component.setView('mes');
    expect(component.tituloVista()).toContain('2026');
  });
});
