# AGENTS.md — demorest (frontend La Soupe)

## Proyecto
Angular 16 + Karma/Jasmine. Sistema de gestión del restaurante La Soupe à l'Oignon.
Backend: API REST + Socket.IO en Render (`demorestbknd`). Frontend desplegado en Vercel.

## Accesos
- Producción: https://lasoupealoignon.vercel.app/
- Local: http://localhost:4200
- Backend API: https://demorestbknd.onrender.com/api
- Landing: https://www.restmarieantoinette.com/
- Admin seed: `krontroth@gmail.com` (clave en `MANUAL_USUARIO.pdf` / `demorestbknd/src/utils/seedAdmin.js`). Cambiar tras primer ingreso.

## Estructura
- `src/app/core/` — servicios (`ApiService`, `AuthService`, preload/caché, websocket), guards, modelos.
- `src/app/features/` — módulos lazy: `mesas`, `pos`, `dashboard`, `cocina`, `barra`, `servicio`, `ingredients`, `inventory`, `dishes`, `events`, `cash`, `reports`, `finance`, `domicilios`, `documentacion`, `sg-sst`, resto.
- `src/app/shared/` — sidebar y estilos globales en `src/styles.scss`.
- Tokens globales: `--border` (`#D5DBE3` claro / blanco 10% dark) y `--text-main` (alias de `--text-primary`); usar siempre `var(--border)` en bordes.
- Paleta clara (2026-10-03, elegante/moderna): blancos y grises metalizados `--bg-primary:#F2F3F5` `--bg-sidebar:#E8EAED` `--bg-input:#E8EAED` `--text-primary:#1E2430` `--text-secondary:#5C6575` `--text-muted:#9AA3B2`. Oscuro intacto. Dorado/bronce solo como acento.

## Flujos clave (no romper)
- **Mesas** (`/mesas`, inicial): mapa por salones; ocupada = `status` del backend. Diálogos: Venta/Reservar, Ver pedido/Anular/Liberar.
- **POS**: mesa libre [Limpiar][Comandar][Cobrar]; ocupada: venta acumulada + agregar directo, cada comanda imprime solo lo nuevo (`impresoQty`/`soloNuevos`); borradores por mesa en `localStorage` (`pos-borradores`).
- **Cobro**: aviso con consumidos + total → *Imprimir factura* / *Aceptar y liberar*. `pagoInmediato` en mesa libre.
- **Inventario por áreas**: Insumos estilo reporte (PEDIR si stock < mínimo); Cocina (55 ítems)/Barra (24 ítems)/Servicio con requisición al API (`origen=requisicion`, fallback `localStorage`) y bandeja en Compras.
- **Eventos**: calendario Mes/Semana/Día, drawer con plan de pagos por hitos manuales, BEO imprimible, formulario por secciones.
- **Menú**: sin Alertas (ruta `/alerts` sigue viva); `documentacion` y `sg-sst` implementados con datos ficticios locales (CRUD + `localStorage`, descarga `.txt`), sin backend.
- **Documentación** (`/documentacion`, admin): 4 pestañas — Manuales (7: operaciones app MAN-USU con PDF descargable + cocina/BPM, servicio, barra, caja, domicilios, eventos), Formatos (6: requisición, temperaturas, limpieza, arqueo, PQRS, domicilios), Contratos modelo (6: fijo, indefinido, OPS, SENA, proveedor, arriendo), Políticas y legal (6: RIT, calidad, saneamiento, manipulación, carpeta legal, alérgenos). Stats + buscador + filtro estado + modal ver/crear/editar + descarga plantilla.
- **SG-SST** (`/sg-sst`, admin): ciclo PHVA + KPIs (87% estándares); 5 pestañas — Matriz 8 peligros (cocina/barra/servicio/domicilios), 6 capacitaciones, 3 casos ATEL, 6 EPP/dotación, 6 documentos plan. CRUD local (`soupe-sgsst-v1`), badges por riesgo/estado.
- **Responsive global**: `styles.scss` trae Mobile Fix Pack (cero scroll lateral, tablas con scroll interno, grids a 1 col, modales hoja inferior, inputs 16px).
- **Scroll independiente (2026-10-02)**: `app-layout` `height: calc(100vh-60px)/calc(100dvh-60px)` + `overflow:hidden`; `app-content` `height:100%` + `overflow-y:auto` + `overscroll-behavior:contain`; `sidebar` `height: calc(100dvh-60px)` + `sticky top:60px` + `overflow:hidden`; `sidebar-nav` `flex:1` + `overflow-y:auto` + `contain`. Menú y contenido hacen scroll propio sin arrastrarse (desktop y móvil). Host `app-sidebar{display:flex}` en `styles.scss`. No usar `min-height` con scroll compartido en layout.

## Comandos
```bash
ng serve
ng build --configuration development
npx ng build # prod, igual que Vercel (npm run build)
ng test --watch=false --browsers=ChromeHeadless --include="**/pos/pos.component.spec.ts"
ng test --watch=false --browsers=ChromeHeadless --include="**/dishes/dishes.component.spec.ts"
```

## Manual usuario + PDF (2026-10-03)
- Fuente: `MANUAL_USUARIO.md` estructurado por sidebar admin (Mesas, POS, Eventos, Inventario>Cocina/Barra/Servicio, Platos C1..C15, Caja, Dashboard, Proveedores, Compras, Tiqueteras, Gastos, Personal, Financiero, Reportes, Documentación, SG-SST, Domicilios, Configuración) + anexos (Insumos, Bodega, KDS, Alertas, Deudores). Con ejemplos reales de datos.
- PDF: `MANUAL_USUARIO.pdf` generado con reportlab (portada + tabla accesos + secciones con regla dorada, tablas header charcoal). Regenerar con `python "C:\Users\USUARIO\AppData\Local\Temp\opencode\gen_manual_pdf.py"`. Incluye accesos Vercel + admin.
- Sidebar 2026-10-03: submenús (Cocina/Barra/Servicio, General/Categorías) alineados y centrados en móvil (64px) y colapsado; `*ngIf="item.expanded"` sin exigir `!collapsed`; tooltip `fixed` con nombre en hover/touch (`showTip/hideTip/scheduleHideTip`), sin duplicar label en expandido.

## Fixes deploy Vercel (2026-10-02, build prod en verde)
- **Dishes `TS2393`**: había doble `ampliarFoto(src)` / `ampliarFoto()` que rompía `npm run build` en Vercel. Unificado en `dishes.component.ts:491` `ampliarFoto(src?: string|null)` (si hay `src` setea `fotoZoom`; si no, usa `fotoUrl(recipeDish.imageUrl)`; siempre `showFoto=true`) + `cerrarFoto()` que limpia `fotoZoom` + `showFoto`. Overlay usa `(click)="cerrarFoto()"`, `closeForm()` limpia ambos. Spec 8/8 en verde.
- **Finance `NG8102`**: `FinancialSummary.saleRevenue: number` no-nulleable (`interfaces.ts:87`), se quitó `?? summary.totalRevenue` en `finance.component.ts:33,99` (ahora `summary.saleRevenue` directo). Build prod sin warnings.
- Verificado: `npx ng build` prod OK 2026-10-02; `pos` 45 SUCCESS; `dishes` 8 SUCCESS.

## Carta nueva (15 platos, fuente `recetario-carta-15-preparaciones.md` en Desktop)
- Entradas (1-6): Ceviche 28.000 · Empanadas maíz 14.000 · Tostones camarón 24.000 · Crema choclo 16.000 · Croquetas gallina 18.000 · Causa pechuga 20.000.
- Fuertes (7-15): Ajiaco 32.000 · Encocado 36.000 · Posta negra 38.000 · Fríjolada 30.000 · Gallina ají maní 34.000 · Piccata 36.000 · Arroz meloso 38.000 · Filete costra 40.000 · Lomo saltado 36.000.
- Códigos backend: platos `C1..C15`; insumos nuevos `CF-020..023, CA-016..026, CL-004, BI-003` (Cocina 55 ítems) + barra colombiana `BB-001` renombrado a Ron Viejo de Caldas y `BB-015..018` (Barra 24 ítems).
- Backend: seed `seedCarta15.js` + `seedBarraColombia.js`, `runBootSeeds` v4. Fotos en Mongo (base64). Precios/costos se cargan manual tras deploy.
- `src/assets/Recetas/*.md` NO contienen recetas (solo imágenes de calendarios) — no usar como fuente.

## Reglas de trabajo
- Español en UI y commits. Moneda `es-CO` formato `1.0-0`.
- Todo local por defecto: **nunca** `push`/PR/merge sin orden explícita. Solo `origin` (fork) + PR al propietario.
- Tras editar: `ng build` + specs del módulo afectado en verde.
- Producción = Render (backend) + Vercel (frontend), auto-deploy por merge. El usuario prueba en `localhost:4200` contra Render.
- Finanzas: cards `.pl-card` con icono 44px, `section-title` con borde inferior y `expense-bar-bg: var(--bg-input)`; `.card` con padding 1.25rem.
- Documentación/SG-SST: claves LS `soupe-docs-v1` / `soupe-sgsst-v1`; módulos importan `FormsModule`.
- Pendientes conocidos: deploy backend con últimos fixes; backfill de ventas viejas; commit/push a demanda (pendiente push: scroll independiente + fix dishes/finance + sidebar tooltip + manual/PDF + paleta clara 2026-10-03).
