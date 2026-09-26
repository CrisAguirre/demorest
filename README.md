# La Soupe — Frontend (demorest)

Aplicación Angular 16 — sistema de gestión para el restaurante **La Soupe à l'Oignon**: punto de venta por mesas, inventario por áreas, eventos y catering, caja, reportes y domicilios.

> Estado actual: desarrollo activo en local. Backend en Render (`demorestbknd.onrender.com`).

## Arquitectura

- `src/app/core/` — servicios (`ApiService`, `AuthService`, preload/caché, websocket Socket.IO), guards (`AuthGuard`, `RoleGuard`), modelos e interceptores.
- `src/app/features/` — módulos por menú con lazy loading: `mesas`, `pos`, `dashboard`, `cocina` (áreas: `cocina`, `barra`, `servicio`), `ingredients` (insumos), `inventory`, `dishes`, `suppliers`, `purchases`, `cash`, `reports`, `finance`, `expenses`, `staff`, `ticket-books`, `alerts`, `domicilios`, `events`, `categories`, `settings`, `auth`.
- `src/app/shared/` — sidebar, componentes y estilos globales (`src/styles.scss`).

## Roles

`admin`, `cajero`, `mesero`, `cocinero`, `cliente`. El sidebar y las rutas se filtran por rol (`RoleGuard`).

## Flujos principales

### Mesas (`/mesas`, pantalla inicial)
- Mapa por salones (Salón 1: mesas 1–8, Salón 2: 9–16) + Para llevar aparte; filtros por estado y conteos sobre las 16 mesas.
- Mesa libre → Venta / Reservar · ocupada → Ver pedido / Anular (admin-cajero) / Liberar · reservada → Iniciar pedido / Cancelar reserva.
- Ocupada = `status` en ocupada según el backend (requiere backend actualizado y desplegado).

### POS (`/pos`)
- Mesa libre: **Limpiar** (rojo), **Comandar** (azul: registra, abre la mesa e imprime directo) y **Cobrar** (verde: factura inmediata sin abrir cuenta).
- Mesa libre: **Limpiar**, **Comandar** (registra, abre la mesa e imprime directo) y **Cobrar** (factura inmediata con `pagoInmediato`, sin abrir cuenta).
- Mesa ocupada: vista única de Venta Actual (acumulado + lo nuevo que se agrega); cada comanda imprime **solo lo nuevo** (tandas, sin repetir); **Cobrar** muestra consumidos + total con opciones *Imprimir factura* / *Aceptar y liberar*.
- Borradores por mesa en `localStorage` (sobreviven recargas; se limpian al cobrar/anular/liberar); botón ← Mesas para trabajo paralelo.

### Inventario por áreas
- Insumos: tabla estilo reporte (PEDIR/OK = stock < mínimo).
- Cocina / Barra / Servicio: vistas autocontenidas (20 ítems de ejemplo c/u) con CRUD local, ventana **Actualizar inventario** (existencias editables + nuevo ítem con código automático) y **orden de compra** por área (borrador editable).

### Eventos y Catering
- Submenús Evento/Catering, calendario mensual estilo Notion, detalle lateral, formulario por secciones (cliente, cronograma, menú cocina/bar/otros, servicio) y **BEO imprimible** con selector si hay varios eventos el mismo día.

## Backend y despliegue

- API REST + Socket.IO en Render; frontend desplegado en Vercel (auto-deploy con cada merge a `main`).
- Flujo de cambios: rama `main` del fork → PR al propietario → merge → redeploy.
- Notas de producción: las mesas marcan ocupada solo con el backend actualizado; el descuento de inventario está desactivado por ahora (`DESCONTAR_INVENTARIO=false` en el backend).

## Desarrollo local

```bash
npm install
ng serve            # http://localhost:4200/
ng build --configuration development
ng test --watch=false --browsers=ChromeHeadless --include="**/pos/pos.component.spec.ts"
```

## Convenciones

- Español (es-CO) en UI y mensajes; moneda con formato `1.0-0`.
- Commits en español, descriptivos; sin `push` directo a `upstream` (solo al fork `origin` + PR).
