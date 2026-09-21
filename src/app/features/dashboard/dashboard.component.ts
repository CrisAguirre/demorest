import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="page-header">
      <h1>👋 Bienvenido, {{ authService.currentUser?.name?.split(' ')?.[0] || '' }}</h1>
    </div>

    <!-- Mesas (acceso) + Domicilios activos (lado a lado) -->
    <div class="top-grid mb-3">

      <!-- Acceso a Mesas -->
      <div class="neon-card mesas-link-card">
        <h3 style="margin-bottom:0.5rem">🪑 Mesas</h3>
        <p style="color:var(--text-muted);font-size:0.85rem;margin:0 0 1rem">
          Gestiona mesas, pedidos y reservas en el módulo Mesas.
        </p>
        <a routerLink="/mesas" class="link-btn link-btn-lg">Abrir Mesas →</a>
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
    .link-btn-lg { font-size: .9rem; padding: .5rem 1rem; display: inline-block; }
    .mesas-link-card { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; }
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
    
    @media (max-width: 600px) {
      .top-grid { grid-template-columns: 1fr; }
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
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadActiveDeliveries();
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
