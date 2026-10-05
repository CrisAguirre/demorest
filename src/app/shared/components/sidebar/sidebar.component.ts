// src/app/shared/components/sidebar/sidebar.component.ts  — REEMPLAZA el original
import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <button class="toggle-btn desktop-only" (click)="collapsed = !collapsed" aria-label="Colapsar menú">
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

          <!-- Enlace con Submenú -->
          <div *ngIf="!item.divider && item.subItems" class="nav-item-group">
            <div class="nav-item nav-parent" (click)="item.expanded = !item.expanded; $event.preventDefault()" style="cursor: pointer;" [attr.aria-label]="item.label"
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
export class SidebarComponent {
  collapsed = false;
  tipText = '';
  tipX = 0;
  tipY = 0;
  tipVisible = false;
  private tipTimer: any = null;
  menuItems: { icon?: string; label?: string; route?: string; divider?: string; externalUrl?: string; subItems?: any[]; expanded?: boolean }[] = [];

  constructor(private auth: AuthService) {
    const role = this.auth.currentUser?.role;

    if (role === 'cliente') {
      this.menuItems = [
        { icon: '🪑', label: 'Mesas',           route: '/mesas' },
        { icon: '📊', label: 'Mis Compras',    route: '/dashboard' },
        { icon: '🛵', label: 'Domicilios',     route: '/domicilios' },
        { icon: '🌍', label: 'Landing',        externalUrl: 'https://www.restmarieantoinette.com/' },
        { icon: '⚙️', label: 'Mi Perfil',      route: '/settings' }
      ];
    } else if (role === 'cocinero') {
      this.menuItems = [
        { divider: 'Cocina' },
        { icon: '🪑', label: 'Mesas',           route: '/mesas' },
        { icon: '📊', label: 'Dashboard',       route: '/dashboard' },
        { icon: '👨‍🍳', label: 'Cocina',         route: '/kitchen' },
        { icon: '🛵', label: 'Domicilios',      route: '/domicilios' }
      ];
    } else if (role === 'mesero') {
      this.menuItems = [
        { icon: '🪑', label: 'Mesas',           route: '/mesas' },
        { icon: '🛵', label: 'Domicilios',      route: '/domicilios' },
        { icon: '📊', label: 'Dashboard',       route: '/dashboard' }
      ];
    } else if (role === 'cajero') {
      this.menuItems = [
        { divider: 'Operaciones' },
        { icon: '🪑', label: 'Mesas',           route: '/mesas' },
        { icon: '💰', label: 'Caja',            route: '/cash' },
        { icon: '📊', label: 'Dashboard',       route: '/dashboard' },
        { divider: 'Gestión' },
        { icon: '🎟️', label: 'Tiqueteras',      route: '/ticket-books' }
      ];
    } else if (role === 'admin') {
      this.menuItems = [
        // Operaciones diarias
        { divider: 'Operaciones' },
        { icon: '🪑', label: 'Mesas',           route: '/mesas' },
        { icon: '📅', label: 'Eventos y Catering', route: '/events' },
        {
          icon: '📦', label: 'Inventario', expanded: false,
          subItems: [
            { icon: '🍲', label: 'Cocina', route: '/cocina' },
            { icon: '🍹', label: 'Barra', route: '/barra' },
            { icon: '🛎️', label: 'Servicio', route: '/servicio' }
          ]
        },
        { icon: '🍲', label: 'Platos',          route: '/dishes' },
        { icon: '💰', label: 'Caja',            route: '/cash' },
        { icon: '📊', label: 'Dashboard',       route: '/dashboard' },
        // Compras y proveedores
        { divider: 'Compras' },
        { icon: '🏭', label: 'Proveedores',     route: '/suppliers' },
        { icon: '🛍️', label: 'Compras',         route: '/purchases' },
        { icon: '🎟️', label: 'Tiqueteras',      route: '/ticket-books' },
        // Gastos y Personal
        { divider: 'Gastos y Personal' },
        { icon: '💸', label: 'Gastos Operativos', route: '/expenses' },
        { icon: '👨‍🍳', label: 'Personal',        route: '/staff' },
        // Inteligencia
        { divider: 'Inteligencia' },
        { icon: '🧠', label: 'Centro Financiero', route: '/finance' },
        { icon: '📈', label: 'Reportes',        route: '/reports' },
        // Documentación
        { divider: 'Documentación' },
        { icon: '📚', label: 'Documentación',   route: '/documentacion' },
        { icon: '🦺', label: 'SG-SST',          route: '/sg-sst' },
        // Configuración y Enlaces Externos
        { divider: 'Sistema' },
        { icon: '🛵', label: 'Domicilios',      route: '/domicilios' },
        { icon: '🌍', label: 'Landing',         externalUrl: 'https://www.restmarieantoinette.com/' },
        { 
          icon: '⚙️', label: 'Configuración', expanded: false,
          subItems: [
            { icon: '⚙️', label: 'General', route: '/settings' },
            { icon: '📂', label: 'Categorías', route: '/categories' }
          ]
        }
      ];
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
    // En escritorio expandido el label ya es visible: no mostrar tip para no duplicar.
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
