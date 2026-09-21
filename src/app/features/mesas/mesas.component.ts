import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mesas',
  template: `
    <div class="page-header">
      <div>
        <h1>🪑 Mesas</h1>
        <p style="color:var(--text-muted);margin:0.25rem 0 0">
          {{ libres }} libres · {{ ocupadas }} ocupadas · {{ reservadas }} reservadas
        </p>
      </div>
    </div>

    <div class="filter-bar">
      <button class="filter-chip" [class.active]="filtro === ''" (click)="filtro = ''">Todas</button>
      <button class="filter-chip" [class.active]="filtro === 'libre'" (click)="filtro = 'libre'">🟢 Libres</button>
      <button class="filter-chip" [class.active]="filtro === 'ocupada'" (click)="filtro = 'ocupada'">🔴 Ocupadas</button>
      <button class="filter-chip" [class.active]="filtro === 'reservada'" (click)="filtro = 'reservada'">🟠 Reservadas</button>
    </div>

    <div class="neon-card" *ngFor="let g of grupos">
      <h3 class="zona-title">{{ g.icono }} {{ g.nombre }} <span class="zona-count">({{ g.mesas.length }})</span></h3>
      <div class="tables-grid">
        <div *ngFor="let t of g.mesas"
             class="table-item"
             [class.occupied]="t.status === 'ocupada'"
             [class.reserved]="t.status === 'reservada'"
             [class.takeout]="t.number === 0"
             (click)="onTableClick(t)">
          <div class="table-number" *ngIf="t.number !== 0">{{ t.number }}</div>
          <div class="table-number" *ngIf="t.number === 0">🛍️</div>
          <div class="table-status">{{ t.number === 0 ? 'Para llevar' : t.status }}</div>
          <div class="table-order" *ngIf="t.status === 'ocupada' && t.currentSale">
            #{{ t.currentSale?._id?.toString()?.slice(-6)?.toUpperCase() }}
          </div>
          <div class="table-order" *ngIf="t.status === 'ocupada' && t.currentSale?.total">
            \${{ t.currentSale.total | number:'1.0-0' }}
          </div>
          <div class="table-reservation-info" *ngIf="t.status === 'reservada' && t.currentReservation">
            {{ t.currentReservation?.customerName }}
            <br>
            {{ t.currentReservation?.date | date:'shortTime' }}
          </div>
        </div>
      </div>
    </div>
    <div class="neon-card" *ngIf="grupos.length === 0">
      <p style="color:var(--text-muted);text-align:center;padding:2rem">
        Sin mesas en este filtro
      </p>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .page-header h1 { margin: 0; }
    .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .filter-chip {
      padding: 0.4rem 0.9rem; border-radius: 20px; border: 1px solid var(--border);
      background: var(--bg-input); font-size: 0.8rem; cursor: pointer; color: var(--text-secondary);
    }
    .filter-chip.active { background: var(--brand-gold); color: #fff; border-color: var(--brand-gold); }
    .zona-title { margin: 0 0 1rem; font-size: 1.05rem; }
    .zona-count { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
    .neon-card { margin-bottom: 1.25rem; }
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .table-item {
      background: var(--bg-input);
      border: 1px solid #2E8B57;
      border-radius: var(--radius-sm);
      padding: 1rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      color: #2E8B57;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100px;
    }
    .table-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .table-item.occupied {
      border-color: #D32F2F;
      background: rgba(211, 47, 47, 0.05);
      color: #D32F2F;
    }
    .table-item.reserved {
      border-color: #FF8F00;
      background: rgba(255, 143, 0, 0.05);
      color: #FF8F00;
    }
    .table-item.takeout {
      border-color: var(--brand-gold);
      background: rgba(212, 175, 55, 0.05);
      color: var(--brand-gold);
    }
    .table-number {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .table-status {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .table-order {
      font-size: 0.65rem;
      margin-top: 0.2rem;
      opacity: 0.7;
      font-family: monospace;
    }
    .table-reservation-info {
      font-size: 0.65rem;
      margin-top: 0.4rem;
      font-weight: 500;
      line-height: 1.2;
    }
    @media (max-width: 600px) {
      .tables-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class MesasComponent implements OnInit {
  tables: any[] = [];
  filtro: '' | 'libre' | 'ocupada' | 'reservada' = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.api.getTables().subscribe({
      next: (res: any) => this.tables = res
    });
  }

  get mesasFiltradas(): any[] {
    if (!this.filtro) return this.tables;
    return this.tables.filter(t => t.status === this.filtro);
  }

  get grupos(): { nombre: string; icono: string; mesas: any[] }[] {
    const orden = ['Salón 1', 'Salón 2', 'Para llevar'];
    const iconos: Record<string, string> = { 'Salón 1': '🛋️', 'Salón 2': '🌿', 'Para llevar': '🛍️' };
    const mapa = new Map<string, any[]>();
    this.mesasFiltradas.forEach(t => {
      const zona = t.zona || (t.number === 0 ? 'Para llevar' : 'Salón 1');
      if (!mapa.has(zona)) mapa.set(zona, []);
      mapa.get(zona)!.push(t);
    });
    const conocidos = orden.filter(z => mapa.has(z)).map(z => ({ nombre: z, icono: iconos[z], mesas: mapa.get(z)! }));
    const extras = [...mapa.keys()].filter(z => !orden.includes(z)).map(z => ({ nombre: z, icono: '🪑', mesas: mapa.get(z)! }));
    return [...conocidos, ...extras];
  }

  get mesas(): any[] {
    return this.tables.filter(t => t.number !== 0);
  }

  get libres(): number { return this.mesas.filter(t => t.status === 'libre').length; }
  get ocupadas(): number { return this.mesas.filter(t => t.status === 'ocupada').length; }
  get reservadas(): number { return this.mesas.filter(t => t.status === 'reservada').length; }

  nombreMesa(table: any): string {
    return table.number === 0 ? 'Pedido para llevar' : `Mesa ${table.number}`;
  }

  onTableClick(table: any): void {
    if (table.status === 'libre') {
      Swal.fire({
        title: table.number === 0 ? 'Pedido para llevar' : `Mesa ${table.number} - Libre`,
        text: '¿Qué desea hacer?',
        icon: 'info',
        showCancelButton: true,
        showDenyButton: table.number !== 0,
        confirmButtonColor: '#2E8B57',
        denyButtonColor: '#FF8F00',
        confirmButtonText: '🛒 Pedido',
        denyButtonText: '📅 Reservar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/pos'], { queryParams: { table: table.number } });
        } else if (result.isDenied && table.number !== 0) {
          this.showReservationForm(table);
        }
      });
    } else if (table.status === 'ocupada') {
      const total = table.currentSale?.total;
      Swal.fire({
        title: `${this.nombreMesa(table)} - Ocupada`,
        html: total ? `<p>Consumo actual: <strong>$${total.toLocaleString('es-CO')}</strong></p><p>¿Qué desea hacer?</p>` : '¿Qué desea hacer?',
        icon: 'info',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: '#2E8B57',
        denyButtonColor: '#D32F2F',
        confirmButtonText: '🧾 Ver pedido',
        denyButtonText: '✅ Liberar mesa',
        cancelButtonText: 'Cerrar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/pos'], { queryParams: { table: table.number } });
        } else if (result.isDenied) {
          this.confirmFreeTable(table);
        }
      });
    } else if (table.status === 'reservada') {
      const resData = table.currentReservation;
      Swal.fire({
        title: `Mesa ${table.number} - Reservada`,
        html: `
          <div style="text-align: left; padding: 10px;">
            <p><strong>Cliente:</strong> ${resData?.customerName || 'N/A'}</p>
            <p><strong>Personas:</strong> ${resData?.numberOfPeople || 'N/A'}</p>
            <p><strong>Fecha/Hora:</strong> ${resData?.date ? new Date(resData.date).toLocaleString('es-CO') : 'N/A'}</p>
            ${resData?.notes ? `<p><strong>Notas:</strong> ${resData.notes}</p>` : ''}
          </div>
          <p>¿Qué desea hacer?</p>
        `,
        icon: 'info',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: '#2E8B57',
        denyButtonColor: '#D32F2F',
        confirmButtonText: '🛒 Iniciar Pedido',
        denyButtonText: '❌ Cancelar Reserva',
        cancelButtonText: 'Cerrar'
      }).then((result) => {
        if (result.isConfirmed) {
          if (resData?._id) {
            this.api.completeReservation(resData._id).subscribe({
              next: () => {
                this.router.navigate(['/pos'], { queryParams: { table: table.number } });
              }
            });
          } else {
             this.router.navigate(['/pos'], { queryParams: { table: table.number } });
          }
        } else if (result.isDenied) {
          if (resData?._id) {
            Swal.fire({
              title: '¿Confirmar cancelación?',
              text: 'La reserva será cancelada y la mesa quedará libre.',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#D32F2F',
              confirmButtonText: 'Sí, cancelar reserva'
            }).then((cancelResult) => {
              if (cancelResult.isConfirmed) {
                this.api.cancelReservation(resData._id).subscribe({
                  next: () => {
                    this.loadTables();
                    Swal.fire({ icon: 'success', title: 'Reserva cancelada', timer: 1500, showConfirmButton: false });
                  }
                });
              }
            });
          }
        }
      });
    }
  }

  confirmFreeTable(table: any): void {
    Swal.fire({
      title: `¿Liberar ${this.nombreMesa(table)}?`,
      text: 'La mesa será marcada como libre',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#D4AF37',
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.freeTable(table._id).subscribe({
          next: () => {
            this.loadTables();
            Swal.fire({ icon: 'success', title: 'Mesa liberada', timer: 1500, showConfirmButton: false });
          }
        });
      }
    });
  }

  showReservationForm(table: any): void {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minDateTime = now.toISOString().slice(0, 16);

    Swal.fire({
      title: `Reservar Mesa ${table.number}`,
      html: `
        <div style="display:flex; flex-direction:column; gap: 10px; text-align: left;">
          <div>
            <label style="font-weight:600; font-size: 0.85rem;">Nombre del Cliente *</label>
            <input type="text" id="res-name" class="swal2-input" style="margin:0; width:100%; box-sizing:border-box;" placeholder="Ej. Juan Pérez">
          </div>
          <div>
            <label style="font-weight:600; font-size: 0.85rem;">Número de Personas *</label>
            <input type="number" id="res-people" class="swal2-input" style="margin:0; width:100%; box-sizing:border-box;" min="1" value="2">
          </div>
          <div>
            <label style="font-weight:600; font-size: 0.85rem;">Fecha y Hora *</label>
            <input type="datetime-local" id="res-date" class="swal2-input" style="margin:0; width:100%; box-sizing:border-box;" min="${minDateTime}" value="${minDateTime}">
          </div>
          <div>
            <label style="font-weight:600; font-size: 0.85rem;">Anotaciones (Opcional)</label>
            <textarea id="res-notes" class="swal2-textarea" style="margin:0; width:100%; box-sizing:border-box;" rows="2" placeholder="Cumpleaños, alergias, etc."></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar Reserva',
      confirmButtonColor: '#FF8F00',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const name = (document.getElementById('res-name') as HTMLInputElement).value;
        const people = parseInt((document.getElementById('res-people') as HTMLInputElement).value, 10);
        const dateStr = (document.getElementById('res-date') as HTMLInputElement).value;
        const notes = (document.getElementById('res-notes') as HTMLTextAreaElement).value;

        if (!name) return Swal.showValidationMessage('El nombre es obligatorio');
        if (!people || people < 1) return Swal.showValidationMessage('El número de personas debe ser mayor a 0');
        if (!dateStr) return Swal.showValidationMessage('La fecha es obligatoria');

        return {
          table: table._id,
          customerName: name,
          numberOfPeople: people,
          date: new Date(dateStr),
          notes: notes
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.createReservation(result.value).subscribe({
          next: () => {
            this.loadTables();
            Swal.fire({ icon: 'success', title: 'Mesa reservada', timer: 1500, showConfirmButton: false });
          },
          error: (err: any) => {
            Swal.fire('❌ Error', err.error?.message || 'Error al reservar', 'error');
          }
        });
      }
    });
  }
}
