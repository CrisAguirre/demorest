# AGENTS.md — demorest (frontend La Soupe)

## Proyecto
Angular 16 + Karma/Jasmine. Sistema de gestión del restaurante La Soupe à l'Oignon.
Backend: API REST + Socket.IO en Render (`demorestbknd`). Frontend desplegado en Vercel.

## Estructura
- `src/app/core/` — servicios (`ApiService`, `AuthService`, preload/caché, websocket), guards, modelos.
- `src/app/features/` — módulos lazy: `mesas`, `pos`, `dashboard`, `cocina`, `barra`, `servicio`, `ingredients`, `inventory`, `dishes`, `events`, `cash`, `reports`, `finance`, `domicilios`, resto.
- `src/app/shared/` — sidebar y estilos globales en `src/styles.scss`.

## Flujos clave (no romper)
- **Mesas** (`/mesas`, inicial): mapa por salones; ocupada = `status` del backend. Diálogos: Venta/Reservar, Ver pedido/Anular/Liberar.
- **POS**: mesa libre [Limpiar][Comandar][Cobrar]; ocupada: venta acumulada + agregar directo, cada comanda imprime solo lo nuevo (`impresoQty`/`soloNuevos`); borradores por mesa en `localStorage` (`pos-borradores`).
- **Cobro**: aviso con consumidos + total → *Imprimir factura* / *Aceptar y liberar*. `pagoInmediato` en mesa libre.
- **Inventario por áreas**: Insumos estilo reporte (PEDIR si stock < mínimo); Cocina/Barra/Servicio autocontenidas con orden de compra local.
- **Eventos**: calendario Notion, BEO imprimible, formulario por secciones.

## Comandos
```bash
ng serve
ng build --configuration development
ng test --watch=false --browsers=ChromeHeadless --include="**/pos/pos.component.spec.ts"
```

## Reglas de trabajo
- Español en UI y commits. Moneda `es-CO` formato `1.0-0`.
- Todo local por defecto: **nunca** `push`/PR/merge sin orden explícita. Solo `origin` (fork) + PR al propietario.
- Tras editar: `ng build` + specs del módulo afectado en verde.
- Producción = Render (backend) + Vercel (frontend), auto-deploy por merge. El usuario prueba en `localhost:4200` contra Render.
- Pendientes conocidos: deploy backend con últimos fixes; backfill de ventas viejas; commit/push a demanda.
