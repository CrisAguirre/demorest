import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';
import { WebSocketService } from '@core/services/websocket.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-container">

      <!-- HEADER PRINCIPAL -->
      <header class="dash-header">
        <div class="header-left">
          <div class="welcome-row">
            <h1>👋 Bienvenido, {{ userName }}</h1>
            <span class="role-badge" [class]="'badge-' + userRole">
              {{ roleLabel }}
            </span>
          </div>
          <p class="dash-subtitle">
            {{ currentDate | date:'fullDate':'':'es-CO' }} · Estado general de la operación
          </p>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" (click)="refreshAll()" [disabled]="refreshing" title="Recargar datos">
            <span [class.spin]="refreshing">🔄</span> {{ refreshing ? 'Actualizando...' : 'Actualizar' }}
          </button>
        </div>
      </header>

      <!-- STAT CARDS (KPIs CLAVE) -->
      <section class="kpi-grid mb-4" *ngIf="!isCliente">
        <!-- 1. Ventas Hoy (Admin / Cajero) -->
        <div class="kpi-card gold-border" *ngIf="isAdmin || isCajero">
          <div class="kpi-icon" style="background:rgba(212,175,55,0.12);color:var(--brand-gold)">💰</div>
          <div class="kpi-content">
            <span class="kpi-label">Ventas Hoy</span>
            <div class="kpi-value">\${{ todaySales | number:'1.0-0' }}</div>
            <span class="kpi-hint">{{ todayTransactions }} tickets procesados</span>
          </div>
        </div>

        <!-- 2. Mesas Ocupadas (Admin / Cajero / Mesero / Cocinero) -->
        <div class="kpi-card cyan-border">
          <div class="kpi-icon" style="background:rgba(0,229,255,0.12);color:var(--brand-cyan)">🪑</div>
          <div class="kpi-content">
            <span class="kpi-label">Ocupación Mesas</span>
            <div class="kpi-value">{{ occupiedTables }} <span class="kpi-sub">/ {{ totalTables }}</span></div>
            <span class="kpi-hint">
              <span class="dot dot-ocupada"></span> {{ occupiedPercent }}% ocupadas
            </span>
          </div>
        </div>

        <!-- 3. Domicilios en Curso -->
        <div class="kpi-card blue-border">
          <div class="kpi-icon" style="background:rgba(66,153,225,0.12);color:#4299e1">🛵</div>
          <div class="kpi-content">
            <span class="kpi-label">Domicilios Activos</span>
            <div class="kpi-value">{{ activeDeliveries.length }}</div>
            <span class="kpi-hint">En camino y preparación</span>
          </div>
        </div>

        <!-- 4. Stock Bajo / Alertas Críticas (Admin / Cocinero) -->
        <div class="kpi-card" [class.red-border]="unreadAlerts > 0" [class.green-border]="unreadAlerts === 0">
          <div class="kpi-icon" [style.background]="unreadAlerts > 0 ? 'rgba(255,23,68,0.12)' : 'rgba(0,230,118,0.12)'"
               [style.color]="unreadAlerts > 0 ? '#ff1744' : '#00e676'">
            {{ unreadAlerts > 0 ? '⚠️' : '✅' }}
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Stock Crítico</span>
            <div class="kpi-value">{{ unreadAlerts }}</div>
            <span class="kpi-hint">{{ unreadAlerts > 0 ? 'Requieren reposición' : 'Niveles óptimos' }}</span>
          </div>
        </div>
      </section>

      <!-- ACCESOS RÁPIDOS A MÓDULOS PRINCIPALES -->
      <section class="quick-access-section mb-4">
        <div class="section-title-row">
          <h3>⚡ Accesos Rápidos</h3>
          <span class="section-desc">Operaciones más frecuentes</span>
        </div>
        <div class="quick-grid">
          <a routerLink="/mesas" class="quick-btn">
            <span class="qb-icon">🪑</span>
            <div class="qb-info">
              <strong>Mesas & Pedidos</strong>
              <small>Salón y comandas</small>
            </div>
            <span class="qb-arrow">→</span>
          </a>

          <a routerLink="/domicilios" class="quick-btn" *ngIf="!isMesero">
            <span class="qb-icon">🛵</span>
            <div class="qb-info">
              <strong>Domicilios</strong>
              <small>{{ activeDeliveries.length }} activos</small>
            </div>
            <span class="qb-arrow">→</span>
          </a>

          <a routerLink="/cash" class="quick-btn" *ngIf="isAdmin || isCajero">
            <span class="qb-icon">💰</span>
            <div class="qb-info">
              <strong>Caja y Turnos</strong>
              <small>{{ isCashOpen ? 'Caja Abierta' : 'Caja Cerrada' }}</small>
            </div>
            <span class="qb-arrow">→</span>
          </a>

          <a routerLink="/kitchen" class="quick-btn" *ngIf="isAdmin || isCocinero">
            <span class="qb-icon">👨‍🍳</span>
            <div class="qb-info">
              <strong>Cocina KDS</strong>
              <small>Comandas pendientes</small>
            </div>
            <span class="qb-arrow">→</span>
          </a>

          <a routerLink="/dishes" class="quick-btn" *ngIf="isAdmin">
            <span class="qb-icon">🍲</span>
            <div class="qb-info">
              <strong>Platos & Carta</strong>
              <small>Recetas y precios</small>
            </div>
            <span class="qb-arrow">→</span>
          </a>

          <a routerLink="/ticket-books" class="quick-btn" *ngIf="isAdmin || isCajero">
            <span class="qb-icon">🎟️</span>
            <div class="qb-info">
              <strong>Tiqueteras</strong>
              <small>Tickets prepago</small>
            </div>
            <span class="qb-arrow">→</span>
          </a>

          <a routerLink="/events" class="quick-btn" *ngIf="isAdmin">
            <span class="qb-icon">📅</span>
            <div class="qb-info">
              <strong>Eventos & Catering</strong>
              <small>Fechas y cotizaciones</small>
            </div>
            <span class="qb-arrow">→</span>
          </a>

          <a routerLink="/reports" class="quick-btn" *ngIf="isAdmin">
            <span class="qb-icon">📈</span>
            <div class="qb-info">
              <strong>Reportes</strong>
              <small>Métricas y cierres</small>
            </div>
            <span class="qb-arrow">→</span>
          </a>
        </div>
      </section>

      <!-- FILA 1: MINI MAPA DE MESAS EN VIVO + DOMICILIOS ACTIVOS -->
      <section class="main-two-col mb-4" *ngIf="!isCliente">
        
        <!-- MINI MAPA DE MESAS -->
        <div class="neon-card tables-panel">
          <div class="panel-header">
            <div class="header-titles">
              <h3>🪑 Mesas en Vivo</h3>
              <div class="tables-legend">
                <span class="leg-item"><span class="leg-dot libre"></span> {{ freeTables }} libres</span>
                <span class="leg-item"><span class="leg-dot ocupada"></span> {{ occupiedTables }} ocupadas</span>
                <span class="leg-item"><span class="leg-dot reservada"></span> {{ reservedTables }} reservadas</span>
              </div>
            </div>
            <a routerLink="/mesas" class="link-btn">Abrir Salón →</a>
          </div>

          <div *ngIf="loadingTables" class="empty-state">
            Cargando estado de mesas...
          </div>

          <div *ngIf="!loadingTables && tables.length === 0" class="empty-state">
            No hay mesas configuradas aún.
          </div>

          <div class="mini-tables-grid" *ngIf="!loadingTables && tables.length > 0">
            <a *ngFor="let t of tables" routerLink="/mesas" class="mini-table-card"
               [class]="'table-' + t.status" [title]="'Mesa ' + t.number + ' - ' + t.status + (t.currentSale ? ' (\$' + t.currentSale.total + ')' : '')">
              <span class="tbl-num">M{{ t.number }}</span>
              <span class="tbl-status-pill">{{ t.status | uppercase }}</span>
              <span class="tbl-cap" *ngIf="t.capacity">👥 {{ t.capacity }}</span>
              <span class="tbl-total" *ngIf="t.currentSale">\${{ t.currentSale.total | number:'1.0-0' }}</span>
            </a>
          </div>
        </div>

        <!-- DOMICILIOS ACTIVOS -->
        <div class="neon-card delivery-panel">
          <div class="panel-header">
            <div class="header-titles">
              <h3>🛵 Domicilios Activos</h3>
              <span class="count-badge" *ngIf="activeDeliveries.length > 0">{{ activeDeliveries.length }}</span>
            </div>
            <a routerLink="/domicilios" class="link-btn">Ver todos →</a>
          </div>

          <div *ngIf="loadingDeliveries" class="empty-state">Cargando domicilios...</div>

          <div *ngIf="!loadingDeliveries && activeDeliveries.length === 0" class="empty-state">
            <span style="font-size:2rem">🛵</span>
            <p>Sin pedidos a domicilio en curso</p>
          </div>

          <div class="del-list" *ngIf="!loadingDeliveries && activeDeliveries.length > 0">
            <div class="del-card" *ngFor="let d of activeDeliveries">
              <div class="del-dot" [class]="'dot-' + d.status"></div>
              <div class="del-info">
                <div class="del-title">
                  <strong>{{ d.customerName }}</strong>
                  <span class="del-total" *ngIf="d.total">\${{ d.total | number:'1.0-0' }}</span>
                </div>
                <div class="del-addr">📍 {{ d.customerAddress }}</div>
                <div class="del-meta">
                  <span class="del-items">{{ d.items?.length || 0 }} ítem(s)</span>
                  <span class="del-badge" [class]="'badge-' + d.status">{{ deliveryStatusLabel(d.status) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- FILA 2: ESTADO DE CAJA + ALERTAS DE STOCK CRÍTICO (5 INSUMOS) -->
      <section class="main-two-col mb-4" *ngIf="isAdmin || isCajero || isCocinero">

        <!-- ESTADO DE CAJA (Admin / Cajero) -->
        <div class="neon-card cash-panel" *ngIf="isAdmin || isCajero">
          <div class="panel-header">
            <h3>💰 Estado de Caja</h3>
            <span class="cash-badge" [class.cash-open]="isCashOpen" [class.cash-closed]="!isCashOpen">
              {{ isCashOpen ? '🟢 CAJA ABIERTA' : '🔴 CAJA CERRADA' }}
            </span>
          </div>

          <div class="cash-body">
            <div class="cash-metric-grid">
              <div class="cash-stat-box">
                <span class="cs-label">Cajero en Turno</span>
                <strong class="cs-val">{{ currentCashUser }}</strong>
              </div>
              <div class="cash-stat-box">
                <span class="cs-label">Base Inicial</span>
                <strong class="cs-val">\${{ currentCashBase | number:'1.0-0' }}</strong>
              </div>
              <div class="cash-stat-box highlight">
                <span class="cs-label">Ventas Turno</span>
                <strong class="cs-val gold-txt">\${{ currentCashSales | number:'1.0-0' }}</strong>
              </div>
              <div class="cash-stat-box">
                <span class="cs-label">Transacciones</span>
                <strong class="cs-val">{{ currentCashTransactions }}</strong>
              </div>
            </div>

            <div class="cash-footer">
              <a routerLink="/cash" class="link-btn link-btn-full">
                {{ isCashOpen ? 'Realizar Arqueo / Movimientos de Caja →' : 'Abrir Turno de Caja →' }}
              </a>
            </div>
          </div>
        </div>

        <!-- ALERTAS DE STOCK CRÍTICO (5 INSUMOS MÁS CRÍTICOS) -->
        <div class="neon-card stock-panel" *ngIf="isAdmin || isCocinero">
          <div class="panel-header">
            <div class="header-titles">
              <h3>⚠️ Insumos Críticos</h3>
              <span class="count-badge red" *ngIf="unreadAlerts > 0">{{ unreadAlerts }}</span>
            </div>
            <a routerLink="/cocina" class="link-btn">Gestionar Inventario →</a>
          </div>

          <div *ngIf="criticalAlerts.length === 0" class="empty-state">
            <span style="font-size:2rem">🎉</span>
            <p>Todos los insumos tienen existencias óptimas</p>
          </div>

          <div class="critical-items-list" *ngIf="criticalAlerts.length > 0">
            <div class="stock-item-row" *ngFor="let a of criticalAlerts">
              <div class="item-warn-icon">
                {{ a.type === 'sin_stock' ? '🚨' : '⚠️' }}
              </div>
              <div class="item-details">
                <strong>{{ a.product?.name || a.message }}</strong>
                <span class="item-sub">
                  Stock actual: <b class="red-txt">{{ a.product?.stock ?? 0 }}</b>
                  · Mínimo requerido: {{ a.product?.minStock ?? 5 }}
                </span>
              </div>
              <span class="stock-badge" [class.badge-danger]="a.type === 'sin_stock'" [class.badge-warn]="a.type !== 'sin_stock'">
                {{ a.type === 'sin_stock' ? 'AGOTADO' : 'BAJO' }}
              </span>
            </div>
          </div>

          <div class="stock-footer" *ngIf="unreadAlerts > 5">
            <small>Mostrando los 5 más críticos de {{ unreadAlerts }} alertas totales</small>
          </div>
        </div>

      </section>

      <!-- FILA 3: GRÁFICA SEMANAL + TOP PRODUCTOS (Admin) -->
      <section class="main-two-col mb-4" *ngIf="isAdmin">
        
        <!-- GRÁFICA SEMANAL -->
        <div class="neon-card">
          <div class="panel-header">
            <h3>📈 Ventas de la Semana</h3>
            <span class="cs-label">Ingresos diarios</span>
          </div>
          <div class="chart-wrapper">
            <canvas *ngIf="salesChartData" baseChart
              [datasets]="salesChartData" [labels]="salesChartLabels"
              [options]="chartOptions" type="bar">
            </canvas>
            <div *ngIf="!salesChartData" class="empty-state">
              Cargando historial semanal...
            </div>
          </div>
        </div>

        <!-- PRODUCTOS ESTRELLA -->
        <div class="neon-card-violet">
          <div class="panel-header">
            <h3>⭐ Platos & Productos Estrella</h3>
            <span class="cs-label">Top 5 más vendidos</span>
          </div>
          <div class="top-products-list">
            <div *ngFor="let p of topProducts; let i = index" class="top-product-item">
              <span class="top-rank" [class.rank-1]="i === 0" [class.rank-2]="i === 1" [class.rank-3]="i === 2">
                {{ i + 1 }}
              </span>
              <div class="top-info">
                <span class="top-name">{{ p.name }}</span>
                <small class="top-rev" *ngIf="p.totalRevenue">\${{ p.totalRevenue | number:'1.0-0' }}</small>
              </div>
              <span class="badge badge-cyan">{{ p.totalQuantity }} uds</span>
            </div>
            <div *ngIf="topProducts.length === 0" class="empty-state">
              Sin registros de ventas aún
            </div>
          </div>
        </div>

      </section>

      <!-- VISTA SIMPLIFICADA PARA CLIENTES -->
      <section *ngIf="isCliente" class="cliente-dashboard">
        <div class="neon-card mb-4">
          <h3>🍽️ Bienvenido a Marie Antoinette</h3>
          <p style="color:var(--text-secondary);margin:0.5rem 0 1.5rem">
            Revisa la carta de platos, consulta mesas disponibles o haz seguimiento a tus pedidos.
          </p>
          <div class="quick-grid">
            <a routerLink="/mesas" class="quick-btn">
              <span class="qb-icon">🪑</span>
              <div class="qb-info"><strong>Ver Mesas</strong><small>Disponibilidad</small></div>
              <span class="qb-arrow">→</span>
            </a>
            <a routerLink="/domicilios" class="quick-btn">
              <span class="qb-icon">🛵</span>
              <div class="qb-info"><strong>Mis Domicilios</strong><small>Rastreo</small></div>
              <span class="qb-arrow">→</span>
            </a>
            <a routerLink="/settings" class="quick-btn">
              <span class="qb-icon">⚙️</span>
              <div class="qb-info"><strong>Mi Perfil</strong><small>Datos</small></div>
              <span class="qb-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 0.25rem 0 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .mb-4 { margin-bottom: 0.25rem; }

    /* ─── Header ────────────────────────────────────────── */
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .welcome-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .welcome-row h1 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
    }
    .dash-subtitle {
      margin: 0.3rem 0 0;
      font-size: 0.85rem;
      color: var(--text-muted);
      text-transform: capitalize;
    }
    .role-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      letter-spacing: 0.04em;
    }
    .badge-admin { background: rgba(212,175,55,0.18); color: var(--brand-gold); border: 1px solid rgba(212,175,55,0.3); }
    .badge-cajero { background: rgba(0,229,255,0.15); color: var(--brand-cyan); border: 1px solid rgba(0,229,255,0.3); }
    .badge-mesero { background: rgba(72,187,120,0.15); color: #48bb78; border: 1px solid rgba(72,187,120,0.3); }
    .badge-cocinero { background: rgba(237,137,54,0.15); color: #ed8936; border: 1px solid rgba(237,137,54,0.3); }
    .badge-cliente { background: rgba(124,77,255,0.15); color: var(--brand-purple); border: 1px solid rgba(124,77,255,0.3); }

    .btn-refresh {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-primary);
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      font-size: 0.825rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-refresh:hover:not(:disabled) {
      border-color: var(--brand-gold);
      color: var(--brand-gold);
      background: rgba(212,175,55,0.06);
    }
    .spin { animation: spin 1s linear infinite; display: inline-block; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* ─── KPIs Grid ─────────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
    }
    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: var(--shadow-card);
    }
    .kpi-card:hover {
      transform: translateY(-2px);
    }
    .kpi-card.gold-border { border-left: 4px solid var(--brand-gold); }
    .kpi-card.cyan-border { border-left: 4px solid var(--brand-cyan); }
    .kpi-card.blue-border { border-left: 4px solid #4299e1; }
    .kpi-card.red-border { border-left: 4px solid #ff1744; }
    .kpi-card.green-border { border-left: 4px solid #00e676; }

    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      flex-shrink: 0;
    }
    .kpi-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .kpi-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.2;
      margin: 0.15rem 0;
    }
    .kpi-sub {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text-muted);
    }
    .kpi-hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    /* ─── Quick Access Grid ─────────────────────────────── */
    .quick-access-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.1rem 1.25rem;
    }
    .section-title-row {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      margin-bottom: 0.85rem;
    }
    .section-title-row h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
    }
    .section-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
    }
    .quick-btn {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      background: var(--bg-input);
      border: 1px solid var(--border);
      padding: 0.7rem 0.85rem;
      border-radius: 10px;
      text-decoration: none;
      color: var(--text-primary);
      transition: all 0.2s;
    }
    .quick-btn:hover {
      background: rgba(212,175,55,0.08);
      border-color: var(--brand-gold);
      transform: translateY(-2px);
    }
    .qb-icon { font-size: 1.4rem; flex-shrink: 0; }
    .qb-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .qb-info strong { font-size: 0.825rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .qb-info small { font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .qb-arrow { font-size: 0.85rem; color: var(--brand-gold); transition: transform 0.2s; }
    .quick-btn:hover .qb-arrow { transform: translateX(3px); }

    /* ─── Two-Col Layouts ───────────────────────────────── */
    .main-two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    @media (max-width: 960px) {
      .main-two-col { grid-template-columns: 1fr; }
    }

    /* ─── Panels Common ─────────────────────────────────── */
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 0.75rem;
    }
    .panel-header h3 { margin: 0; font-size: 1.05rem; font-weight: 700; }
    .header-titles { display: flex; flex-direction: column; gap: 0.2rem; }
    .tables-legend {
      display: flex;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .leg-item { display: flex; align-items: center; gap: 0.3rem; }
    .leg-dot { width: 8px; height: 8px; border-radius: 50%; }
    .leg-dot.libre { background: #48bb78; }
    .leg-dot.ocupada { background: #f56565; }
    .leg-dot.reservada { background: #ecc94b; }

    .link-btn {
      font-size: 0.8rem;
      color: var(--brand-gold);
      text-decoration: none;
      font-weight: 600;
      padding: 0.3rem 0.65rem;
      border: 1px solid rgba(212,175,55,0.3);
      border-radius: 6px;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .link-btn:hover {
      background: rgba(212,175,55,0.12);
      border-color: var(--brand-gold);
    }
    .link-btn-full { display: block; text-align: center; padding: 0.55rem; width: 100%; }

    .count-badge {
      background: var(--brand-gold);
      color: #1a1a1a;
      border-radius: 12px;
      padding: 0.15rem 0.5rem;
      font-size: 0.72rem;
      font-weight: 800;
    }
    .count-badge.red { background: #ff1744; color: #fff; }

    /* ─── Mini Tables Grid ──────────────────────────────── */
    .tables-panel { min-height: 280px; display: flex; flex-direction: column; }
    .mini-tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
      gap: 0.6rem;
      overflow-y: auto;
      max-height: 280px;
      padding: 0.25rem;
    }
    .mini-table-card {
      border-radius: 8px;
      padding: 0.6rem 0.4rem;
      text-align: center;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      border: 1px solid var(--border);
      transition: all 0.2s;
    }
    .mini-table-card:hover {
      transform: scale(1.05);
    }
    .tbl-num { font-weight: 800; font-size: 0.95rem; }
    .tbl-status-pill {
      font-size: 0.62rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 10px;
      letter-spacing: 0.03em;
    }
    .tbl-cap { font-size: 0.68rem; color: var(--text-muted); }
    .tbl-total { font-size: 0.72rem; font-weight: 700; color: var(--brand-gold); }

    .table-libre {
      background: rgba(72,187,120,0.08);
      border-color: rgba(72,187,120,0.3);
      color: #e2e8f0;
    }
    .table-libre .tbl-status-pill { background: rgba(72,187,120,0.25); color: #48bb78; }

    .table-ocupada {
      background: rgba(245,101,101,0.12);
      border-color: rgba(245,101,101,0.4);
      color: #fff;
    }
    .table-ocupada .tbl-status-pill { background: rgba(245,101,101,0.3); color: #f56565; }

    .table-reservada {
      background: rgba(236,201,75,0.1);
      border-color: rgba(236,201,75,0.35);
      color: #fff;
    }
    .table-reservada .tbl-status-pill { background: rgba(236,201,75,0.25); color: #ecc94b; }

    /* ─── Delivery Panel ────────────────────────────────── */
    .delivery-panel { min-height: 280px; display: flex; flex-direction: column; }
    .del-list { display: flex; flex-direction: column; gap: 0.6rem; overflow-y: auto; max-height: 280px; }
    .del-card {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      background: var(--bg-input);
      border-radius: 10px;
      padding: 0.65rem 0.75rem;
      border: 1px solid var(--border);
    }
    .del-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
    .dot-pendiente { background: #ecc94b; }
    .dot-en_preparacion { background: #4299e1; }
    .dot-en_camino { background: #48bb78; animation: pulse-dot 1.2s infinite; }
    @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }

    .del-info { flex: 1; min-width: 0; }
    .del-title { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.85rem; }
    .del-total { font-weight: 700; color: var(--brand-gold); }
    .del-addr { font-size: 0.75rem; color: var(--text-muted); margin: 0.15rem 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .del-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; }
    .del-items { color: var(--text-secondary); }
    .del-badge { font-weight: 700; border-radius: 12px; padding: 0.15rem 0.5rem; }
    .badge-pendiente { background: rgba(236,201,75,0.15); color: #ecc94b; }
    .badge-en_preparacion { background: rgba(66,153,225,0.15); color: #4299e1; }
    .badge-en_camino { background: rgba(72,187,120,0.15); color: #48bb78; }

    /* ─── Cash Panel ────────────────────────────────────── */
    .cash-panel { display: flex; flex-direction: column; justify-content: space-between; }
    .cash-badge {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
    }
    .cash-open { background: rgba(72,187,120,0.15); color: #48bb78; border: 1px solid rgba(72,187,120,0.3); }
    .cash-closed { background: rgba(245,101,101,0.15); color: #f56565; border: 1px solid rgba(245,101,101,0.3); }
    .cash-metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .cash-stat-box {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
    }
    .cash-stat-box.highlight {
      border-color: rgba(212,175,55,0.4);
      background: rgba(212,175,55,0.05);
    }
    .cs-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
    .cs-val { font-size: 1.15rem; margin-top: 0.2rem; }
    .gold-txt { color: var(--brand-gold); }
    .red-txt { color: #f56565; }

    /* ─── Stock Panel ───────────────────────────────────── */
    .stock-panel { display: flex; flex-direction: column; }
    .critical-items-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .stock-item-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--bg-input);
      border-radius: 8px;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border);
    }
    .item-warn-icon { font-size: 1.2rem; }
    .item-details { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .item-details strong { font-size: 0.85rem; }
    .item-sub { font-size: 0.72rem; color: var(--text-muted); }
    .stock-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .badge-danger { background: rgba(245,101,101,0.2); color: #f56565; }
    .badge-warn { background: rgba(236,201,75,0.2); color: #ecc94b; }
    .stock-footer { margin-top: 0.75rem; text-align: center; color: var(--text-muted); }

    /* ─── Top Products ──────────────────────────────────── */
    .top-products-list { display: flex; flex-direction: column; gap: 0.4rem; }
    .top-product-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0;
      border-bottom: 1px solid var(--border);
    }
    .top-product-item:last-child { border-bottom: none; }
    .top-rank {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--bg-input);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 800;
    }
    .rank-1 { background: linear-gradient(135deg, #ffd700, #b8860b); color: #1a1a1a; }
    .rank-2 { background: linear-gradient(135deg, #e2e8f0, #94a3b8); color: #1a1a1a; }
    .rank-3 { background: linear-gradient(135deg, #d97706, #92400e); color: #fff; }
    .top-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .top-name { font-size: 0.875rem; font-weight: 600; }
    .top-rev { font-size: 0.72rem; color: var(--brand-gold); }

    .chart-wrapper { min-height: 220px; }
    .empty-state {
      padding: 2.5rem 1rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Estado del usuario y fecha
  currentDate = new Date();
  refreshing = false;
  private wsSubs: Subscription[] = [];

  // KPIs
  todaySales = 0;
  todayTransactions = 0;
  totalProducts = 0;
  unreadAlerts = 0;

  // Mesas
  tables: any[] = [];
  loadingTables = true;
  totalTables = 0;
  occupiedTables = 0;
  freeTables = 0;
  reservedTables = 0;
  occupiedPercent = 0;

  // Domicilios
  activeDeliveries: any[] = [];
  loadingDeliveries = true;

  // Caja
  currentCash: any = null;
  isCashOpen = false;
  currentCashUser = '—';
  currentCashBase = 0;
  currentCashSales = 0;
  currentCashTransactions = 0;

  // Alertas / Stock Crítico
  criticalAlerts: any[] = [];

  // Top Productos & Gráfica
  topProducts: any[] = [];
  salesChartData: any = null;
  salesChartLabels: string[] = [];
  chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `Ventas: \$${Number(ctx.raw || 0).toLocaleString('es-CO')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(212,175,55,0.06)' },
        ticks: { color: '#888' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#888' }
      }
    }
  };

  constructor(
    public authService: AuthService,
    private api: ApiService,
    private ws: WebSocketService
  ) {}

  get userRole(): string {
    return this.authService.currentUser?.role || 'admin';
  }

  get isAdmin(): boolean { return this.userRole === 'admin'; }
  get isCajero(): boolean { return this.userRole === 'cajero'; }
  get isMesero(): boolean { return this.userRole === 'mesero'; }
  get isCocinero(): boolean { return this.userRole === 'cocinero'; }
  get isCliente(): boolean { return this.userRole === 'cliente'; }

  get userName(): string {
    const raw = this.authService.currentUser?.name || '';
    return raw.split(' ')[0] || 'Usuario';
  }

  get roleLabel(): string {
    const map: Record<string, string> = {
      admin: '👑 Administrador',
      cajero: '💰 Cajero',
      mesero: '🪑 Mesero',
      cocinero: '👨‍🍳 Cocina',
      cliente: '👤 Cliente'
    };
    return map[this.userRole] || 'Usuario';
  }

  ngOnInit(): void {
    this.loadAllData();
    this.setupWebSocketListeners();
  }

  ngOnDestroy(): void {
    this.wsSubs.forEach(s => s.unsubscribe());
  }

  refreshAll(): void {
    this.refreshing = true;
    this.loadAllData(() => {
      this.refreshing = false;
    });
  }

  loadAllData(done?: () => void): void {
    this.loadStats();
    this.loadTables();
    this.loadActiveDeliveries();
    this.loadCurrentCash();
    this.loadAlerts();

    if (this.isAdmin) {
      this.loadChart();
      this.loadTopProducts();
    }

    if (done) {
      setTimeout(() => done(), 600);
    }
  }

  // ── 1. Estadísticas Generales ──────────────────────────────────────────────
  loadStats(): void {
    if (this.api.getSalesSummary) {
      this.api.getSalesSummary('day').subscribe({
        next: (res: any) => {
          this.todaySales = res?.totalRevenue || 0;
          this.todayTransactions = res?.totalTransactions || 0;
        },
        error: () => {}
      });
    }

    if (this.api.getProducts) {
      this.api.getProducts({ limit: 1 }).subscribe({
        next: (res: any) => this.totalProducts = res?.total || 0,
        error: () => {}
      });
    }
  }

  // ── 2. Mesas en Vivo ───────────────────────────────────────────────────────
  loadTables(): void {
    this.loadingTables = true;
    if (this.api.getTables) {
      this.api.getTables().subscribe({
        next: (tables: any[]) => {
          this.tables = Array.isArray(tables) ? tables : [];
          this.computeTableStats();
          this.loadingTables = false;
        },
        error: () => {
          this.loadingTables = false;
        }
      });
    } else {
      this.loadingTables = false;
    }
  }

  private computeTableStats(): void {
    this.totalTables = this.tables.length;
    this.occupiedTables = this.tables.filter(t => t.status === 'ocupada').length;
    this.freeTables = this.tables.filter(t => t.status === 'libre').length;
    this.reservedTables = this.tables.filter(t => t.status === 'reservada').length;
    this.occupiedPercent = this.totalTables > 0
      ? Math.round((this.occupiedTables / this.totalTables) * 100)
      : 0;
  }

  // ── 3. Domicilios Activos ──────────────────────────────────────────────────
  loadActiveDeliveries(): void {
    this.loadingDeliveries = true;
    if (this.api.getAllDeliveries) {
      this.api.getAllDeliveries({ status: 'active' }).subscribe({
        next: (orders: any[]) => {
          const list = Array.isArray(orders) ? orders : [];
          this.activeDeliveries = list.filter((o: any) =>
            ['pendiente', 'en_preparacion', 'en_camino'].includes(o.status)
          );
          this.loadingDeliveries = false;
        },
        error: () => { this.loadingDeliveries = false; }
      });
    } else {
      this.loadingDeliveries = false;
    }
  }

  deliveryStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendiente:       '⏳ Pendiente',
      en_preparacion:  '👨‍🍳 Preparando',
      en_camino:       '🛵 En camino'
    };
    return labels[status] || status;
  }

  // ── 4. Estado de Caja ──────────────────────────────────────────────────────
  loadCurrentCash(): void {
    if (this.api.getCurrentCash) {
      this.api.getCurrentCash().subscribe({
        next: (res: any) => {
          this.currentCash = res;
          this.isCashOpen = !!res?.open;
          this.currentCashUser = res?.cashClosing?.user?.name || (this.isCashOpen ? 'Turno Activo' : 'Sin Cajero');
          this.currentCashBase = res?.cashClosing?.initialCash || 0;
          this.currentCashSales = res?.currentTotalSales || 0;
          this.currentCashTransactions = res?.currentTransactions || 0;
        },
        error: () => {
          this.isCashOpen = false;
        }
      });
    }
  }

  // ── 5. Alertas & Insumos Críticos ──────────────────────────────────────────
  loadAlerts(): void {
    if (this.api.getAlerts) {
      this.api.getAlerts({ read: 'false' }).subscribe({
        next: (res: any) => {
          this.unreadAlerts = res?.unread ?? (Array.isArray(res?.alerts) ? res.alerts.length : 0);
          const list = Array.isArray(res?.alerts) ? res.alerts : [];
          this.criticalAlerts = list.slice(0, 5);
        },
        error: () => {}
      });
    }
  }

  // ── 6. Gráfica Semanal & Top Productos ─────────────────────────────────────
  loadChart(): void {
    if (this.api.getSalesSummary) {
      this.api.getSalesSummary('week').subscribe({
        next: (res: any) => {
          const days = res?.salesByDay || [];
          this.salesChartLabels = days.map((d: any) => {
            const date = new Date(d._id);
            return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
          });
          this.salesChartData = [{
            data: days.map((d: any) => d.total),
            backgroundColor: 'rgba(212,175,55,0.25)',
            borderColor: '#D4AF37',
            borderWidth: 2,
            borderRadius: 6
          }];
        },
        error: () => {}
      });
    }
  }

  loadTopProducts(): void {
    if (this.api.getTopProducts) {
      this.api.getTopProducts(5).subscribe({
        next: (res: any) => this.topProducts = Array.isArray(res) ? res : [],
        error: () => {}
      });
    }
  }

  // ── 7. WebSocket en Tiempo Real ────────────────────────────────────────────
  private setupWebSocketListeners(): void {
    try {
      this.ws.connect();

      this.wsSubs.push(
        this.ws.onDeliveryNew().subscribe(() => this.loadActiveDeliveries()),
        this.ws.onDeliveryAccepted().subscribe(() => this.loadActiveDeliveries()),
        this.ws.onDeliveryDispatched().subscribe(() => this.loadActiveDeliveries()),
        this.ws.onDeliveryDelivered().subscribe(() => this.loadActiveDeliveries()),
        this.ws.onDeliveryCancelled().subscribe(() => this.loadActiveDeliveries()),

        this.ws.onNewOrder().subscribe(() => {
          this.loadTables();
          this.loadStats();
        }),
        this.ws.onOrderPaid().subscribe(() => {
          this.loadTables();
          this.loadStats();
          this.loadCurrentCash();
        }),

        this.ws.onDataChanged().subscribe(evt => {
          if (evt?.entity === 'table') this.loadTables();
          if (evt?.entity === 'sale') {
            this.loadStats();
            this.loadCurrentCash();
          }
          if (evt?.entity === 'alert' || evt?.entity === 'product') {
            this.loadAlerts();
          }
        })
      );
    } catch {
      // Si WS no está disponible, el dashboard funciona vía polling/HTTP
    }
  }
}
