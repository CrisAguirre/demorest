# AGENTS.md — demorest (frontend La Soupe)

## Proyecto
Angular 16 + Karma/Jasmine. Sistema de gestión del restaurante La Soupe à l'Oignon.
Backend: API REST + Socket.IO en Render (`demorestbknd`). Frontend desplegado en Vercel.

## Estructura
- `src/app/core/` — servicios (`ApiService`, `AuthService`, preload/caché, websocket), guards, modelos.
- `src/app/features/` — módulos lazy: `mesas`, `pos`, `dashboard`, `cocina`, `barra`, `servicio`, `ingredients`, `inventory`, `dishes`, `events`, `cash`, `reports`, `finance`, `domicilios`, `documentacion`, `sg-sst`, resto.
- `src/app/shared/` — sidebar y estilos globales en `src/styles.scss`.

## Flujos clave (no romper)
- **Mesas** (`/mesas`, inicial): mapa por salones; ocupada = `status` del backend. Diálogos: Venta/Reservar, Ver pedido/Anular/Liberar.
- **POS**: mesa libre [Limpiar][Comandar][Cobrar]; ocupada: venta acumulada + agregar directo, cada comanda imprime solo lo nuevo (`impresoQty`/`soloNuevos`); borradores por mesa en `localStorage` (`pos-borradores`).
- **Cobro**: aviso con consumidos + total → *Imprimir factura* / *Aceptar y liberar*. `pagoInmediato` en mesa libre.
- **Inventario por áreas**: Insumos estilo reporte (PEDIR si stock < mínimo); Cocina (55 ítems)/Barra (24 ítems)/Servicio con requisición al API (`origen=requisicion`, fallback `localStorage`) y bandeja en Compras.
- **Eventos**: calendario Mes/Semana/Día, drawer con plan de pagos por hitos manuales, BEO imprimible, formulario por secciones.
- **Menú**: sin Alertas (ruta `/alerts` sigue viva); `documentacion` y `sg-sst` muestran "En proceso de desarrollo".

## Comandos
```bash
ng serve
ng build --configuration development
ng test --watch=false --browsers=ChromeHeadless --include="**/pos/pos.component.spec.ts"
```

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
- Pendientes conocidos: deploy backend con últimos fixes; backfill de ventas viejas; commit/push a demanda.
