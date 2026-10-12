# AGENTS.md — Sistema de Gestión Integral para Restaurantes (demorest & demorestbknd)

## Proyecto
Angular 16 + Karma/Jasmine (Frontend `demorest`) y Node.js/Express + MongoDB + Socket.IO (Backend `demorestbknd`).
Sistema de gestión integral para restaurantes.
Frontend desplegado en Vercel, Backend en Render.

## Accesos
- Producción Frontend: https://lasoupealoignon.vercel.app/
- Local Frontend: http://localhost:4200
- Backend API (Render): https://demorestbknd.onrender.com/api
- Local Backend: http://localhost:5000
- Ficha Técnica Comercial & Arquitectura: `/ficha_tecnica.html` (o `http://localhost:4200/ficha_tecnica.html`)
- Manual de Usuario Interactivo: `/MANUAL_DE_USUARIO.html` (o `http://localhost:4200/MANUAL_DE_USUARIO.html`)
- Admin seed: `krontroth@gmail.com` (clave en `demorestbknd/src/utils/seedAdmin.js`). Cambiar tras primer ingreso.

## Estructura
- `src/app/core/` — servicios (`ApiService`, `AuthService`, `PreloadService`, `WebSocketService`), guards (`AuthGuard`, `RoleGuard`), modelos e interfaces.
- `src/app/features/` — módulos lazy: `dashboard`, `mesas`, `pos`, `cocina`, `barra`, `servicio`, `ingredients`, `inventory`, `dishes`, `events`, `cash`, `reports`, `finance`, `domicilios`, `documentacion`, `sg-sst`, `settings`, `suppliers`, `purchases`, `staff`, `kitchen-order`, `ticket-books`.
- `src/app/shared/` — layout (`navbar`, `sidebar`), componentes reutilizables y estilos globales en `src/styles.scss`.
- `src/assets/` — recursos estáticos, imágenes, fuentes, `ficha_tecnica.html` y `MANUAL_DE_USUARIO.html`.
- Tokens globales: `--border` (`#D5DBE3` claro / blanco 10% dark) y `--text-main` (alias de `--text-primary`); usar siempre `var(--border)` en bordes.
- Paleta clara (elegante/moderna): blancos y grises metalizados `--bg-primary:#F2F3F5` `--bg-sidebar:#E8EAED` `--bg-input:#E8EAED` `--text-primary:#1E2430` `--text-secondary:#5C6575` `--text-muted:#9AA3B2`. Modo oscuro intacto. Dorado y bronce reservados para acentos de lujo.

## Flujos clave (no romper)
- **Inicio / Dashboard** (`/dashboard`, ruta por defecto tras login):
  - Centro de control dinámico que consolida la operación completa del restaurante.
  - **4 Stat Cards (KPIs clave)**: Ventas Hoy (total facturado y conteo de tickets), Ocupación de Mesas (ratio ocupadas/totales y porcentaje), Domicilios Activos (conteo en curso) y Stock Crítico (alertas de reposición inmediata).
  - **Accesos Rápidos (1 clic)**: Botones interactivos hacia Mesas & Pedidos, Domicilios, Caja & Turnos, Cocina KDS, Platos & Carta, Tiqueteras, Eventos y Reportes.
  - **Mini Mapa de Mesas en Vivo**: Vista miniatura del salón con códigos de color por estado (🟢 Libre, 🔴 Ocupada, 🟡 Reservada), capacidad, totales y enlace directo al salón.
  - **Domicilios Activos**: Lista en tiempo real de órdenes con estado (`pendiente`, `en_preparacion`, `en_camino`), dot parpadeante, cliente, dirección e ítems.
  - **Estado de Caja**: Visualización en vivo del estado (Caja Abierta 🟢 / Cerrada 🔴), cajero en turno, base inicial, ventas del turno y acceso a arqueo.
  - **Alertas de Stock Crítico**: Conteo de alertas sin leer y listado detallado de insumos críticos con enlace a Cocina/Inventario.
  - **Gráfica Semanal y Productos Estrella**: Historial de ingresos diarios y Top de platos más vendidos con ranking e importes.
  - **Personalización por Rol**: Adaptado dinámicamente para `admin`, `cajero`, `mesero`, `cocinero` y `cliente`.
  - **Tiempo Real**: Sincronización automática de mesas, domicilios y caja mediante suscripción a eventos de `WebSocketService`.

- **Sidebar Reorganizado & Iconos SVG Corporativos (2026-10-11)**:
  - Inicia **retraído por defecto (`collapsed = true`)** en 60px para dar máxima amplitud visual al Dashboard, con botón toggle `☰` / `✕` centrado.
  - Almacena y respeta la preferencia del usuario en `localStorage` (`sidebar_collapsed`).
  - **Iconos Vectoriales SVG**: Se reemplazaron todos los emojis por iconos SVG corporativos, sobrios y con trazados de color curados según la especialidad (Dashboard en celeste `#38BDF8`, Operaciones en índigo `#818CF8`, Cocina en naranja `#FB923C`, Caja en verde `#22C55E`, Compras en rosa `#F43F5E`, Análisis en púrpura `#A855F7`, Administración en fucsia `#EC4899`, Configuración en slate `#94A3B8`).
  - Menú de administración jerarquizado en 7 grupos lógicos con acordeones:
    1. `Inicio` (`/dashboard`)
    2. `Operaciones` (`/mesas`, `/domicilios`, `/events`)
    3. `Cocina y Carta` (`/dishes`, `/cocina`, `/barra`, `/servicio`)
    4. `Caja y Ventas` (`/cash`, `/ticket-books`)
    5. `Compras y Costos` (`/suppliers`, `/purchases`, `/expenses`)
    6. `Análisis` (`/finance`, `/reports`)
    7. `Administración` (`/staff`, `/documentacion`, `/sg-sst`, `/settings`)
  - Auto-despliegue del grupo padre al navegar a cualquier sub-ruta (`checkActiveRoutes()` con `NavigationEnd`) y resaltado visual `.has-active-child`.

- **Configuración del Establecimiento (`/settings`)**:
  - Módulo `/settings` con barra de pestañas: `⚙️ General` y `📂 Categorías`.
  - **Gestión Visual del Logo**: Visualización enmarcada del logo oficial, vista previa en tiempo real al seleccionar archivo (`PNG`, `JPG`, `SVG`, `WebP` hasta 2 MB), botón directo de guardado `💾 Guardar Logo` y refresco reactivo inmediato.
  - Panel de **Mantenimiento / Limpiar Caché Local** ubicado en la columna izquierda en vista escritorio.
  - Módulos de Manual de Usuario y Ficha Técnica desacoplados de esta vista para mantener la configuración de negocio limpia.
  - Pestaña Categorías incluye CRUD completo, tabla con ordenación por columnas, buscador en vivo, badges de estado activo/inactivo, modales de edición y confirmaciones seguras con SweetAlert2.
  - La ruta `/categories` redirige transparentemente hacia `/settings`.

- **Documentación (`/documentacion`, admin)**:
  - 4 pestañas: Manuales, Formatos, Contratos modelo y Políticas/Legal.
  - **Manual de Operaciones (`MAN-USU`, v2.0)**: Tarjeta con acceso directo a `📖 Abrir Manual HTML ↗` (`/MANUAL_DE_USUARIO.html`), navegación por capítulos, matriz de permisos y botón de detalle.
  - **Ficha Técnica Comercial & Arquitectura (`FCH-TEC`, v2.0)**: Tarjeta con acceso directo a `📋 Abrir Ficha Técnica ↗` (`/ficha_tecnica.html`), perspectiva 3D Drift Wall de los 12 módulos y alcances de hardware/software.
  - Migración reactiva en `cargar()`: actualiza automáticamente `localStorage` (`soupe-docs-v1`) para insertar/actualizar ambas fichas interactivas sin necesidad de borrar datos del usuario.

- **Ficha Técnica Comercial Interactiva (`ficha_tecnica.html`)**:
  - Landing publicitaria y técnica autónoma con diseño de alta fidelidad, compatible en escritorio y móvil.
  - **Drift Wall 3D**: Escenario de deriva continua en perspectiva tridimensional (ReactBits) que exhibe los 12 módulos funcionales con controles de pausa y recentrado.
  - **Iconografía Corporativa**: Iconos SVG coloreados con estilo sobrio y corporativo en la sección de *Funcionalidades Principales* y *Tecnología & Licenciamiento* (GNU GPL v3.0, derechos patrimoniales y pago único).
  - Modales enriquecidos con simulación de pantallas, Web Audio y especificaciones térmicas ESC/POS (80mm/58mm).

- **Manual de Usuario Interactivo (`MANUAL_DE_USUARIO.html`)**:
  - Guía completa de uso del sistema ("Sistema de Gestión Integral para Restaurantes") estructurada en 26 capítulos interactivos.
  - Menú lateral interactivo con iconografía vectorial SVG seria y profesional.
  - Buscador reactivo en tiempo real y selector de navegación fluida.
  - Diagramas paso a paso (Capítulos 03 y 07): Línea vertical conectora en plano posterior (`z-index: 1`) respecto a los nodos numéricos (`z-index: 3`, halo protector y fondo opaco).
  - Purgadas todas las marcas específicas o de ejemplo histórico. Sincronizado en la raíz del proyecto y en los assets estáticos del cliente.

- **Mesas** (`/mesas`): mapa por salones; ocupada = `status` del backend. Diálogos: Venta/Reservar, Ver pedido/Anular/Liberar.
- **POS**: mesa libre [Limpiar][Comandar][Cobrar]; ocupada: venta acumulada + agregar directo, cada comanda imprime solo lo nuevo (`impresoQty`/`soloNuevos`); borradores por mesa en `localStorage` (`pos-borradores`).
- **Cobro**: aviso con consumidos + total → *Imprimir factura* / *Aceptar y liberar*. `pagoInmediato` en mesa libre.
- **Inventario por áreas**: Insumos estilo reporte (PEDIR si stock < mínimo); Cocina/Barra/Servicio con requisición al API (`origen=requisicion`, fallback `localStorage`) y bandeja en Compras.
- **Eventos**: calendario Mes/Semana/Día, drawer con plan de pagos por hitos manuales, BEO imprimible, formulario por secciones.
- **SG-SST** (`/sg-sst`, admin): ciclo PHVA + KPIs (87% estándares); 5 pestañas — Matriz peligros, capacitaciones, casos ATEL, EPP/dotación, documentos plan. CRUD local (`soupe-sgsst-v1`).
- **Responsive global**: `styles.scss` con Mobile Fix Pack (cero scroll lateral, tablas con scroll interno, grids a 1 col, modales hoja inferior, inputs 16px).
- **Scroll independiente**: layout `height: calc(100dvh-60px)` con overflow independiente en sidebar y contenido principal.

## Comandos
```bash
# Frontend (demorest)
npm start                          # ng serve (localhost:4200)
npm run build                      # npx ng build prod (igual a Vercel)
npx stylelint "src/**/*.scss"      # Auditoría de estilos SCSS
npm test -- --watch=false --browsers=ChromeHeadless # Pruebas unitarias

# Backend (demorestbknd)
npm start                          # node server.js
npm run dev                        # nodemon server.js
npx eslint src/                    # Auditoría de código ESLint (Airbnb-base)
npm test                           # Suite completa Jest
```

## QA impecable + ESLint (Actualizado 2026-10-11)
- **Frontend**:
  - `npm run build` (producción) pasa al 100% en verde con código de salida 0.
  - `npx stylelint "src/**/*.scss"` pasa sin ningún problema (0 errores, 0 warnings).
  - Tests unitarios de componentes actualizados (`DashboardComponent` con cobertura de mocks para `WebSocketService`, `getTables` y `getCurrentCash`).
- **Backend (`demorestbknd`)**:
  - `npx eslint src/` pasa al 100% limpio (0 errores, 0 warnings) bajo las reglas Airbnb-base v15.
  - Corregido `src/controllers/sale.controller.js` eliminando variables huérfanas (`settings`) y alineando saltos de línea de parámetros de llamada de funciones (`recordMovement`).
  - Suite de pruebas Jest (`npm test`) validando controladores de ventas, insumos, alertas, reportes y finanzas.
- **Regla tras cada edición**: `ng build` + `stylelint` sin errores en frontend; `eslint` + `jest` sin errores en backend.

## Reglas de trabajo
- Español en UI y commits. Moneda `es-CO` formato `1.0-0`.
- Todo local por defecto: **nunca** `push`/PR/merge sin orden explícita. Solo `origin` (fork) + PR al propietario.
- Producción = Render (backend) + Vercel (frontend), auto-deploy por merge. El usuario prueba en `localhost:4200` contra Render.

