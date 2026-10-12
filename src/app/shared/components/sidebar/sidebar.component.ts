// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  icon?: string;
  safeIcon?: SafeHtml;
  label?: string;
  route?: string;
  divider?: string;
  externalUrl?: string;
  subItems?: { icon?: string; safeIcon?: SafeHtml; label: string; route: string }[];
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
            <span class="nav-icon" [innerHTML]="item.safeIcon"></span>
            <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
          </a>

          <!-- Enlace con Submenú (Acordeón) -->
          <div *ngIf="!item.divider && item.subItems" class="nav-item-group" [class.is-expanded]="item.expanded">
            <div class="nav-item nav-parent" [class.has-active-child]="hasActiveChild(item)" [class.is-open]="item.expanded"
                 (click)="item.expanded = !item.expanded; $event.preventDefault()" style="cursor: pointer;" [attr.aria-label]="item.label"
                 (mouseenter)="showTip($event, item.label)" (mouseleave)="hideTip()"
                 (focus)="showTip($event, item.label)" (blur)="hideTip()"
                 (touchstart)="showTip($event, item.label, true)" (touchend)="scheduleHideTip()">
              <span class="nav-icon" [innerHTML]="item.safeIcon"></span>
              <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
              <span class="nav-arrow" *ngIf="!collapsed" [class.rotated]="item.expanded">▼</span>
            </div>
            <div class="nav-subitems" *ngIf="item.expanded">
              <a *ngFor="let sub of item.subItems" [routerLink]="sub.route" routerLinkActive="active" class="nav-subitem"
                 [attr.aria-label]="sub.label"
                 (mouseenter)="showTip($event, sub.label)" (mouseleave)="hideTip()"
                 (focus)="showTip($event, sub.label)" (blur)="hideTip()"
                 (touchstart)="showTip($event, sub.label, true)" (touchend)="scheduleHideTip()">
                <span class="nav-icon sub-icon" [innerHTML]="sub.safeIcon"></span>
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
            <span class="nav-icon" [innerHTML]="item.safeIcon"></span>
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
    .nav-item-group {
      margin: 2px 0.35rem;
      border-radius: 8px;
      transition: background 0.2s ease, box-shadow 0.2s ease;
    }
    .nav-item-group.is-expanded {
      background: rgba(212,175,55,0.04);
      box-shadow: inset 0 0 0 1px rgba(212,175,55,0.18), 0 2px 6px rgba(0,0,0,0.03);
      padding-bottom: 4px;
    }
    .nav-item-group.is-expanded .nav-parent {
      background: rgba(212,175,55,0.08);
      color: var(--text-primary);
      font-weight: 600;
    }
    .nav-item-group.is-expanded .nav-arrow {
      color: var(--brand-gold);
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
    .nav-arrow {
      margin-left: auto; font-size: 0.65rem;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s;
    }
    .nav-arrow.rotated { transform: rotate(180deg); }
    .nav-subitems {
      display: flex; flex-direction: column; gap: 2px;
      margin: 0.3rem 0.5rem 0.2rem 1.85rem;
      border-left: 2px solid var(--brand-gold);
      padding-left: 0.6rem;
      animation: subitemsSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes subitemsSlide {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .nav-subitem {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.45rem 0.7rem; border-radius: 6px; font-size: 0.8rem;
      color: var(--text-secondary); transition: all 0.18s ease;
      text-decoration: none; position: relative;
      white-space: nowrap; overflow: hidden;
    }
    .nav-subitem:hover {
      background: rgba(212,175,55,0.08);
      color: var(--text-primary);
      transform: translateX(3px);
    }
    .nav-subitem.active {
      color: var(--brand-gold); font-weight: 600;
      background: rgba(212,175,55,0.1);
      box-shadow: inset 0 0 0 1px rgba(212,175,55,0.25);
    }
    .nav-item:hover { background: rgba(212,175,55,0.06); color: var(--text-primary); }
    .nav-item.active {
      background: rgba(212,175,55,0.1); color: var(--brand-gold);
      font-weight: 600; border-left: 3px solid var(--brand-gold);
    }
    .nav-icon {
      width: 24px; height: 24px; min-width: 24px;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .nav-icon svg {
      width: 18px; height: 18px; display: block;
      transition: transform 0.2s ease;
    }
    .nav-subitem .sub-icon {
      width: 20px; height: 20px; min-width: 20px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .nav-subitem .sub-icon svg {
      width: 15px; height: 15px; display: block;
      transition: transform 0.2s ease;
    }
    .nav-item:hover .nav-icon svg,
    .nav-subitem:hover .sub-icon svg {
      transform: scale(1.15);
    }
    .nav-label { transition: opacity 0.2s; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .collapsed .nav-label { opacity: 0; width: 0; overflow: hidden; }
    .collapsed .nav-item { justify-content: center; padding: 0.65rem; }
    .collapsed .nav-item-group { display: flex; flex-direction: column; align-items: stretch; margin: 2px 2px; }
    .collapsed .nav-item-group.is-expanded {
      background: rgba(212,175,55,0.05);
      box-shadow: inset 0 0 0 1px rgba(212,175,55,0.2);
      padding-bottom: 2px;
    }
    .collapsed .nav-subitems { margin: 0.15rem 0.25rem 0.35rem; padding: 0; border-left: none; align-items: stretch; }
    .collapsed .nav-subitem { justify-content: center; padding: 0.65rem; margin: 0; }
    .collapsed .nav-subitem:hover { transform: none; }
    .collapsed .nav-subitem .nav-label { display: none; }
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
      .nav-subitem .sub-icon { min-width: 24px; }
      .nav-subitem .sub-icon svg { width: 18px !important; height: 18px !important; }
      .nav-icon { min-width: 24px; }
      .nav-icon svg { width: 20px; height: 20px; }
      .nav-item.active { border-left: none; border-bottom: 3px solid var(--brand-gold); border-radius: 6px; }
      .nav-subitem.active { border-left: none; border-bottom: 3px solid var(--brand-gold); }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  collapsed = true;
  tipText = '';
  tipX = 0;
  tipY = 0;
  tipVisible = false;
  private tipTimer: any = null;
  private routerSub: Subscription | null = null;
  menuItems: MenuItem[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  private svg(stroke: string, paths: string): SafeHtml {
    const raw = `<svg viewBox="0 0 24 24" stroke="${stroke}" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('sidebar_collapsed');
    this.collapsed = saved !== null ? saved === 'true' : true;
    this.buildMenu();
    this.checkActiveRoutes();
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.checkActiveRoutes());
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    try {
      localStorage.setItem('sidebar_collapsed', String(this.collapsed));
    } catch {}
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

    // Corporate SVGs aligned with Ficha Técnica design
    const iconDashboard = this.svg('#38BDF8', '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>');
    const iconMesas = this.svg('#818CF8', '<rect x="4" y="5" width="16" height="12" rx="2.5"/><line x1="6" y1="17" x2="6" y2="21"/><line x1="18" y1="17" x2="18" y2="21"/><circle cx="12" cy="11" r="2.5"/><path d="M4 11h2"/><path d="M18 11h2"/>');
    const iconDomicilios = this.svg('#0EA5E9', '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><path d="M15 6h4l2 5v4h-2.5"/><path d="M12 17.5V11l-3-3 4-3 2 3h2"/>');
    const iconEventos = this.svg('#F59E0B', '<rect x="3" y="4" width="18" height="18" rx="2.5"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m12 13 1 2 2.5.5-1.8 1.8.4 2.5-2.1-1.1-2.1 1.1.4-2.5-1.8-1.8 2.5-.5z"/>');
    const iconOperaciones = this.svg('#818CF8', '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>');

    const iconCocina = this.svg('#FB923C', '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><path d="M6 2v4"/><path d="M10 2v4"/><path d="M14 2v4"/>');
    const iconPlatos = this.svg('#F59E0B', '<path d="M3 17h18"/><path d="M4 17a8 8 0 0 1 16 0"/><line x1="12" y1="5" x2="12" y2="9"/><circle cx="12" cy="4" r="1"/>');
    const iconBarra = this.svg('#8B5CF6', '<path d="M8 22h8"/><path d="M12 15v7"/><path d="M5 3h14l-3 12H8L5 3z"/><path d="M6 1h12"/>');
    const iconServicio = this.svg('#EAB308', '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>');

    const iconCaja = this.svg('#22C55E', '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>');
    const iconTiqueteras = this.svg('#10B981', '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/>');

    const iconCompras = this.svg('#F43F5E', '<circle cx="9" cy="21" r="1.5"/><circle cx="20" cy="21" r="1.5"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>');
    const iconProveedores = this.svg('#14B8A6', '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>');
    const iconGastos = this.svg('#EF4444', '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>');

    const iconAnalisis = this.svg('#A855F7', '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>');
    const iconFinanzas = this.svg('#6366F1', '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>');
    const iconReportes = this.svg('#A855F7', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>');

    const iconAdmin = this.svg('#EC4899', '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>');
    const iconPersonal = this.svg('#EC4899', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>');
    const iconDocs = this.svg('#3B82F6', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>');
    const iconSgsst = this.svg('#EAB308', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>');
    const iconConfig = this.svg('#94A3B8', '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>');
    const iconPerfil = this.svg('#94A3B8', '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>');

    if (role === 'cliente') {
      this.menuItems = [
        { safeIcon: iconDashboard, label: 'Inicio',     route: '/dashboard' },
        { safeIcon: iconMesas,     label: 'Mesas',      route: '/mesas' },
        { safeIcon: iconDomicilios, label: 'Domicilios', route: '/domicilios' },
        { safeIcon: iconPerfil,    label: 'Mi Perfil',  route: '/settings' }
      ];
    } else if (role === 'cocinero') {
      this.menuItems = [
        { safeIcon: iconDashboard, label: 'Inicio',     route: '/dashboard' },
        { safeIcon: iconCocina,    label: 'Cocina',     route: '/kitchen' },
        { safeIcon: iconMesas,     label: 'Mesas',      route: '/mesas' },
        { safeIcon: iconDomicilios, label: 'Domicilios', route: '/domicilios' }
      ];
    } else if (role === 'mesero') {
      this.menuItems = [
        { safeIcon: iconDashboard, label: 'Inicio',     route: '/dashboard' },
        { safeIcon: iconMesas,     label: 'Mesas',      route: '/mesas' },
        { safeIcon: iconDomicilios, label: 'Domicilios', route: '/domicilios' }
      ];
    } else if (role === 'cajero') {
      this.menuItems = [
        { safeIcon: iconDashboard,  label: 'Inicio',     route: '/dashboard' },
        { safeIcon: iconCaja,       label: 'Caja',       route: '/cash' },
        { safeIcon: iconMesas,      label: 'Mesas',      route: '/mesas' },
        { safeIcon: iconDomicilios, label: 'Domicilios', route: '/domicilios' },
        { safeIcon: iconTiqueteras, label: 'Tiqueteras', route: '/ticket-books' }
      ];
    } else {
      // admin por defecto
      this.menuItems = [
        { safeIcon: iconDashboard, label: 'Inicio', route: '/dashboard' },
        {
          safeIcon: iconOperaciones, label: 'Operaciones', expanded: false,
          subItems: [
            { safeIcon: iconMesas,      label: 'Mesas',      route: '/mesas' },
            { safeIcon: iconDomicilios, label: 'Domicilios', route: '/domicilios' },
            { safeIcon: iconEventos,    label: 'Eventos',    route: '/events' }
          ]
        },
        {
          safeIcon: iconCocina, label: 'Cocina y Carta', expanded: false,
          subItems: [
            { safeIcon: iconPlatos,   label: 'Platos',    route: '/dishes' },
            { safeIcon: iconCocina,   label: 'Cocina',    route: '/cocina' },
            { safeIcon: iconBarra,    label: 'Barra',     route: '/barra' },
            { safeIcon: iconServicio, label: 'Servicio',  route: '/servicio' }
          ]
        },
        {
          safeIcon: iconCaja, label: 'Caja y Ventas', expanded: false,
          subItems: [
            { safeIcon: iconCaja,       label: 'Caja',        route: '/cash' },
            { safeIcon: iconTiqueteras, label: 'Tiqueteras',  route: '/ticket-books' }
          ]
        },
        {
          safeIcon: iconCompras, label: 'Compras y Costos', expanded: false,
          subItems: [
            { safeIcon: iconProveedores, label: 'Proveedores', route: '/suppliers' },
            { safeIcon: iconCompras,     label: 'Compras',     route: '/purchases' },
            { safeIcon: iconGastos,      label: 'Gastos',      route: '/expenses' }
          ]
        },
        {
          safeIcon: iconAnalisis, label: 'Análisis', expanded: false,
          subItems: [
            { safeIcon: iconFinanzas, label: 'Financiero', route: '/finance' },
            { safeIcon: iconReportes, label: 'Reportes',   route: '/reports' }
          ]
        },
        {
          safeIcon: iconAdmin, label: 'Administración', expanded: false,
          subItems: [
            { safeIcon: iconPersonal, label: 'Personal',      route: '/staff' },
            { safeIcon: iconDocs,     label: 'Documentación', route: '/documentacion' },
            { safeIcon: iconSgsst,    label: 'SG-SST',         route: '/sg-sst' },
            { safeIcon: iconConfig,   label: 'Configuración', route: '/settings' }
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
