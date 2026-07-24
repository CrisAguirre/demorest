import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Staff } from '../../core/models/interfaces';

@Component({
  selector: 'app-staff',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">👨‍🍳 Personal y Usuarios</h1>
          <p class="page-subtitle">Gestión de empleados y cuentas del sistema</p>
        </div>
        <button class="btn-primary" (click)="activeTab='empleados';openStaffForm()" *ngIf="activeTab==='empleados'">+ Nuevo Empleado</button>
        <button class="btn-primary" (click)="activeTab='usuarios';openUserForm()" *ngIf="activeTab==='usuarios'">+ Nuevo Usuario</button>
      </div>

      <div class="tabs-bar">
        <button [class]="activeTab==='empleados'?'tab active':'tab'" (click)="activeTab='empleados';loadStaff()">👨‍💼 Empleados</button>
        <button [class]="activeTab==='usuarios'?'tab active':'tab'" (click)="activeTab='usuarios';loadUsers()">🔐 Usuarios del Sistema</button>
      </div>

      <!-- ═══ STAFF TAB ═══ -->
      <div *ngIf="activeTab==='empleados'">
        <div class="search-bar">
          <input class="form-input" placeholder="🔍 Buscar empleado..." [(ngModel)]="staffSearch" (input)="applyStaffSort()" />
        </div>
        <div class="card table-card">
          <div *ngIf="staffLoading" class="loading-state">Cargando personal...</div>
          <div *ngIf="!staffLoading && staffFiltered.length === 0" class="empty-state">No hay empleados que coincidan</div>
          <table *ngIf="!staffLoading && staffFiltered.length > 0" class="data-table">
            <thead>
              <tr>
                <th (click)="staffSort('name')" class="sortable">Nombre</th>
                <th (click)="staffSort('position')" class="sortable">Cargo</th>
                <th (click)="staffSort('phone')" class="sortable">Teléfono</th>
                <th (click)="staffSort('salary')" class="sortable">Salario</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of staffFiltered">
                <td><strong>{{ item.name }}</strong></td>
                <td><span class="badge badge-cyan">{{ item.position }}</span></td>
                <td>{{ item.phone || '—' }}</td>
                <td>{{ item.salary | currency }}</td>
                <td>
                  <span class="badge" [class.badge-green]="item.isActive" [class.badge-red]="!item.isActive">
                    {{ item.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-icon" title="Editar" (click)="editStaff(item)">✏️</button>
                  <button class="btn-icon btn-icon-danger" title="Desactivar" (click)="removeStaff(item._id)" *ngIf="item.isActive">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══ USERS TAB ═══ -->
      <div *ngIf="activeTab==='usuarios'">
        <div class="search-bar">
          <input class="form-input" placeholder="🔍 Buscar usuario..." [(ngModel)]="userSearch" (input)="applyUserFilter()" />
          <select class="form-input" style="max-width:180px" [(ngModel)]="userRoleFilter" (change)="loadUsers()">
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="cajero">Cajero</option>
            <option value="cocinero">Cocinero</option>
            <option value="mesero">Mesero</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
        <div class="card table-card">
          <div *ngIf="usersLoading" class="loading-state">Cargando usuarios...</div>
          <div *ngIf="!usersLoading && usersFiltered.length === 0" class="empty-state">No hay usuarios que coincidan</div>
          <table *ngIf="!usersLoading && usersFiltered.length > 0" class="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usersFiltered">
                <td><strong>{{ u.name }}</strong></td>
                <td class="mono">{{ u.email }}</td>
                <td><span class="badge" [class.badge-gold]="u.role==='admin'" [class.badge-cyan]="u.role==='cajero'" [class.badge-green]="u.role==='cocinero'" [class.badge-orange]="u.role==='mesero'">{{ u.role }}</span></td>
                <td>{{ u.phone || '—' }}</td>
                <td>
                  <span class="badge" [class.badge-green]="u.isActive" [class.badge-red]="!u.isActive">
                    {{ u.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-icon" title="Editar" (click)="editUser(u)">✏️</button>
                  <button class="btn-icon btn-icon-danger" title="Desactivar" (click)="toggleUser(u)" *ngIf="u.isActive">🚫</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Staff Form Modal -->
      <div class="modal-overlay" *ngIf="showStaffForm" (click)="closeStaffForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editingStaff ? '✏️ Editar Empleado' : '➕ Nuevo Empleado' }}</h2>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="staffForm.name" />
            </div>
            <div class="form-group">
              <label>Cargo</label>
              <select class="form-input" [(ngModel)]="staffForm.position">
                <option value="Administrador">Administrador</option>
                <option value="Cajero">Cajero</option>
                <option value="Mesero">Mesero</option>
                <option value="Cocinero">Cocinero</option>
                <option value="Ayudante">Ayudante</option>
                <option value="Repartidor">Repartidor</option>
              </select>
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input class="form-input" [(ngModel)]="staffForm.phone" />
            </div>
            <div class="form-group">
              <label>Salario</label>
              <input class="form-input" type="number" [(ngModel)]="staffForm.salary" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="closeStaffForm()">Cancelar</button>
            <button class="btn-primary" (click)="saveStaff()" [disabled]="staffSaving">
              {{ staffSaving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- User Form Modal -->
      <div class="modal-overlay" *ngIf="showUserForm" (click)="closeUserForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editingUser ? '✏️ Editar Usuario' : '➕ Nuevo Usuario' }}</h2>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nombre *</label>
              <input class="form-input" [(ngModel)]="userForm.name" />
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input class="form-input" type="email" [(ngModel)]="userForm.email" />
            </div>
            <div class="form-group">
              <label>Contraseña {{ editingUser ? '(dejar vacío para mantener)' : '*' }}</label>
              <input class="form-input" type="password" [(ngModel)]="userForm.password" />
            </div>
            <div class="form-group">
              <label>Rol</label>
              <select class="form-input" [(ngModel)]="userForm.role">
                <option value="admin">Admin</option>
                <option value="cajero">Cajero</option>
                <option value="cocinero">Cocinero</option>
                <option value="mesero">Mesero</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input class="form-input" [(ngModel)]="userForm.phone" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="closeUserForm()">Cancelar</button>
            <button class="btn-primary" (click)="saveUser()" [disabled]="userSaving">
              {{ userSaving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-bar { display:flex; gap:1rem; align-items:center; margin-bottom:1rem; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .full-width { grid-column: 1 / -1; }
    .actions { display:flex; gap:.4rem; }
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { background-color: rgba(0, 229, 255, 0.1); color: var(--text-primary); }
    .tabs-bar { display:flex; gap:0; margin-bottom:1.5rem; border-bottom:1px solid var(--border); }
    .tab { padding:0.6rem 1.2rem; cursor:pointer; border:none; background:none; color:var(--text-muted); font-size:0.85rem; border-bottom:2px solid transparent; transition:all 0.2s; }
    .tab.active { color:var(--brand-gold); border-bottom-color:var(--brand-gold); font-weight:600; }
    .mono { font-family:monospace; font-size:0.8rem; }
  `]
})
export class StaffComponent implements OnInit {
  // Staff
  staffItems: Staff[] = [];
  staffFiltered: Staff[] = [];
  staffLoading = false; staffSaving = false; showStaffForm = false; editingStaff = false;
  staffSearch = ''; staffSortColumn = 'name'; staffSortAsc = true;
  staffForm: any = {};
  private staffEditingId = '';

  // Users
  users: any[] = [];
  usersFiltered: any[] = [];
  usersLoading = false; userSaving = false; showUserForm = false; editingUser = false;
  userSearch = ''; userRoleFilter = '';
  userForm: any = {};
  private userEditingId = '';

  activeTab = 'empleados';

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadStaff(); }

  // ── Staff ──
  loadStaff() {
    this.staffLoading = true;
    this.api.getStaff().subscribe({
      next: (data) => { this.staffItems = data; this.applyStaffSort(); this.staffLoading = false; },
      error: () => this.staffLoading = false
    });
  }

  applyStaffSort() {
    let result = this.staffItems;
    const s = this.staffSearch.toLowerCase();
    if (s) result = result.filter(i => i.name.toLowerCase().includes(s));
    result.sort((a: any, b: any) => {
      const va = (a[this.staffSortColumn] || '').toString().toLowerCase();
      const vb = (b[this.staffSortColumn] || '').toString().toLowerCase();
      return va < vb ? (this.staffSortAsc ? -1 : 1) : va > vb ? (this.staffSortAsc ? 1 : -1) : 0;
    });
    this.staffFiltered = result;
  }

  staffSort(column: string) {
    if (this.staffSortColumn === column) this.staffSortAsc = !this.staffSortAsc;
    else { this.staffSortColumn = column; this.staffSortAsc = true; }
    this.applyStaffSort();
  }

  openStaffForm() {
    this.staffForm = { position: 'Empleado', salary: 0 };
    this.editingStaff = false; this.staffEditingId = ''; this.showStaffForm = true;
  }

  editStaff(item: Staff) {
    this.staffForm = { ...item };
    this.editingStaff = true; this.staffEditingId = item._id; this.showStaffForm = true;
  }

  closeStaffForm() { this.showStaffForm = false; }

  saveStaff() {
    if (!this.staffForm.name) return;
    this.staffSaving = true;
    const obs = this.editingStaff ? this.api.updateStaffMember(this.staffEditingId, this.staffForm) : this.api.createStaffMember(this.staffForm);
    obs.subscribe({
      next: () => { this.staffSaving = false; this.closeStaffForm(); this.loadStaff(); },
      error: () => { this.staffSaving = false; alert('Error al guardar empleado'); }
    });
  }

  removeStaff(id: string) {
    if (!confirm('¿Desactivar este empleado?')) return;
    this.api.deleteStaffMember(id).subscribe({ next: () => this.loadStaff() });
  }

  // ── Users ──
  loadUsers() {
    this.usersLoading = true;
    const params: any = {};
    if (this.userRoleFilter) params.role = this.userRoleFilter;
    this.api.getAllUsers(params).subscribe({
      next: (data) => { this.users = data; this.applyUserFilter(); this.usersLoading = false; },
      error: () => this.usersLoading = false
    });
  }

  applyUserFilter() {
    const s = this.userSearch.toLowerCase();
    this.usersFiltered = this.users.filter(u => !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }

  openUserForm() {
    this.userForm = { role: 'cocinero' };
    this.editingUser = false; this.userEditingId = ''; this.showUserForm = true;
  }

  editUser(u: any) {
    this.userForm = { name: u.name, email: u.email, role: u.role, phone: u.phone };
    this.editingUser = true; this.userEditingId = u._id; this.showUserForm = true;
  }

  closeUserForm() { this.showUserForm = false; }

  saveUser() {
    if (!this.userForm.name || !this.userForm.email) return;
    this.userSaving = true;
    const obs = this.editingUser
      ? this.api.updateUser(this.userEditingId, this.userForm)
      : this.api.registerUser(this.userForm);
    obs.subscribe({
      next: () => { this.userSaving = false; this.closeUserForm(); this.loadUsers(); },
      error: (err) => { this.userSaving = false; alert('Error: ' + (err.error?.message || err.message)); }
    });
  }

  toggleUser(u: any) {
    if (!confirm(`¿Desactivar usuario "${u.name}"?`)) return;
    this.api.deleteUser(u._id).subscribe({ next: () => this.loadUsers() });
  }
}