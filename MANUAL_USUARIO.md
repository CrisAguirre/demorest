# Manual de Usuario — La Soupe à l'Oignon (demorest)

Sistema de gestión del restaurante: mesas, POS, inventario por áreas, eventos, caja, domicilios y finanzas.
Frontend Angular 16. Backend API REST + Socket.IO en Render.

## 0. Acceso a la aplicación

- **Producción (Vercel):** https://lasoupealoignon.vercel.app/
- **Local:** http://localhost:4200
- **Backend API (Render):** https://demorestbknd.onrender.com/api
- **Landing:** https://www.restmarieantoinette.com/

**Administrador:**
- Correo: `krontroth@gmail.com`
- Contraseña: `@dmin26`
- Fuente: `demorestbknd/src/utils/seedAdmin.js:16-21`. Cambia la contraseña tras el primer ingreso.

## 1. Acceso y roles

Ingresa con correo y contraseña. Según tu rol ves distintas opciones:

| Rol | Qué ve |
|---|---|
| admin | Todo |
| cajero | Mesas, Caja, Dashboard, Tiqueteras |
| mesero | Mesas, Domicilios, Dashboard |
| cocinero | Mesas, Dashboard, Cocina (KDS), Domicilios |
| cliente | Mesas, Mis Compras, Domicilios, Mi Perfil |

Ejemplo: `ana@c.com / •••••••• → /mesas`. El menú filtra solo por rol (`RoleGuard`).

## 2. Navegación rápida

- Barra superior (60px): logo, fecha operación en español (`viernes, 3 de octubre de 2026`), modo claro/oscuro, usuario y rol.
- Menú lateral izquierdo: scroll propio. Si haces scroll en el menú solo se mueve el menú; si haces scroll en el centro el menú queda fijo.
- En móvil el menú es de 64px solo iconos. Los 3 iconos del acordeón (Cocina/Barra/Servicio y General/Categorías) están alineados con los demás para que no se oculten.
- Hover/tooltip: pasa el mouse (o toca) un icono para ver el nombre, ej. `📦 Inventario`, `🍹 Barra`, `🛎️ Servicio`. En escritorio expandido el nombre ya es visible.
- Tema claro: blancos y grises metalizados. Tema oscuro: azul marino. Se cambia con ☀️/🌙.
- Moneda: pesos colombianos `es-CO` sin decimales, ej. `$32.000`.

## 3. Flujo ágil del día (5 pasos)

1. **Caja > Abrir** con base, ej. `$300.000`.
2. **Mesas**: ubica mesa libre en Salón 1 (1–8) o Salón 2 (9–16), o `🛍️ Para llevar`.
3. **POS**: Comandar → Cocinar → Cobrar.
4. **Domicilios/Eventos** si aplica.
5. **Caja > Cerrar** con conteo físico y revisa diferencia.

## 4. Operaciones

### 4.1 Mesas (`/mesas`, pantalla inicial)
Mapa por salones + Para llevar. Filtros: Todas/Libres/Ocupadas/Reservadas con conteo sobre 16 mesas.
- Libre → Venta / Reservar.
- Ocupada → Ver pedido / Anular (admin-cajero) / Liberar.
- Reservada → Iniciar pedido / Cancelar reserva.
- Ocupada = `status` del backend.

Ejemplo: `Mesa 5 - Ocupada $45.000`, `Mesa 2 - Libre`, `Para llevar (0)`.
Tip: usa ← Mesas en POS para atender varias mesas en paralelo.

### 4.2 POS (`/pos`, se abre desde Mesas)
Busca por nombre o código, filtra por categoría, suma/resta cantidad.
- Mesa libre: [Limpiar] [Comandar: registra, abre mesa e imprime] [Cobrar: factura inmediata `pagoInmediato` sin abrir cuenta].
- Mesa ocupada: ves Venta Actual (acumulado + lo nuevo). Cada comanda imprime **solo lo nuevo** por tandas.
- Cobro: muestra consumidos + total → *Imprimir factura* / *Aceptar y liberar*.
- Borradores por mesa en `localStorage` (`pos-borradores`), sobreviven recargas.

Ejemplo: `Ajiaco $32.000 + Encocado $36.000 = TOTAL $68.000`, `Mesa 5 / Para llevar`, pago Efectivo/Transferencia/Mixto.

### 4.3 Eventos y Catering (`/events` 📅)
Calendario Mes/Semana/Día estilo Notion + drawer lateral.
Crea/edita/elimina, cambia estado pendiente/confirmado/realizado/cancelado, carga plan de pagos por hitos manuales, imprime BEO (si hay varios el mismo día elige cuál).

Ejemplo: `Cumpleaños Pérez 50 pax - Total $2.500.000 Abonado $1.250.000 - BEO impreso`.
Secciones del formulario: cliente, cronograma, menú cocina/bar/otros, servicio.

### 4.4 Inventario (📦 acordeón)
Padre `Inventario`. Toca para expandir. Verás 3 iconos alineados:

#### Cocina (`/cocina` 🍲, 55 ítems)
Tabla con código, nombre, ubicación, stock/mínimo y estado PEDIR/OK.
Acciones: editar, Actualizar inventario, Nueva requisición → va a Compras (`origen=requisicion`).

Ejemplos reales:
- `CF-008 Camote 400g / mín 800 → PEDIR`
- `CA-001 Sal 1500g / mín 300 → OK`
- `CF-002 Limón tahití`, `CP-002 Pechuga pollo`, `CA-013 Arroz blanco`

#### Barra (`/barra` 🍹, 24 ítems)
Licores, cervezas e insumos coctelería.

Ejemplos:
- `BB-001 Ron Viejo de Caldas 750ml 6 und`
- `BB-015 Panela coctelería 3kg`, `BB-016 Limón tahití`, `BB-017 Lulo`, `BB-018 Maracuyá`
- `BB-002 Vino blanco 2/4 → PEDIR`

#### Servicio (`/servicio` 🛎️)
Desechables, baño, limpieza.

Ejemplo: `S-001 Servilletas 12 paq`, `S-002 Vasos 7oz 5/8 → PEDIR`.
Tip móvil: toca 📦 para abrir, verás 🍲 🍹 🛎️ centrados. El tooltip dice el nombre.

### 4.5 Platos (`/dishes` 🍲)
Carta con receta, foto y costo.
Crea/edita/desactiva/reactiva, sube foto JPG/PNG/WebP máx 3MB, agrega insumos, ve costo/margen/preparación. Clic en foto para ampliar.

Carta nueva 15 platos (C1..C15):
Entradas: `Ceviche 28.000, Empanadas maíz 14.000, Tostones camarón 24.000, Crema choclo 16.000, Croquetas gallina 18.000, Causa pechuga 20.000`.
Fuertes: `Ajiaco 32.000, Encocado 36.000, Posta negra 38.000, Fríjolada 30.000, Gallina ají maní 34.000, Piccata 36.000, Arroz meloso 38.000, Filete costra 40.000, Lomo saltado 36.000`.

Ejemplo ficha: `Ajiaco - Platos fuertes $32.000 - 5 insumos - Margen 65% - Ver receta`.

### 4.6 Caja (`/cash` 💰)
Abre con base inicial, vende durante el día, cierra con conteo físico. Ves esperado vs real y diferencia + historial.

Ejemplo: `Inicial $300.000 + Ventas $850.000 = Esperado $1.150.000 / Real $1.148.000 / Dif -$2.000`.

### 4.7 Dashboard (`/dashboard` 📊)
Resumen diario: Ventas Hoy, Transacciones, Productos, Alertas, Domicilios Activos, Productos Estrella y acceso a Mesas.

Ejemplo: `Ventas Hoy $320.000`, `🛵 Juan - Calle 10 pendiente`, `Top: Bandeja paisa 120 uds`.

## 5. Compras

### 5.1 Proveedores (`/suppliers` 🏭)
Crea/edita/desactiva, busca y asigna categoría.

Ejemplo: `001 - Carnes La Principal NIT 900.123.456-1 Tel 310… 🥩 Carnes`.

### 5.2 Compras (`/purchases` 🛍️)
Órdenes + bandeja de Requisiciones de Cocina/Barra/Servicio.
Crea orden desde catálogo con cantidad/costo, ve detalle, anula (revierte stock), atiende/descarta requisición.

Ejemplo: `FV-2024-001 Sin proveedor $450.000`, `Pendiente Cocina: Sal CA-001 5kg`.

### 5.3 Tiqueteras (`/ticket-books` 🎟️)
Almuerzos prepago. Vende/edita/desactiva, Marca Consumo y ve progreso.

Ejemplo: `Luis - 3/10 Almuerzos - Pagado $150.000 Activa`.

## 6. Gastos y Personal

### 6.1 Gastos Operativos (`/expenses` 💸)
Registra con categoría/fecha/monto/método/factura/proveedor, filtra y ve Total mes.

Ejemplo: `Arriendo mayo $1.800.000 efectivo 🔄 recurrente`, `Servicios $320.000`, `Nómina`.

### 6.2 Personal (`/staff` 👨‍🍳)
Pestaña Empleados (crea/edita/desactiva) y Usuarios por rol.

Ejemplo: `Mesero C. Ruiz Salario $1.423.500 Activo`, `ana@c.com admin`, `caja@c.com cajero`.

## 7. Inteligencia

### 7.1 Centro Financiero (`/finance` 🧠)
P&G: Ingresos, COGS, Utilidad Bruta/Neta, desglose gastos, tendencia 6 meses.

Ejemplo: `Ventas $12.500.000 - COGS $4.800.000 = Bruta $7.700.000 - Gastos $3.500.000 = Neta $4.200.000 Margen 18%`.

### 7.2 Reportes (`/reports` 📈)
Periodo día/semana/mes/año. Pestañas Ventas/Inventario/Productos/Cocina. Exporta CSV.

Ejemplo: `ventas-month.csv`, `Efectivo $5M / Transferencia $3M`, `Top: Bandeja 120 uds`.

## 8. Documentación

### 8.1 Documentación (`/documentacion` 📚, admin)
4 pestañas, buscador, filtro estado, ver/crear/editar, descarga plantilla `.txt`. Clave local `soupe-docs-v1`.
- Manuales (6): cocina/BPM, servicio, barra, caja, domicilios, eventos. Ej. `MAN-001 Manual cocina BPM v3.2 Vigente`.
- Formatos (6): requisición, temperaturas, limpieza, arqueo, PQRS, domicilios. Ej. `FOR-004 Acta arqueo`.
- Contratos modelo (6): fijo, indefinido, OPS, SENA, proveedor, arriendo. Ej. `CON-001 Contrato mesero`.
- Políticas y legal (6): RIT, calidad, saneamiento, manipulación, carpeta legal, alérgenos.

### 8.2 SG-SST (`/sg-sst` 🦺, admin)
Ciclo PHVA + KPIs 87%. CRUD local `soupe-sgsst-v1`.
- Matriz 8 peligros (cocina/barra/servicio/domicilios). Ej. `Quemadura aceite Cocina Alto En seguimiento`.
- 6 capacitaciones, 3 casos ATEL, 6 EPP/dotación (`Casco L. Toro Por reponer`), 6 documentos plan (`SST-001 Política 100%`).

## 9. Sistema

### 9.1 Domicilios (`/domicilios` 🛵)
Kanban + historial. Acepta → preparación, Despacha → en camino, Confirma entrega.

Ejemplo: `#A1B2C3 Juan Cra 15 #20-30 2x Bandeja - Repartidor L. Toro`.

### 9.2 Landing (🌍 externa)
Abre `restmarieantoinette.com` en pestaña nueva.

### 9.3 Configuración (⚙️ acordeón)
Toca para expandir General/Categorías (iconos alineados en móvil).
- General (`/settings`): nombre/tel/dirección/WhatsApp (`573137733408`), modo pre-pago/post-pago, logo, SMTP (`smtp.gmail.com:587`), limpiar caché, manual PDF.
- Categorías (`/categories`): organiza catálogo y códigos. Ej. `Bebidas - BEB 🥤 Orden 5 Activa`.

## 10. Otros módulos por ruta (no siempre en sidebar)

- Insumos (`/ingredients`): base de recetas. Ej. `Tomate Bodega kg 2000/500 OK`, `Azúcar 250/500 PEDIR`.
- Bodega (`/inventory`): productos vendibles. Ej. `Gaseosa 350ml BEB-001 Stock 48 Compra $2.000 Venta $4.500`.
- Cocina KDS (`/kitchen-order`): Nuevo → En preparación → Entregado, imprime ticket. Ej. `Mesa 5 #A1B2C3 2x Ajiaco`.
- Alertas (`/alerts`): stock. Ej. `🚨 sin_stock Harina 0`, `⚠️ stock_bajo Azúcar alta`.
- Deudores (`/debtors`): crédito. Ej. `DEU-001 Juan $200.000/$500.000 ⚠️ MORA 45d`, Abona/Paga/Aumenta.

## 11. Preguntas rápidas

- No veo Cocina/Barra/Servicio: toca 📦 Inventario para expandir. En móvil verás los 3 iconos centrados.
- No sé qué icono es: deja el mouse encima o mantén tocado, aparece el nombre.
- Mesa no se marca ocupada: verifica backend Render actualizado.
- Foto no carga: revisa `/uploads/...` en Render o usa URL absoluta.
- Descuento inventario desactivado por ahora (`DESCONTAR_INVENTARIO=false` backend).
