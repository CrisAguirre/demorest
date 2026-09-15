import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { SettingsService } from '@core/services/settings.service';
import { AuthService } from '@core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-settings',
  template: `
    <div class="page-header">
      <h1>{{ isAdmin ? '⚙️ Configuración del Establecimiento' : '👤 Mi Perfil' }}</h1>
    </div>

    <div *ngIf="isAdmin" class="grid-2">
      <div class="neon-card">
        <h3 style="margin-bottom:1rem">🏪 Datos del Negocio</h3>
        <div class="form-group">
          <label class="form-label">Nombre del Establecimiento</label>
          <input class="form-input" [(ngModel)]="storeName">
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input class="form-input" [(ngModel)]="phone">
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input class="form-input" [(ngModel)]="address">
        </div>
        <div class="form-group">
          <label class="form-label">WhatsApp (con código país: 573...)</label>
          <input class="form-input" [(ngModel)]="whatsappNumber" placeholder="573137733408">
        </div>
        <div class="form-group" style="padding-top: 1rem; border-top: 1px solid var(--bg-input);">
          <label class="form-label" style="color: var(--brand-gold);">Modelo de Operación (Ventas)</label>
          <select class="form-input" [(ngModel)]="paymentMode">
            <option value="pre-pago">⚡ Fast-Food (Cobro anticipado)</option>
            <option value="post-pago">🍽️ Restaurante (Cuentas abiertas / Cobro al final)</option>
          </select>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem;">
            Determina si el cobro de la mesa se exige de inmediato o si queda pendiente de pago.
          </p>
        </div>
        <button class="btn-primary" (click)="saveSettings()">💾 Guardar Cambios</button>
      </div>
      <div>
        <div class="neon-card-violet" style="margin-bottom:1rem">
          <h3 style="margin-bottom:1rem">🖼️ Logo</h3>
          <div style="text-align:center;padding:1rem">
            <img *ngIf="currentLogo" [src]="currentLogo" alt="Logo actual" style="max-height:120px;margin:0 auto 1rem;border-radius:12px">
            <p *ngIf="!currentLogo" style="color:var(--text-muted);margin-bottom:1rem">Sin logo configurado</p>
            <input type="file" accept="image/*" (change)="onFileSelected($event)" #fileInput style="display:none">
            <button class="btn-outline" (click)="fileInput.click()">📤 Subir Logo</button>
            <p *ngIf="selectedFile" style="font-size:0.8rem;margin-top:0.5rem;color:var(--brand-green)">
              ✅ {{ selectedFile.name }}
            </p>
          </div>
        </div>
        <div class="neon-card" style="border-color:var(--brand-bronze)">
          <h3 style="margin-bottom:1rem">📧 Configuración Email (Alertas Stock)</h3>
          <div class="form-group">
            <label class="form-label">Servidor SMTP</label>
            <input class="form-input" [(ngModel)]="smtpHost" placeholder="smtp.gmail.com">
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Puerto</label>
              <input class="form-input" [(ngModel)]="smtpPort" type="number" placeholder="587">
            </div>
            <div class="form-group">
              <label class="form-label">Conexión Segura (SSL)</label>
              <select class="form-input" [(ngModel)]="smtpSecure">
                <option [ngValue]="false">No (587)</option>
                <option [ngValue]="true">Sí (465)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Usuario / Email SMTP</label>
            <input class="form-input" [(ngModel)]="smtpUser" placeholder="correo@ejemplo.com">
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña SMTP</label>
            <input class="form-input" [(ngModel)]="smtpPass" type="password" placeholder="••••••••">
          </div>
          <div class="form-group">
            <label class="form-label">Email Remitente (From)</label>
            <input class="form-input" [(ngModel)]="smtpFrom" placeholder="alertas@ejemplo.com">
          </div>
          <div class="form-group">
            <label class="form-label">Email para Recibir Alertas</label>
            <input class="form-input" [(ngModel)]="alertEmail" placeholder="admin@ejemplo.com">
          </div>
        </div>
        <div class="neon-card" style="margin-top:1rem;border-color:var(--brand-gold)">
          <h3 style="margin-bottom:1rem">📖 Manual de Usuario</h3>
          <p style="font-size:0.85rem;margin-bottom:0.75rem;color:var(--text-secondary)">
            Consulta el manual completo del sistema con descripción de cada módulo, capturas de pantalla, matriz de accesos y solución de problemas.
          </p>
          <a href="/assets/manual.pdf" target="_blank" class="btn-primary" style="text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem">📖 Abrir Manual (PDF)</a>
          <p style="font-size:0.75rem;margin-top:0.5rem;color:var(--text-muted)">Se abre en una nueva pestaña</p>
        </div>
        <div class="neon-card" style="margin-top:1rem;border-color:#D32F2F">
          <h3 style="margin-bottom:1rem">🗑️ Mantenimiento</h3>
          <button class="btn-outline" style="color:#D32F2F" (click)="clearCache()">🧹 Limpiar Caché Local</button>
          <p style="font-size:0.75rem;margin-top:0.5rem;color:var(--text-muted)">Borra datos en caché para forzar recarga fresca</p>
        </div>
      </div>
    </div>

    <div *ngIf="isCliente" class="grid-2">
      <div class="neon-card">
        <h3 style="margin-bottom:1rem">📝 Datos Personales</h3>
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input class="form-input" [(ngModel)]="userProfile.name">
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono / Celular</label>
          <input class="form-input" [(ngModel)]="userProfile.phone">
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input class="form-input" [(ngModel)]="userProfile.address">
        </div>
        <button class="btn-primary" (click)="saveProfile()">💾 Actualizar Perfil</button>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  isAdmin = false;
  isCliente = false;

  // Admin settings
  storeName = ''; phone = ''; address = ''; whatsappNumber = ''; paymentMode = 'pre-pago';
  currentLogo = '';
  selectedFile: File | null = null;
  smtpHost = ''; smtpPort = 587; smtpSecure = false;
  smtpUser = ''; smtpPass = ''; smtpFrom = ''; alertEmail = '';

  // Cliente profile
  userProfile = { name: '', phone: '', address: '' };

  constructor(private api: ApiService, private settingsService: SettingsService, private auth: AuthService) {}

  ngOnInit(): void {
    const role = this.auth.currentUser?.role;
    if (role === 'admin') {
      this.isAdmin = true;
      this.api.getSettings().subscribe({
        next: (s: any) => {
          this.storeName = s.storeName; this.phone = s.phone;
          this.address = s.address; this.whatsappNumber = s.whatsappNumber;
          this.paymentMode = s.paymentMode || 'pre-pago';
          this.currentLogo = s.logoUrl;
          if (s.email) {
            this.smtpHost = s.email.host || '';
            this.smtpPort = s.email.port || 587;
            this.smtpSecure = s.email.secure || false;
            this.smtpUser = s.email.user || '';
            this.smtpPass = s.email.pass || '';
            this.smtpFrom = s.email.from || '';
            this.alertEmail = s.email.alertEmail || '';
          }
        }
      });
    } else if (role === 'cliente') {
      this.isCliente = true;
      const user = this.auth.currentUser;
      if (user) {
        this.userProfile.name = user.name || '';
        this.userProfile.phone = user.phone || '';
        this.userProfile.address = user.address || '';
      }
    }
  }

  onFileSelected(event: any): void { this.selectedFile = event.target.files[0]; }

  saveSettings(): void {
    const formData = new FormData();
    formData.append('storeName', this.storeName);
    formData.append('phone', this.phone);
    formData.append('address', this.address);
    formData.append('whatsappNumber', this.whatsappNumber);
    formData.append('paymentMode', this.paymentMode);
    formData.append('email', JSON.stringify({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      user: this.smtpUser,
      pass: this.smtpPass,
      from: this.smtpFrom,
      alertEmail: this.alertEmail
    }));
    if (this.selectedFile) formData.append('logo', this.selectedFile);

    this.api.updateSettings(formData).subscribe({
      next: () => {
        this.settingsService.loadSettings();
        Swal.fire('✅', 'Configuración actualizada', 'success');
      },
      error: () => Swal.fire('❌', 'Error al guardar', 'error')
    });
  }

  saveProfile(): void {
    this.auth.updateProfile(this.userProfile).subscribe({
      next: () => {
        Swal.fire('✅', 'Perfil actualizado', 'success');
      },
      error: () => Swal.fire('❌', 'Error al actualizar perfil', 'error')
    });
  }

  clearCache(): void {
    this.api.clearCache();
    Swal.fire('🧹', 'Caché local limpiada', 'success');
  }
}
