// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  icon?: string;
  label?: string;
  route?: string;
  divider?: string;
  externalUrl?: string;
  subItems?: { icon: string; label: string; route: string }[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <button class="toggle-btn desktop-only" (click)="toggleSidebar()" [attr.aria-label]="collapsed ? 'Expandir menú' : 'Colapsar menú'">
        {{ collapsed ? '☰' : '✕' }}
      </button>
      <nav class="sidebar-nav">
        <ng-container *ngFor="let item of menuItems">
          <!-- Separador de sección -->
          <div class="section-divider" *ngIf="item.divider && !collapsed">{{ item.divider }}</div>
          
          <!-- Enlace Normal -->
          <a *ngIf="!item.divider && !item.externalUrl && !item.subItems" [routerLink]="item.route" routerLinkActive="active"
             class="nav-item" [attr.aria-label]="item.label"
             (mouseenter)="showTip($event, item.label)" (mouseleave)="hideTip()"
             (focus)="showTip($event, item.label)" (blur)="hideTip()"
             (touchstart)="showTip($event, item.label, true)" (touchend)="scheduleHideTip()">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
          </a>

          <!-- Enlace con Submenú (Acordeón) -->
          <div *ngIf="!item.divider && item.subItems" class="nav-item-group">
            <div class="nav-item nav-parent" [class.has-active-child]="hasActiveChild(item)"
                 (click)="item.expanded = !item.expanded; $event.preventDefault()" style="cursor: pointer;" [attr.aria-label]="item.label"
                 (mouseenter)="showTip($event, item.label)" (mouseleave)="hideTip()"
                 (focus)="showTip($event, item.label)" (blur)="hideTip()"
                 (touchstart)="showTip($event, item.label, true)" (touchend)="scheduleHideTip()">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
              <span class="nav-arrow" *ngIf="!collapsed" [class.rotated]="item.expanded">▼</span>
            </div>
            <div class="nav-subitems" *ngIf="item.expanded">
              <a *ngFor="let sub of item.subItems" [routerLink]="sub.route" routerLinkActive="active" class="nav-subitem"
                 [attr.aria-label]="sub.label"
                 (mouseenter)="showTip($event, sub.label)" (mouseleave)="hideTip()"
                 (focus)="showTip($event, sub.label)" (blur)="hideTip()"
                 (touchstart)="showTip($event, sub.label, true)" (touchend)="scheduleHideTip()">
                <span class="nav-icon sub-icon">{{ sub.icon }}</span>
                <span class="nav-label">{{ sub.label }}</span>
              </a>
            </div>
          </div>

          <!-- Enlace Externo -->
          <a *ngIf="!item.divider && item.externalUrl && !item.subItems" [href]="item.externalUrl" target="_blank"
             class="nav-item" [attr.aria-label]="item.label"
             (mouseenter)="showTip($event, item.label)" (mouseleave)="hideTip()"
             (focus)="showTip($event, item.label)" (blur)="hideTip()"
             (touchstart)="showTip($event, item.label, true)" (touchend)="scheduleHideTip()">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
          </a>
        </ng-container>
      </nav>
      <div class="sidebar-tip" *ngIf="tipVisible" [style.left.px]="tipX" [style.top.px]="tipY">{{ tipText }}</div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 220px; height: calc(100vh - 60px); height: calc(100dvh - 60px);
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border);
      padding: 1rem 0 0; transition: width 0.25s ease;
      display: flex; flex-direction: column;
      position: sticky; top: 60px; flex-shrink: 0;
      overflow: hidden;
    }
    .sidebar.collapsed { width: 60px; }
    .sidebar.collapsed .toggle-btn { align-self: center; margin: 0 0 1rem; }
    .toggle-btn {
      align-self: flex-end; margin: 0 0.75rem 1rem;
      background: none; border: none; font-size: 1.1rem;
      cursor: pointer; color: var(--text-secondary);
      width: 32px; height: 32px; border-radius: 6px;
      transition: background 0.15s;
    }
    .toggle-btn:hover { background: var(--bg-input); }
    .sidebar-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding-bottom: 1rem; scrollbar-width: thin; }
    .section-divider {
      font-size: .65rem; text-transform: uppercase; letter-spacing: .08em;
      color: var(--text-secondary); padding: .9rem 1.5rem .3rem;
      opacity: .6;
    }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 1rem; margin: 0 0.5rem;
      border-radius: 8px; font-size: 0.85rem; font-weight: 500;
      color: var(--text-secondary); transition: all 0.15s;
      white-space: nowrap; overflow: hidden;
      user-select: none; position: relative;
    }
    .nav-parent.has-active-child {
      color: var(--brand-gold);
      background: rgba(212,175,55,0.06);
      font-weight: 600;
    }
    .nav-arrow { margin-left: auto; font-size: 0.7rem; transition: transform 0.2s; }
    .nav-arrow.rotated { transform: rotate(180deg); }
    .nav-subitems {
      display: flex; flex-direction: column; gap: 2px;
      margin: 0.2rem 0.5rem 0.2rem 2.5rem;
      border-left: 1px solid var(--border);
      padding-left: 0.5rem;
    }
    .nav-subitem {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8rem;
      color: var(--text-secondary); transition: all 0.15s;
      text-decoration: none; position: relative;
      white-space: nowrap; overflow: hidden;
    }
    .nav-subitem .sub-icon { font-size: 1.1rem; min-width: 24px; text-align: center; }
    .nav-subitem:hover { background: rgba(212,175,55,0.06); color: var(--text-primary); }
    .nav-subitem.active {
      color: var(--brand-gold); font-weight: 600;
      background: rgba(212,175,55,0.05);
    }
    .nav-item:hover { background: rgba(212,175,55,0.06); color: var(--text-primary); }
    .nav-item.active {
      background: rgba(212,175,55,0.1); color: var(--brand-gold);
      font-weight: 600; border-left: 3px solid var(--brand-gold);
    }
    .nav-icon { font-size: 1.2rem; min-width: 24px; text-align: center; flex-shrink: 0; }
    .nav-label { transition: opacity 0.2s; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .collapsed .nav-label { opacity: 0; width: 0; overflow: hidden; }
    .collapsed .nav-item { justify-content: center; padding: 0.65rem; }
    .collapsed .nav-item-group { display: flex; flex-direction: column; align-items: stretch; }
    .collapsed .nav-subitems { margin: 0.15rem 0.25rem 0.35rem; padding: 0; border-left: none; align-items: stretch; }
    .collapsed .nav-subitem { justify-content: center; padding: 0.65rem; margin: 0; }
    .collapsed .nav-subitem .nav-label { display: none; }
    .collapsed .nav-subitem .sub-icon { font-size: 1.2rem; }
    .sidebar-tip {
      position: fixed; z-index: 9999;
      background: var(--bg-card); color: var(--text-primary);
      border: 1px solid var(--border);
      padding: 0.35rem 0.6rem; border-radius: 8px;
      font-size: 0.8rem; font-weight: 600;
      white-space: nowrap; pointer-events: none;
      box-shadow: var(--shadow-card);
      transform: translate(12px, -50%);
    }
    @media (max-width: 768px) {
      .sidebar { width: 64px; flex-shrink: 0; height: calc(100vh - 60px); height: calc(100dvh - 60px); }
      .desktop-only { display: none; }
      .nav-label { display: none !important; }
      .section-divider { display: none; }
      .nav-item { justify-content: center; padding: 0.85rem 0; margin: 0.15rem 0.25rem; }
      .nav-item-group { display: flex; flex-direction: column; align-items: stretch; }
      .nav-arrow { display: none !important; }
      .nav-subitems { margin: 0.1rem 0.25rem 0.3rem; padding: 0; border-left: none; align-items: stretch; gap: 4px; }
      .nav-subitem { justify-content: center; margin: 0; padding: 0.85rem 0; border-radius: 6px; }
      .nav-subitem .sub-icon { font-size: 1.4rem !important; min-width: 24px; }
      .nav-icon { font-size: 1.4rem; }
      .nav-item.active { border-left: none; border-bottom: 3px solid var(--brand-gold); border-radius: 6px; }
      .nav-subitem.active { border-left: none; border-bottom: 3px solid var(--brand-gold); }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  collapsed = false;
  tipText = '';
  tipX = 0;
  tipY = 0;
  tipVisible = false;
  private tipTimer: any = null;
  private routerSub: Subscription | null = null;
  menuItems: MenuItem[] = [];

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildMenu();
    this.checkActiveRoutes();
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.checkActiveRoutes());
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
    if (this.tipTimer) {
      clearTimeout(this.tipTimer);
    }
  }

  buildMenu(): void {
    const role = this.auth.currentUser?.role;

    if (role === 'cliente') {
      this.menuItems = [
        { icon: '🏠', label: 'Inicio',         route: '/dashboard' },
        { icon: '🪑', label: 'Mesas',          route: '/mesas' },
        { icon: '🛵', label: 'Domicilios',     route: '/domicilios' },
        { icon: '⚙️', label: 'Mi Perfil',      route: '/settings' }
      ];
    } else if (role === 'cocinero') {
      this.menuItems = [
        { icon: '🏠', label: 'Inicio',         route: '/dashboard' },
        { icon: '👨‍🍳', label: 'Cocina',         route: '/kitchen' },
        { icon: '🪑', label: 'Mesas',          route: '/mesas' },
        { icon: '🛵', label: 'Domicilios',     route: '/domicilios' }
      ];
    } else if (role === 'mesero') {
      this.menuItems = [
        { icon: '🏠', label: 'Inicio',         route: '/dashboard' },
        { icon: '🪑', label: 'Mesas',          route: '/mesas' },
        { icon: '🛵', label: 'Domicilios',     route: '/domicilios' }
      ];
    } else if (role === 'cajero') {
      this.menuItems = [
        { icon: '🏠', label: 'Inicio',         route: '/dashboard' },
        { icon: '💰', label: 'Caja',           route: '/cash' },
        { icon: '🪑', label: 'Mesas',          route: '/mesas' },
        { icon: '🛵', label: 'Domicilios',     route: '/domicilios' },
        { icon: '🎟️', label: 'Tiqueteras',     route: '/ticket-books' }
      ];
    } else {
      // admin por defecto
      this.menuItems = [
        { icon: '🏠', label: 'Inicio', route: '/dashboard' },
        {
          icon: '🪑', label: 'Operaciones', expanded: false,
          subItems: [
            { icon: '🪑', label: 'Mesas',      route: '/mesas' },
            { icon: '🛵', label: 'Domicilios', route: '/domicilios' },
            { icon: '📅', label: 'Eventos',    route: '/events' }
          ]
        },
        {
          icon: '🍽️', label: 'Cocina y Carta', expanded: false,
          subItems: [
            { icon: '🍲', label: 'Platos',    route: '/dishes' },
            { icon: '🍲', label: 'Cocina',    route: '/cocina' },
            { icon: '🍹', label: 'Barra',     route: '/barra' },
            { icon: '🛎️', label: 'Servicio',  route: '/servicio' }
          ]
        },
        {
          icon: '💰', label: 'Caja y Ventas', expanded: false,
          subItems: [
            { icon: '💰', label: 'Caja',        route: '/cash' },
            { icon: '🎟️', label: 'Tiqueteras', route: '/ticket-books' }
          ]
        },
        {
          icon: '🛒', label: 'Compras y Costos', expanded: false,
          subItems: [
            { icon: '🏭', label: 'Proveedores', route: '/suppliers' },
            { icon: '🛍️', label: 'Compras',     route: '/purchases' },
            { icon: '💸', label: 'Gastos',      route: '/expenses' }
          ]
        },
        { icon: '👥', label: 'Equipo', route: '/staff' },
        {
          icon: '📈', label: 'Inteligencia', expanded: false,
          subItems: [
            { icon: '🧠', label: 'Financiero', route: '/finance' },
            { icon: '📈', label: 'Reportes',   route: '/reports' }
          ]
        },
        {
          icon: '⚙️', label: 'Administración', expanded: false,
          subItems: [
            { icon: '📚', label: 'Documentación', route: '/documentacion' },
            { icon: '🦺', label: 'SG-SST',         route: '/sg-sst' },
            { icon: '⚙️', label: 'Configuración', route: '/settings' }
          ]
        }
      ];
    }
  }

  hasActiveChild(item: MenuItem): boolean {
    if (!item.subItems) return false;
    const currentUrl = this.router.url;
    return item.subItems.some(sub => sub.route && (currentUrl === sub.route || currentUrl.startsWith(sub.route + '/') || currentUrl.startsWith(sub.route + '?')));
  }

  private checkActiveRoutes(): void {
    for (const item of this.menuItems) {
      if (item.subItems && this.hasActiveChild(item)) {
        item.expanded = true;
      }
    }
  }

  showTip(event: any, label?: string, isTouch = false): void {
    if (!label) return;
    if (this.tipTimer) { clearTimeout(this.tipTimer); this.tipTimer = null; }
    let x = 0;
    let y = 0;
    const target = (event?.currentTarget || event?.target) as HTMLElement | null;
    if (event?.touches?.[0]) {
      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    } else if (typeof event?.clientX === 'number') {
      x = event.clientX;
      y = event.clientY;
    } else if (target?.getBoundingClientRect) {
      const r = target.getBoundingClientRect();
      x = r.right;
      y = r.top + r.height / 2;
    }
    const isMobile = window.innerWidth <= 768;
    if (!isMobile && !this.collapsed && !isTouch) return;
    this.tipText = label;
    this.tipX = x;
    this.tipY = y;
    this.tipVisible = true;
  }

  hideTip(): void {
    if (this.tipTimer) { clearTimeout(this.tipTimer); this.tipTimer = null; }
    this.tipVisible = false;
  }

  scheduleHideTip(): void {
    if (this.tipTimer) clearTimeout(this.tipTimer);
    this.tipTimer = setTimeout(() => { this.tipVisible = false; }, 1200);
  }
}
