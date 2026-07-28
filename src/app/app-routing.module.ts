// src/app/app-routing.module.ts  — REEMPLAZA el original
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: 'login', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  {
    path: '', canActivate: [AuthGuard], children: [
      { path: 'dashboard',  loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'inventory',  loadChildren: () => import('./features/inventory/inventory.module').then(m => m.InventoryModule), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'pos',        loadChildren: () => import('./features/pos/pos.module').then(m => m.PosModule), canActivate: [RoleGuard], data: { roles: ['admin', 'cajero'] } },
      { path: 'cash',       loadChildren: () => import('./features/cash/cash.module').then(m => m.CashModule), canActivate: [RoleGuard], data: { roles: ['admin', 'cajero'] } },
      { path: 'reports',    loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule),    canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'alerts',     loadChildren: () => import('./features/alerts/alerts.module').then(m => m.AlertsModule),      canActivate: [RoleGuard], data: { roles: ['admin', 'cajero'] } },
      { path: 'domicilios', loadChildren: () => import('./features/domicilios/domicilios.module').then(m => m.DomiciliosModule), canActivate: [RoleGuard], data: { roles: ['admin', 'cajero', 'cocinero'] } },
      { path: 'settings',   loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule), canActivate: [RoleGuard], data: { roles: ['admin', 'cliente'] } },
      // ── NUEVAS RUTAS RESTAURANTE ──────────────────────────────────────────
      { path: 'suppliers',  loadChildren: () => import('./features/suppliers/suppliers.module').then(m => m.SuppliersModule),  canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'purchases',  loadChildren: () => import('./features/purchases/purchases.module').then(m => m.PurchasesModule),  canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'ingredients', loadChildren: () => import('./features/ingredients/ingredients.module').then(m => m.IngredientsModule), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'dishes', loadChildren: () => import('./features/dishes/dishes.module').then(m => m.DishesModule), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'staff', loadChildren: () => import('./features/staff/staff.module').then(m => m.StaffModule), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'kitchen', loadChildren: () => import('./features/kitchen-order/kitchen-order.module').then(m => m.KitchenOrderModule), canActivate: [RoleGuard], data: { roles: ['cocinero', 'admin'] } },
      { path: 'ticket-books', loadChildren: () => import('./features/ticket-books/ticket-books.module').then(m => m.TicketBooksModule), canActivate: [RoleGuard], data: { roles: ['admin', 'cajero'] } },
      { path: 'categories', loadChildren: () => import('./features/categories/categories.module').then(m => m.CategoriesModule), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'expenses',   loadChildren: () => import('./features/expenses/expenses.module').then(m => m.ExpensesModule),    canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: 'finance',    loadChildren: () => import('./features/finance/finance.module').then(m => m.FinanceModule),       canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
