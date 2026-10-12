import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { SettingsService } from '@core/services/settings.service';
import { AuthService } from '@core/services/auth.service';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  template: `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
      <div>
        <h1>{{ isAdmin ? '⚙️ Configuración del Establecimiento' : '👤 Mi Perfil' }}</h1>
        <p class="subtitle" *ngIf="isAdmin">Ajustes generales del restaurante y gestión de categorías del menú</p>
      </div>
    </div>

    <!-- CONFIGURACIÓN ADMIN (VISTA UNIFICADA) -->
    <div *ngIf="isAdmin">
      <div class="grid-2">
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

          <div class="neon-card" style="margin-top:1rem;border-color:#D32F2F">
            <h3 style="margin-bottom:1rem">🗑️ Mantenimiento</h3>
            <button class="btn-outline" style="color:#D32F2F" (click)="clearCache()">🧹 Limpiar Caché Local</button>
            <p style="font-size:0.75rem;margin-top:0.5rem;color:var(--text-muted)">Borra datos en caché para forzar recarga fresca</p>
          </div>
        </div>

        <div>
          <div class="neon-card" style="margin-bottom:1rem; border-color:var(--brand-gold)">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem">
              <h3 style="margin:0">🖼️ Logo del Establecimiento</h3>
              <span class="badge badge-gold" *ngIf="selectedFile">Listo para Guardar</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.9rem">
              Logotipo oficial del restaurante visible en Navbar, comprobantes POS, comandas y pantalla de inicio.
            </p>
            <div style="text-align:center; padding:1.25rem; background:rgba(0,0,0,0.18); border-radius:12px; border:1px dashed var(--border); margin-bottom:1rem">
              <div style="display:inline-block; padding:0.6rem; background:var(--bg-card); border-radius:12px; box-shadow:0 4px 14px rgba(0,0,0,0.12)">
                <img [src]="logoDisplayUrl" alt="Logo actual" style="max-height:120px; max-width:220px; object-fit:contain; display:block; margin:0 auto; border-radius:8px">
              </div>
              <div *ngIf="selectedFile" style="margin-top:0.75rem">
                <span style="font-size:0.85rem; font-weight:600; color:var(--brand-gold)">
                  ✨ Nueva imagen: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
                </span>
              </div>
              <div *ngIf="!selectedFile" style="margin-top:0.5rem; font-size:0.75rem; color:var(--text-muted)">
                Formatos recomendados: PNG con transparencia o JPG (máx. 2 MB)
              </div>
            </div>
            <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" (change)="onFileSelected($event)" #fileInput style="display:none">
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; justify-content:center">
              <button class="btn-outline" (click)="fileInput.click()">
                📁 {{ selectedFile ? 'Cambiar Selección' : '📤 Seleccionar Nuevo Logo' }}
              </button>
              <button class="btn-primary" *ngIf="selectedFile" [disabled]="uploadingLogo" (click)="uploadLogo()">
                {{ uploadingLogo ? '⏳ Guardando...' : '💾 Guardar Logo' }}
              </button>
              <button class="btn-secondary" *ngIf="selectedFile" (click)="cancelSelectedFile()">
                ✖ Cancelar
              </button>
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


        </div>
      </div>

      <!-- PANEL DE CATEGORÍAS DEL MENÚ (UNIFICADO EN GENERAL) -->
      <div class="neon-card" id="categories-panel" style="margin-top:1.5rem;border-color:rgba(212, 175, 55, 0.45)">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem">
          <div>
            <h3 style="margin:0;display:flex;align-items:center;gap:0.5rem">
              <span>📂</span> Categorías del Menú ({{ categories.length }})
            </h3>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem">
              Clasificación oficial de platos y bebidas para la carta, POS y comandas de cocina
            </p>
          </div>
          <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap">
            <div class="search-bar" style="max-width:280px">
              <input class="form-input" placeholder="🔍 Buscar categoría..." [(ngModel)]="searchCategory"
                     (input)="applyFilter()" />
            </div>
            <button class="btn-primary" (click)="openCategoryForm()">+ Nueva Categoría</button>
          </div>
        </div>

        <div class="card table-card" style="box-shadow:none; border:1px solid var(--border)">
          <div *ngIf="loadingCategories" class="loading-state">Cargando categorías...</div>
          <div *ngIf="!loadingCategories && filteredCategories.length === 0" class="empty-state">
            No hay categorías registradas
          </div>
          <table *ngIf="!loadingCategories && filteredCategories.length > 0" class="data-table">
            <thead>
              <tr>
                <th (click)="sortCategories('icon')" class="sortable">Icono</th>
                <th (click)="sortCategories('name')" class="sortable">Nombre <span *ngIf="sortColumn === 'name'">{{ sortAsc ? '▲' : '▼' }}</span></th>
                <th (click)="sortCategories('order')" class="sortable">Orden <span *ngIf="sortColumn === 'order'">{{ sortAsc ? '▲' : '▼' }}</span></th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filteredCategories">
                <td class="icon-cell">{{ c.icon || '📦' }}</td>
                <td><strong>{{ c.name }}</strong></td>
                <td>{{ c.order ?? '—' }}</td>
                <td>
                  <span class="badge" [class.badge-green]="c.isActive !== false" [class.badge-red]="c.isActive === false">
                    {{ c.isActive !== false ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-icon" title="Editar" (click)="editCategory(c)">✏️</button>
                  <button class="btn-icon btn-icon-danger" title="Eliminar"
                          (click)="removeCategory(c._id)" *ngIf="c.isActive !== false">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Crear/Editar Categoría -->
      <div class="modal-overlay" *ngIf="showCategoryForm" (click)="closeCategoryForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editingCategory ? '✏️ Editar Categoría' : '➕ Nueva Categoría' }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="categoryForm.name" placeholder="Ej: Bebidas" />
            </div>
            <div class="form-group">
              <label>Código (3 letras) *</label>
              <input class="form-input" [(ngModel)]="categoryForm.code" placeholder="Ej: BEB" maxlength="3" style="text-transform:uppercase" />
              <small style="color:var(--text-muted);font-size:0.8rem">Usado para generar códigos de barras automáticos</small>
            </div>
            <div class="form-group">
              <label>Icono (emoji)</label>
              <input class="form-input" [(ngModel)]="categoryForm.icon" placeholder="Ej: 🥤" maxlength="5" />
            </div>
            <div class="form-group">
              <label>Orden</label>
              <input class="form-input" type="number" [(ngModel)]="categoryForm.order" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Activa</label>
              <label class="toggle-label" style="padding-top: 0.5rem;">
                <input type="checkbox" [(ngModel)]="categoryForm.isActive" />
                {{ categoryForm.isActive !== false ? 'Sí' : 'No' }}
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="closeCategoryForm()">Cancelar</button>
            <button class="btn-primary" (click)="saveCategory()" [disabled]="savingCategory">
              {{ savingCategory ? 'Guardando...' : (editingCategory ? 'Actualizar' : 'Guardar') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CLIENTE: MI PERFIL -->
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
  `,
  styles: [`
    .subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .categories-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .search-bar { flex: 1; max-width: 380px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    .actions { display: flex; gap: .4rem; }
    .icon-cell { font-size: 1.5rem; text-align: center; width: 60px; }
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { background: rgba(0, 229, 255, 0.1); color: var(--text-primary); }
    .toggle-label { display: flex; align-items: center; gap: .4rem; font-size: .85rem; color: var(--text-secondary); cursor: pointer; }
    .loading-state, .empty-state { padding: 2rem; text-align: center; color: var(--text-muted); }
  `]
})
export class SettingsComponent implements OnInit {
  isAdmin = false;
  isCliente = false;
  activeTab: 'general' | 'categories' = 'general';

  // Admin general settings
  storeName = ''; phone = ''; address = ''; whatsappNumber = ''; paymentMode = 'pre-pago';
  currentLogo = '';
  selectedFile: File | null = null;
  logoPreviewUrl = '';
  uploadingLogo = false;
  smtpHost = ''; smtpPort = 587; smtpSecure = false;
  smtpUser = ''; smtpPass = ''; smtpFrom = ''; alertEmail = '';

  // Categorías
  categories: any[] = [];
  filteredCategories: any[] = [];
  loadingCategories = false;
  savingCategory = false;
  showCategoryForm = false;
  editingCategory = false;
  searchCategory = '';
  sortColumn = 'order';
  sortAsc = true;
  categoryForm: any = { name: '', code: '', icon: '', order: 0, isActive: true };
  private editingCategoryId = '';

  // Cliente profile
  userProfile = { name: '', phone: '', address: '' };

  constructor(
    private api: ApiService,
    private settingsService: SettingsService,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const role = this.auth.currentUser?.role;
    if (role === 'admin') {
      this.isAdmin = true;
      this.loadSettings();
      this.loadCategories();

      this.route.queryParams.subscribe(params => {
        if (params['tab'] === 'categories') {
          this.activeTab = 'categories';
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

  setTab(tab: 'general' | 'categories'): void {
    this.activeTab = tab;
    if (tab === 'categories' && this.categories.length === 0) {
      this.loadCategories();
    }
  }

  loadSettings(): void {
    this.api.getSettings().subscribe({
      next: (s: any) => {
        this.storeName = s.storeName || '';
        this.phone = s.phone || '';
        this.address = s.address || '';
        this.whatsappNumber = s.whatsappNumber || '';
        this.paymentMode = s.paymentMode || 'pre-pago';
        this.currentLogo = s.logoUrl || '';
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
  }

  get logoDisplayUrl(): string {
    if (this.logoPreviewUrl) {
      return this.logoPreviewUrl;
    }
    if (this.currentLogo) {
      if (this.currentLogo.startsWith('http') || this.currentLogo.startsWith('/assets/') || this.currentLogo.startsWith('data:')) {
        return this.currentLogo;
      }
      return environment.apiUrl.replace('/api', '') + this.currentLogo;
    }
    return this.settingsService.logoFullUrl || '/assets/logo.png';
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire('⚠️ Archivo demasiado grande', 'El tamaño máximo permitido es 2 MB.', 'warning');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  cancelSelectedFile(): void {
    this.selectedFile = null;
    this.logoPreviewUrl = '';
  }

  uploadLogo(): void {
    if (!this.selectedFile) return;
    this.uploadingLogo = true;
    const formData = new FormData();
    formData.append('logo', this.selectedFile);

    this.api.updateSettings(formData).subscribe({
      next: (updated: any) => {
        this.uploadingLogo = false;
        this.currentLogo = updated?.logoUrl || '';
        this.logoPreviewUrl = '';
        this.selectedFile = null;
        this.settingsService.loadSettings();
        Swal.fire('✅ Logo Actualizado', 'El logo del establecimiento se ha guardado exitosamente.', 'success');
      },
      error: (err: any) => {
        this.uploadingLogo = false;
        Swal.fire('❌ Error', 'No se pudo subir el logo: ' + (err.error?.message || 'Error del servidor'), 'error');
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const dm = 1;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

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
      next: (updated: any) => {
        if (updated?.logoUrl) {
          this.currentLogo = updated.logoUrl;
        }
        this.selectedFile = null;
        this.logoPreviewUrl = '';
        this.settingsService.loadSettings();
        Swal.fire('✅', 'Configuración actualizada con éxito', 'success');
      },
      error: () => Swal.fire('❌', 'Error al guardar la configuración', 'error')
    });
  }

  // ── Gestión de Categorías ──────────────────────────────────────────────────
  loadCategories(): void {
    this.loadingCategories = true;
    this.api.getCategories().subscribe({
      next: (data: any) => {
        this.categories = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.loadingCategories = false;
      },
      error: () => {
        this.loadingCategories = false;
      }
    });
  }

  applyFilter(): void {
    let result = [...this.categories];
    if (this.searchCategory) {
      const q = this.searchCategory.toLowerCase();
      result = result.filter(c => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q));
    }
    this.applySort(result);
  }

  applySort(data?: any[]): void {
    const list = data || this.filteredCategories;
    list.sort((a, b) => {
      let valA: any, valB: any;
      if (this.sortColumn === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (this.sortColumn === 'order') {
        valA = a.order ?? 999;
        valB = b.order ?? 999;
      } else {
        valA = a[this.sortColumn] || '';
        valB = b[this.sortColumn] || '';
      }
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
    this.filteredCategories = list;
  }

  sortCategories(column: string): void {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }
    this.applySort();
  }

  openCategoryForm(): void {
    this.categoryForm = { name: '', code: '', icon: '🍽️', order: this.categories.length + 1, isActive: true };
    this.editingCategory = false;
    this.editingCategoryId = '';
    this.showCategoryForm = true;
  }

  editCategory(c: any): void {
    this.categoryForm = {
      name: c.name,
      code: c.code || '',
      icon: c.icon || '🍽️',
      order: c.order ?? 0,
      isActive: c.isActive !== false
    };
    this.editingCategory = true;
    this.editingCategoryId = c._id;
    this.showCategoryForm = true;
  }

  closeCategoryForm(): void {
    this.showCategoryForm = false;
  }

  saveCategory(): void {
    if (!this.categoryForm.name?.trim()) {
      Swal.fire('Atención', 'El nombre de la categoría es obligatorio', 'warning');
      return;
    }
    if (!this.categoryForm.code?.trim()) {
      Swal.fire('Atención', 'El código de 3 letras es obligatorio', 'warning');
      return;
    }
    this.categoryForm.code = this.categoryForm.code.toUpperCase();
    this.savingCategory = true;

    const req$ = this.editingCategory
      ? this.api.updateCategory(this.editingCategoryId, this.categoryForm)
      : this.api.createCategory(this.categoryForm);

    req$.subscribe({
      next: () => {
        this.savingCategory = false;
        this.closeCategoryForm();
        this.loadCategories();
        Swal.fire('✅', this.editingCategory ? 'Categoría actualizada' : 'Categoría creada', 'success');
      },
      error: (err: any) => {
        this.savingCategory = false;
        Swal.fire('❌ Error', err.error?.message || err.message, 'error');
      }
    });
  }

  removeCategory(id: string): void {
    Swal.fire({
      title: '¿Eliminar categoría?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.deleteCategory(id).subscribe({
          next: () => {
            this.loadCategories();
            Swal.fire('Eliminada', 'La categoría ha sido eliminada', 'success');
          },
          error: (err: any) => Swal.fire('Error', err.error?.message || err.message, 'error')
        });
      }
    });
  }

  saveProfile(): void {
    this.auth.updateProfile(this.userProfile).subscribe({
      next: () => {
        Swal.fire('✅', 'Perfil actualizado con éxito', 'success');
      },
      error: () => Swal.fire('❌', 'Error al actualizar perfil', 'error')
    });
  }

  clearCache(): void {
    this.api.clearCache();
    Swal.fire('🧹', 'Caché local limpiada correctamente', 'success');
  }
}
