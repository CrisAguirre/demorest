import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="navbar-brand" routerLink="/dashboard">
        <img *ngIf="settingsService.logoFullUrl" [src]="settingsService.logoFullUrl" alt="Logo" class="navbar-logo">
        <span class="navbar-title">{{ settingsService.storeName }}</span>
      </div>

      <div class="navbar-date" title="Fecha de operación">
        📅 {{ fechaOperacion }}
      </div>

      <div class="navbar-actions">
        <button class="btn-theme" (click)="toggleTheme()" [title]="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
        <div class="user-menu" (click)="showMenu = !showMenu">
          <div class="user-avatar">{{ userInitial }}</div>
          <span class="user-name">{{ authService.currentUser?.name }}</span>
          <span class="user-role badge badge-cyan">{{ authService.currentUser?.role }}</span>
        </div>
        <div class="dropdown" *ngIf="showMenu">
          <button (click)="navigate('/settings')" *ngIf="authService.hasRole('admin')">⚙️ Configuración</button>
          <button (click)="logout()">🚪 Cerrar Sesión</button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem; height: 60px;
      background: var(--bg-card); border-bottom: 1px solid rgba(212,175,55,0.12);
      box-shadow: 0 1px 8px rgba(0,0,0,0.03);
      position: sticky; top: 0; z-index: 100;
      color: var(--text-primary);
    }
    .navbar-brand {
      display: flex; align-items: center; gap: 0.75rem; cursor: pointer;
    }
    .navbar-logo { height: 36px; width: auto; border-radius: 6px; }
    .navbar-title {
      font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700;
      color: var(--brand-gold);
    }
    .navbar-actions { display: flex; align-items: center; gap: 1rem; }
    .navbar-date {
      font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);
      text-transform: capitalize; white-space: nowrap;
    }
    .btn-theme {
      position: relative; background: var(--bg-input); border: none;
      width: 38px; height: 38px; border-radius: 8px; font-size: 1.1rem;
      cursor: pointer; transition: all 0.2s; color: var(--text-primary);
    }
    .btn-theme:hover { background: rgba(212,175,55,0.08); }
    .user-menu {
      display: flex; align-items: center; gap: 0.5rem; cursor: pointer;
      padding: 0.375rem 0.75rem; border-radius: 8px;
      transition: background 0.2s;
    }
    .user-menu:hover { background: var(--bg-input); }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-gold), var(--brand-bronze));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
    }
    .user-name { font-size: 0.85rem; font-weight: 600; }
    .user-role { font-size: 0.65rem; }
    .dropdown {
      position: absolute; top: 56px; right: 1.5rem;
      background: var(--bg-card); border: 1px solid rgba(212,175,55,0.15);
      border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,0.1);
      overflow: hidden; z-index: 200; min-width: 180px;
    }
    .dropdown button {
      display: block; width: 100%; padding: 0.7rem 1rem;
      text-align: left; border: none; background: none; color: var(--text-primary);
      font-size: 0.85rem; cursor: pointer; transition: background 0.15s;
    }
    .dropdown button:hover { background: var(--bg-input); }
    @media (max-width: 600px) {
      .user-name, .user-role { display: none; }
      .navbar-date { display: none; }
    }
    @media (max-width: 480px) {
      .navbar { padding: 0 0.5rem; }
      .navbar-title { font-size: 0.95rem; }
      .navbar-actions { gap: 0.5rem; }
      .user-avatar { width: 30px; height: 30px; }
      .btn-theme { width: 32px; height: 32px; font-size: 1rem; }
      .navbar-brand { gap: 0.5rem; }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  showMenu = false;
  isDarkMode = false;
  fechaOperacion = '';
  private reloj: any = null;

  get userInitial(): string {
    return this.authService.currentUser?.name?.charAt(0)?.toUpperCase() || '?';
  }

  constructor(
    public authService: AuthService,
    public settingsService: SettingsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.settingsService.loadSettings();
    this.initTheme();
    this.actualizarFecha();
    this.reloj = setInterval(() => this.actualizarFecha(), 60000);
  }

  ngOnDestroy(): void {
    if (this.reloj) clearInterval(this.reloj);
  }

  actualizarFecha(): void {
    this.fechaOperacion = new Date().toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  initTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark');
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  navigate(path: string): void {
    this.showMenu = false;
    this.router.navigate([path]);
  }

  logout(): void {
    this.showMenu = false;
    this.authService.logout();
  }
}
