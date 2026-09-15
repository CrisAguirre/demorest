import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="page-header">
      <h1>👋 Bienvenido, {{ authService.currentUser?.name?.split(' ')?.[0] || '' }}</h1>
    </div>

    <!-- Mesas + Domicilios activos (lado a lado) -->
    <div class="top-grid mb-3">

      <!-- Mesas -->
      <div class="neon-card">
        <h3 style="margin-bottom:1rem">🪑 Estado de Mesas</h3>
        <div class="tables-grid">
           <div *ngFor="let t of tables" 
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
             <div class="table-reservation-info" *ngIf="t.status === 'reservada' && t.currentReservation">
               {{ t.currentReservation?.customerName }}
               <br>
               {{ t.currentReservation?.date | date:'shortTime' }}
             </div>
           </div>
        </div>
      </div>

      <!-- Domicilios Activos -->
      <div class="neon-card delivery-panel">
        <div class="delivery-panel-header">
          <h3>🛵 Domicilios Activos</h3>
          <span class="active-badge" *ngIf="activeDeliveries.length > 0">{{ activeDeliveries.length }}</span>
          <a routerLink="/domicilios" class="link-btn">Ver todos →</a>
        </div>

        <div *ngIf="loadingDeliveries" class="del-loading">Cargando...</div>

        <div *ngIf="!loadingDeliveries && activeDeliveries.length === 0" class="del-empty">
          <span style="font-size:1.75rem">🛵</span>
          <p>Sin domicilios activos</p>
        </div>

        <div class="del-list" *ngIf="!loadingDeliveries && activeDeliveries.length > 0">
          <div class="del-item" *ngFor="let d of activeDeliveries">
            <div class="del-status-dot" [class]="'dot-' + d.status"></div>
            <div class="del-body">
              <div class="del-name">{{ d.customerName }}</div>
              <div class="del-addr">📍 {{ d.customerAddress }}</div>
              <div class="del-items-txt" *ngIf="d.items?.length">
                {{ d.items.length }} ítem(s)
                <span *ngIf="d.items[0]"> · {{ d.items[0].productName }}{{ d.items.length > 1 ? ' +' + (d.items.length - 1) + ' más' : '' }}</span>
              </div>
            </div>
            <span class="del-status-badge" [class]="'status-' + d.status">{{ deliveryStatusLabel(d.status) }}</span>
          </div>
        </div>
      </div>

    </div>

    <div class="grid-4 mb-3">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(212,175,55,0.1)">💰</div>
        <div><div class="stat-value">\${{ todaySales | number:'1.0-0' }}</div><div class="stat-label">Ventas Hoy</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(124,77,255,0.1)">🧾</div>
        <div><div class="stat-value">{{ todayTransactions }}</div><div class="stat-label">Transacciones</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(0,230,118,0.1)">📦</div>
        <div><div class="stat-value">{{ totalProducts }}</div><div class="stat-label">Productos</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(255,23,68,0.1)">🔔</div>
        <div><div class="stat-value">{{ unreadAlerts }}</div><div class="stat-label">Alertas</div></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="neon-card">
        <h3 style="margin-bottom:1rem">📈 Ventas de la semana</h3>
        <canvas *ngIf="salesChartData" baseChart
          [datasets]="salesChartData" [labels]="salesChartLabels"
          [options]="chartOptions" type="bar">
        </canvas>
        <p *ngIf="!salesChartData" style="color:var(--text-muted);text-align:center;padding:2rem">
          Cargando datos...
        </p>
      </div>
      <div class="neon-card-violet">
        <h3 style="margin-bottom:1rem">⭐ Productos Estrella</h3>
        <div *ngFor="let p of topProducts; let i = index" class="top-product-item">
          <span class="top-rank">{{ i + 1 }}</span>
          <span class="top-name">{{ p.name }}</span>
          <span class="badge badge-cyan">{{ p.totalQuantity }} uds</span>
        </div>
        <p *ngIf="topProducts.length === 0" style="color:var(--text-muted);text-align:center;padding:2rem">
          Sin datos aún
        </p>
      </div>
    </div>
  `,
  styles: [`
    .mb-3 { margin-bottom: 1.5rem; }

    /* ─── Top layout: mesas + domicilios ─── */
    .top-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 1024px) { .top-grid { grid-template-columns: 1fr; } }

    /* ─── Delivery panel ─────────────────── */
    .delivery-panel { display: flex; flex-direction: column; min-height: 220px; }
    .delivery-panel-header {
      display: flex; align-items: center; gap: .6rem; margin-bottom: 1rem;
    }
    .delivery-panel-header h3 { margin: 0; flex: 1; }
    .active-badge {
      background: var(--brand-gold); color: #1a1a1a;
      border-radius: 50%; width: 22px; height: 22px;
      font-size: .72rem; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
    }
    .link-btn {
      font-size: .8rem; color: var(--brand-gold);
      text-decoration: none; font-weight: 600;
      padding: .25rem .5rem; border: 1px solid rgba(212,175,55,.3);
      border-radius: 6px; transition: all .2s;
    }
    .link-btn:hover { background: rgba(212,175,55,.1); }
    .del-loading, .del-empty {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: .5rem; color: var(--text-muted); font-size: .85rem; text-align: center;
    }
    .del-list { display: flex; flex-direction: column; gap: .6rem; overflow-y: auto; max-height: 320px; }
    .del-item {
      display: flex; align-items: flex-start; gap: .65rem;
      background: var(--bg-input); border-radius: 10px; padding: .65rem .75rem;
      border: 1px solid var(--border); transition: border-color .2s;
    }
    .del-item:hover { border-color: rgba(212,175,55,.25); }
    .del-status-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
    }
    .dot-pendiente    { background: #ffc800; box-shadow: 0 0 6px rgba(255,200,0,.5); }
    .dot-en_preparacion { background: #4299e1; box-shadow: 0 0 6px rgba(66,153,225,.5); }
    .dot-en_camino    { background: #48bb78; box-shadow: 0 0 6px rgba(72,187,120,.5); animation: pulse-dot 1.2s infinite; }
    @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.4} }
    .del-body { flex: 1; min-width: 0; }
    .del-name { font-weight: 700; font-size: .875rem; }
    .del-addr { font-size: .75rem; color: var(--text-muted); margin-top: .15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .del-items-txt { font-size: .72rem; color: var(--text-secondary); margin-top: .2rem; }
    .del-status-badge {
      font-size: .7rem; font-weight: 700; border-radius: 20px; padding: .2rem .55rem; white-space: nowrap; flex-shrink: 0;
    }
    .status-pendiente     { background: rgba(255,200,0,.15); color: #ffc800; }
    .status-en_preparacion { background: rgba(66,153,225,.15); color: #4299e1; }
    .status-en_camino     { background: rgba(72,187,120,.15); color: #48bb78; }

    .top-product-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.6rem 0; border-bottom: 1px solid var(--bg-input);
    }
    .top-product-item:last-child { border-bottom: none; }
    .top-rank {
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-gold), var(--brand-bronze));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
    }
    .top-name { flex: 1; font-size: 0.875rem; font-weight: 500; }
    
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .table-item {
      background: var(--bg-input);
      border: 1px solid #2E8B57; /* Verde para Libre */
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
      border-color: #D32F2F; /* Rojo para Ocupada */
      background: rgba(211, 47, 47, 0.05);
      color: #D32F2F;
    }
    .table-item.reserved {
      border-color: #FF8F00; /* Ámbar/Naranja para Reservada */
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
export class DashboardComponent implements OnInit {
  todaySales = 0;
  todayTransactions = 0;
  totalProducts = 0;
  unreadAlerts = 0;
  topProducts: any[] = [];
  salesChartData: any = null;
  salesChartLabels: string[] = [];
  tables: any[] = [];
  activeDeliveries: any[] = [];
  loadingDeliveries = true;
  chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(212,175,55,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  constructor(
    public authService: AuthService, 
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadTables();
    this.loadActiveDeliveries();
  }

  loadTables(): void {
    this.api.getTables().subscribe({
      next: (res: any) => this.tables = res
    });
  }

  loadActiveDeliveries(): void {
    this.loadingDeliveries = true;
    this.api.getAllDeliveries({ status: 'active' }).subscribe({
      next: (orders: any[]) => {
        this.activeDeliveries = orders.filter((o: any) =>
          ['pendiente', 'en_preparacion', 'en_camino'].includes(o.status)
        );
        this.loadingDeliveries = false;
      },
      error: () => { this.loadingDeliveries = false; }
    });
  }

  deliveryStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendiente:       '⏳ Pendiente',
      en_preparacion:  '👨‍🍳 Preparando',
      en_camino:       '🛵 En camino'
    };
    return labels[status] || status;
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
          // Pedido
          this.router.navigate(['/pos'], { queryParams: { table: table.number } });
        } else if (result.isDenied && table.number !== 0) {
          // Reservar
          this.showReservationForm(table);
        }
      });
    } else if (table.status === 'ocupada') {
      Swal.fire({
        title: `¿Liberar ${table.number === 0 ? 'Para llevar' : 'Mesa ' + table.number}?`,
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
          // Iniciar pedido = Completar reserva y navegar
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

  showReservationForm(table: any): void {
    const now = new Date();
    // formatear a YYYY-MM-DDThh:mm para el input datetime-local
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

  loadStats(): void {
    this.api.getSalesSummary('day').subscribe({
      next: (res: any) => {
        this.todaySales = res.totalRevenue || 0;
        this.todayTransactions = res.totalTransactions || 0;
      }
    });

    this.api.getProducts({ limit: 1 }).subscribe({
      next: (res: any) => this.totalProducts = res.total || 0
    });

    this.api.getAlerts({ read: 'false' }).subscribe({
      next: (res: any) => this.unreadAlerts = res.unread || 0
    });

    this.api.getTopProducts(5).subscribe({
      next: (res: any) => this.topProducts = res || []
    });

    this.api.getSalesSummary('week').subscribe({
      next: (res: any) => {
        const days = res.salesByDay || [];
        this.salesChartLabels = days.map((d: any) => {
          const date = new Date(d._id);
          return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
        });
        this.salesChartData = [{
          data: days.map((d: any) => d.total),
          backgroundColor: 'rgba(212,175,55,0.3)',
          borderColor: '#D4AF37',
          borderWidth: 2,
          borderRadius: 6
        }];
      }
    });
  }
}
