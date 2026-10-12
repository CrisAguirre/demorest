# 📖 Sistema de Gestión Integral para Restaurantes
**Manual de Usuario**  
*Versión 2.0 — Actualizado Octubre 2026*  
*Entornos: Producción ([Vercel](https://lasoupealoignon.vercel.app/) / [Render](https://demorestbknd.onrender.com/api)) | Local (`localhost:4200` / `localhost:5000`)*

---

## 📑 Tabla de Contenido
1. [Introducción y Visión General](#1-introducción-y-visión-general)
2. [Arquitectura de Accesos y Matriz de Roles](#2-arquitectura-de-accesos-y-matriz-de-roles)
3. [Primer Ingreso y Navegación](#3-primer-ingreso-y-navegación)
   - [Pantalla de Inicio de Sesión](#pantalla-de-inicio-de-sesión)
   - [Nuevo Menú Lateral Retraído (Sidebar Acordeón)](#nuevo-menú-lateral-retraído-sidebar-acordeón)
4. [El Nuevo Dashboard Dinámico (Home)](#4-el-nuevo-dashboard-dinámico-home)
5. [Módulo de Operaciones](#5-módulo-de-operaciones)
   - [Mapa y Gestión de Mesas](#mapa-y-gestión-de-mesas)
   - [Punto de Venta (POS) y Comandas](#punto-de-venta-pos-y-comandas)
   - [Gestión de Domicilios (Kanban)](#gestión-de-domicilios-kanban)
   - [Eventos y Banquetes (BEO)](#eventos-y-banquetes-beo)
6. [Cocina y Carta (Producción)](#6-cocina-y-carta-producción)
   - [KDS de Cocina en Tiempo Real](#kds-de-cocina-en-tiempo-real)
   - [Barra y Coctelería](#barra-y-coctelería)
   - [Platos, Recetas y Escandallo](#platos-recetas-y-escandallo)
   - [Tiqueteras y Pedidos](#tiqueteras-y-pedidos)
7. [Caja, Ventas y Facturación](#7-caja-ventas-y-facturación)
   - [Apertura, Arqueos y Cierre de Caja](#apertura-arqueos-y-cierre-de-caja)
   - [Control de Talonarios Consecutivos](#control-de-talonarios-consecutivos)
8. [Compras, Costos e Inventarios](#8-compras-costos-e-inventarios)
   - [Inventario por Áreas (Cocina, Barra, Servicio)](#inventario-por-áreas-cocina-barra-servicio)
   - [Directorio de Proveedores](#directorio-de-proveedores)
   - [Órdenes de Compra y Recepción](#órdenes-de-compra-y-recepción)
   - [Gastos Operativos](#gastos-operativos)
9. [Personal y Talento Humano](#9-personal-y-talento-humano)
   - [Gestión de Personal y Turnos](#gestión-de-personal-y-turnos)
   - [Usuarios del Sistema y Permisos](#usuarios-del-sistema-y-permisos)
10. [Módulo de Análisis: Reportes, Finanzas y Alertas](#10-módulo-de-análisis-reportes-finanzas-y-alertas)
    - [Reportes de Ventas, Inventario, Productos y Cocina](#reportes-de-ventas-inventario-productos-y-cocina)
    - [Panel Financiero (P&L y Flujo de Caja)](#panel-financiero-pl-y-flujo-de-caja)
    - [Centro de Alertas Proactivas](#centro-de-alertas-proactivas)
11. [Gestión Administrativa y Configuración del Sistema](#11-gestión-administrativa-y-configuración-del-sistema)
    - [Configuración General (Identidad, SMTP, Caché)](#configuración-general-identidad-smtp-caché)
    - [Gestión Unificada de Categorías](#gestión-unificada-de-categorías)
    - [Repositorio Documental y SG-SST](#repositorio-documental-y-sg-sst)
12. [Funcionalidades Transversales y Tecnológicas](#12-funcionalidades-transversales-y-tecnológicas)
13. [Guía de Solución de Problemas (Troubleshooting)](#13-guía-de-solución-de-problemas-troubleshooting)

---

## 1. Introducción y Visión General
**Sistema de Gestión Integral para Restaurantes** es una plataforma tecnológica desarrollada para orquestar de manera fluida y en tiempo real todas las operaciones gastronómicas: desde el servicio a la mesa y las ventas por mostrador, hasta el control de recetas con costeo de escandallo, seguimiento de compras, auditoría de caja y análisis financiero de rentabilidad.

### Principales Beneficios de la Versión 2.0
* **Dashboard Centralizado:** Vista ejecutiva en tiempo real como página de inicio predeterminada (`/dashboard`).
* **Navegación Ergonómica:** Barra lateral colapsable (60px) organizada en 8 grupos desplegables por acordeón, evitando la sobrecarga visual del usuario.
* **Configuración Unificada:** Fusión del catálogo de Categorías dentro del módulo de Configuración general mediante navegación por pestañas (`⚙️ General` y `📂 Categorías`).
* **Sincronización WebSocket:** Actualizaciones instantáneas en mapa de mesas, pedidos de cocina y despachos de domicilios sin necesidad de recargar la página.

---

## 2. Arquitectura de Accesos y Matriz de Roles
La seguridad del sistema está protegida por JSON Web Tokens (JWT) y validada tanto en las rutas del frontend (`AuthGuard`, `RoleGuard`) como en cada endpoint de la API REST del backend (`auth.middleware.js`, `role.middleware.js`).

### Roles de Usuario
1. **`admin` (Administrador):** Acceso irrestricto a todos los módulos operativos, financieros, de personal, configuraciones y reportes.
2. **`cajero` (Cajero / Operador de Caja):** Acceso prioritario al Punto de Venta (POS), control de turnos de caja, lectura de domicilios, alertas de stock y consumo de talonarios.
3. **`cocinero` (Personal de Cocina):** Acceso a la pantalla KDS de cocina, aceptación y despacho de domicilios, y panel de resumen operativo en dashboard.
4. **`mesero` (Personal de Salón):** Acceso a su perfil personal y visualización adaptativa del estado de sus mesas asignadas.
5. **`cliente` (Cliente Final):** Acceso exclusivo a su perfil personal e historial en la plataforma pública.

### Matriz de Permisos por Módulo
| Módulo / Funcionalidad | admin | cajero | cocinero | mesero | cliente |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dashboard (Home)** | ✅ Completo | ✅ Ventas / Caja | ✅ KDS / Despachos | ⚠️ Adaptado | ❌ |
| **Mesas** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Punto de Venta (POS)** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Cocina (KDS)** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Barra** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Domicilios** | ✅ | ✅ (Lectura) | ✅ (Aceptar) | ❌ | ❌ |
| **Caja y Turnos** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Talonarios** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Inventarios e Insumos** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Platos y Recetas** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Proveedores y Compras** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Personal (Staff)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Módulo de Análisis y Reportes** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Alertas de Stock** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Finanzas (P&L)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Documentación & SG-SST** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Gestión y Configuración** | ✅ | ❌ | ❌ | ❌ | ⚠️ Solo perfil |

---

## 3. Primer Ingreso y Navegación

### Pantalla de Inicio de Sesión
1. Abra su navegador e ingrese a la dirección web del aplicativo:
   - Producción: `https://lasoupealoignon.vercel.app/`
   - Desarrollo local: `http://localhost:4200/`
2. Ingrese su correo electrónico y contraseña asignada:
   - *Cuenta de Administrador Semilla:* `krontroth@gmail.com` *(se recomienda cambiar la clave tras el primer acceso)*.
   - *Cuentas de prueba en entorno local:* `admin@test.com` / `Admin123!`, `cajero@test.com` / `Cajero123!`, `cocinero@test.com` / `Cocinero123!`.
3. Haga clic en el botón **"Ingresar"**. Tras autenticarse exitosamente, el sistema lo redirigirá de inmediato al **Dashboard Principal**.

### Nuevo Menú Lateral Retraído (Sidebar Acordeón)
Para maximizar el espacio útil de trabajo en pantallas táctiles y monitores POS, el menú lateral cuenta con un diseño optimizado:
* **Estado por defecto:** Se inicia **retraído** (ancho compacto de 60 px) mostrando iconos representativos para no saturar la vista.
* **Botón de conmutación:** Ubicado en la parte superior del sidebar (`☰` para expandir a 240 px, `✕` para retraer). El estado elegido se guarda automáticamente en el navegador (`localStorage`).
* **Organización en 8 Grupos Acordeón (para Administradores):**
  1. 🏠 **Inicio:** Acceso directo al Dashboard (`/dashboard`).
  2. 🛎️ **Operaciones:** Mesas (`/mesas`), POS (`/pos`), Domicilios (`/domicilios`), Eventos (`/events`).
  3. 🍳 **Cocina y Carta:** Cocina KDS (`/cocina`), Barra (`/barra`), Platos / Recetas (`/dishes`), Tiqueteras (`/ticket-books`).
  4. 💳 **Caja y Ventas:** Caja (`/cash`), Talonarios (`/talonarios`).
  5. 📦 **Compras y Costos:** Insumos Cocina (`/inventory/insumos`), Barra (`/inventory/barra`), Servicio (`/inventory/servicio`), Proveedores (`/suppliers`), Compras (`/purchases`), Gastos Operativos (`/finance/expenses`).
  6. 👥 **Personal:** Personal y Turnos (`/staff`).
  7. 📈 **Análisis:** Centro de Reportes (`/reports`), Alertas (`/alerts`), Panel Financiero (`/finance`).
  8. 💼 **Administración:** Documentación (`/documentacion`), SG-SST (`/sg-sst`), Configuración y Categorías (`/settings`).
* **Expansión Inteligente:** Al navegar a cualquier sección secundaria o recargar la página, el acordeón del grupo activo se desplegará de forma automática, resaltando con una barra dorada la opción seleccionada.

---

## 4. El Nuevo Dashboard Dinámico (Home)
El Dashboard centraliza el pulso operativo y financiero del restaurante en un panel interactivo:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  📊 KPIs Principales:  Ventas Hoy  |  Transacciones  |  Ticket Prom.  |  Pendientes │
├──────────────────────────────┬───────────────────────────┬───────────────────────┤
│  🟢 Mapa de Mesas en Vivo    │  🛵 Domicilios Activos     │  💵 Estado de Caja    │
│  - Salón 1, Salón 2, Llevar  │  - Kanban de entregas     │  - Base y Ventas      │
│  - Libre, Ocupada, Reservada │  - Estado y repartidor    │  - Total en turno     │
├──────────────────────────────┴───────────────────────────┴───────────────────────┤
│  ⚠️ Insumos Críticos (Top 5 con menor stock)  [Ver Inventario Insumos ->]        │
├──────────────────────────────────────────┬───────────────────────────────────────┤
│  📈 Ventas de los Últimos 7 Días         │  🏆 Top 5 Platos Más Vendidos         │
├──────────────────────────────────────────┴───────────────────────────────────────┤
│  ⚡ Accesos Rápidos de 1 Clic:  [+ Nueva Venta POS]  [🍳 KDS]  [💵 Caja]  [📦 Compras] │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Componentes Clave del Dashboard:
1. **Tarjetas Métricas (KPIs):** Total facturado hoy, número de ventas cerradas, ticket promedio en pesos colombianos (`COP`) y conteo de órdenes activas en cocina/domicilios.
2. **Mini Mapa de Mesas en Tiempo Real:** Visualización rápida de las mesas distribuidas por zonas (Salón 1, Salón 2 y Para llevar). El indicador circular cambia en vivo:
   - 🟢 **Verde:** Libre.
   - 🔴 **Rojo:** Ocupada con cuenta abierta.
   - 🟡 **Amarillo:** Reservada.
3. **Monitor de Domicilios Activos:** Listado dinámico con estado de despacho, dirección y tiempo transcurrido con indicador luminoso pulsante.
4. **Caja del Turno Actual:** Estado de apertura, base inicial registrada, acumulado de efectivo y ventas electrónicas del día.
5. **Top 5 Insumos Críticos de Stock:** Muestra los 5 ingredientes con existencias más bajas respecto a su nivel mínimo, advirtiendo riesgo de agotamiento, con contador global de alertas y botón de salto inmediato a `/inventory/insumos`.
6. **Gráfico Semanal de Ventas:** Visualización de barras comparativas de ingresos durante los últimos 7 días.
7. **Top 5 Productos Estrella:** Ranking de los platos y bebidas con mayor volumen de rotación en el periodo.
8. **Botones de Acción Rápida (1 Clic):** Atajos instantáneos para abrir una nueva venta en POS, supervisar la cocina, auditar caja o registrar una compra a proveedor.

---

## 5. Módulo de Operaciones

### Mapa y Gestión de Mesas (`/mesas`)
* Organizadas por zonas: **Salón 1**, **Salón 2** y **Para llevar**.
* Al hacer clic sobre una mesa ocupada, permite ver la comanda asociada y su total acumulado.
* Posibilidad de cambiar de mesa una comanda o transferirla directamente al POS para facturación.

### Punto de Venta (POS) y Comandas (`/pos`)
Diseñado para la atención rápida y sin fricción de clientes:
1. **Asignación de Mesa o Domicilio:** Seleccione la mesa correspondiente desde el selector superior, o deje el campo vacío si se trata de un pedido para llevar/domicilio.
2. **Selección de Productos:** Filtre por categorías de la carta o use la barra de búsqueda en vivo ingresando el nombre del plato o escaneando el código de barras físico.
3. **Ajuste del Carrito:** Incremente o disminuya cantidades; agregue observaciones especiales para cocina (ej. *"sin cebolla"*, *"té con leche de almendras"*).
4. **Forma de Pago:**
   - **Efectivo:** Calcula automáticamente el cambio / devuelta requerida.
   - **Transferencia:** Compatible con transferencias bancarias o pasarelas QR (Nequi, Daviplata, Bancolombia).
   - **Mixto:** Permite dividir el valor total entre dos métodos de pago.
5. **Cierre de Venta:** Al presionar **"Cobrar"**, el sistema:
   - Si tiene mesa asignada: genera de inmediato el ticket y notifica a la pantalla de cocina vía WebSocket.
   - Si no tiene mesa: registra la comanda y crea la orden en el Kanban de domicilios.
   - Descuenta automáticamente del inventario los ingredientes requeridos según la receta del plato.
   - Consume un número consecutivo del talonario activo.

### Gestión de Domicilios (`/domicilios`)
Tablero Kanban interactivo dividido en 4 columnas de seguimiento:
1. 🕒 **Pendientes:** Pedidos entrantes pendientes de confirmación.
2. 👨‍🍳 **En Preparación:** Pedidos aceptados por el equipo de cocina.
3. 🛵 **En Camino:** Pedidos despachados y asignados a un repartidor (con datos de contacto y dirección de entrega).
4. ✅ **Entregados:** Historial de despachos completados satisfactoriamente.

### Eventos y Banquetes (`/events`)
* Administración de reservaciones especiales, banquetes y salones privados.
* Generación de la hoja BEO (*Banquet Event Order*) con minuta de alimentos, cronograma de servicio y acuerdos de anticipo financiero.

---

## 6. Cocina y Carta (Producción)

### KDS de Cocina en Tiempo Real (`/cocina`)
Pantalla optimizada para visualización en tabletas o monitores táctiles en el área de cocina caliente y repostería:
* **Alerta Sonora:** Emite un timbre sonoro característico (vía Web Audio API) cada vez que ingresa una nueva comanda desde el POS.
* **Organización Kanban de Comandas:**
  - **Nuevos:** Pedidos recién enviados desde el salón. El cocinero presiona **"Aceptar"** para iniciar la preparación.
  - **En Preparación:** Platos actualmente en elaboración. Cada tarjeta detalla los ingredientes, modificaciones especiales y tiempo transcurrido desde la orden.
  - **Entregados:** Comandas finalizadas y listas para despacho al mesero.

### Barra y Coctelería (`/barra`)
* Monitor dedicado para la preparación de café, té parisino, bebidas de autor y coctelería.
* Control estricto de dosificación estándar (1.5 oz por copa) y registro de mermas de licores y jarabes.

### Platos, Recetas y Escandallo (`/dishes`)
Catálogo completo de platos de la carta (ej. C1..C15):
* **Ficha Técnica y Escandallo:** Cada plato se asocia a su lista de ingredientes con cantidades y mermas estimadas.
* **Costeo Automático:** El sistema recalcula el costo teórico de la receta basándose en los costos de adquisición más recientes de los insumos.
* **Margen de Rentabilidad:** Sugerencia del precio de venta al público en función del costo real y el porcentaje de margen deseado.

### Tiqueteras y Pedidos (`/ticket-books`)
Configuración de impresoras térmicas ESC/POS para la emisión automática de comandas en comandera de cocina y barra.

---

## 7. Caja, Ventas y Facturación

### Apertura, Arqueos y Cierre de Caja (`/cash`)
Garantiza el cuadre exacto del dinero físico y digital durante cada turno operativo:
1. **Apertura de Turno:** Al iniciar la jornada, el cajero registra la base en efectivo disponible en gaveta (ej. $300.000 COP).
2. **Movimientos de Turno:** Registro de ingresos extraordinarios o egresos menores autorizados (salidas para compras de urgencia con comprobante).
3. **Arqueo y Cierre Z:** Al finalizar el turno:
   - El cajero ingresa el conteo ciego de billetes y monedas.
   - El sistema contrasta el conteo físico contra el total registrado por ventas en sistema (Efectivo vs. Transferencias).
   - Genera el reporte de diferencia (Sobrante / Faltante) y emite el comprobante de cierre definitivo.

### Control de Talonarios Consecutivos (`/talonarios`)
* Configuración de rangos numéricos autorizados (ej. Talonario Facturación POS del número 001 al 5000).
* Consumo secuencial automático en cada transacción con alerta de reposición cuando el talonario está próximo a agotarse.

---

## 8. Compras, Costos e Inventarios

### Inventario por Áreas (`/inventory`)
El inventario se divide en tres centros de costo diferenciados:
* 🥩 **Insumos Cocina (`/inventory/insumos`):** Carnes, lácteos, vegetales, especias y abarrotes.
* 🍹 **Barra (`/inventory/barra`):** Licores, vinos, jarabes, café gourmet y tés.
* 🍽️ **Servicio (`/inventory/servicio`):** Servilletas, desechables ecológicos, cristalería y material de empaque para domicilios.

**Capacidades del Inventario:**
* Generación automática de códigos de barras (formato: `Categoría + Proveedor + Consecutivo`).
* Umbral de **Stock Mínimo** configurable por cada producto.
* Registro de movimientos manuales (entradas por compra o ajustes por avería/merma).

### Directorio de Proveedores (`/suppliers`)
Catálogo de aliados comerciales con razón social, NIT, teléfono, correo electrónico, términos de crédito comercial y código identificador asignado.

### Órdenes de Compra y Recepción (`/purchases`)
* Creación de órdenes de compra con detalle de insumos, cantidad y costo unitario pactado.
* Estados de compra: *Pendiente*, *Recibida* o *Cancelada*. Al marcar una compra como recibida, el stock de insumos se incrementa automáticamente en el sistema y se actualiza el costo promedio ponderado.

### Gastos Operativos (`/finance/expenses`)
Registro y categorización de costos fijos y variables (arriendo del local, nómina, servicios públicos, mantenimiento preventivo de hornos y equipos).

---

## 9. Personal y Talento Humano

### Gestión de Personal y Turnos (`/staff`)
* Registro de colaboradores: nombre, cargo (Chef, Cocinero, Cajero, Jefe de Sala, Mesero, Domiciliario), salario base y tipo de contratación.
* Programación de turnos semanales y control de asistencia.

### Usuarios del Sistema y Permisos (`/staff` > pestaña Usuarios)
* Creación de cuentas de acceso para el personal.
* Asignación de rol (`admin`, `cajero`, `cocinero`, `mesero`, `cliente`).
* Activación, bloqueo y restablecimiento de contraseña segura.

---

## 10. Módulo de Análisis: Reportes, Finanzas y Alertas

### Centro de Reportes (`/reports`)
El motor analítico del restaurante cuenta con cuatro perspectivas clave:
1. 📊 **Pestaña Ventas:** KPIs de facturación total, ticket medio, tendencias por franjas horarias y desglose por métodos de pago.
2. 📦 **Pestaña Inventario:** Valoración monetaria total del inventario disponible en bodega y cálculo del potencial de ganancia estimada.
3. 🏆 **Pestaña Productos:** Top 10 platos de mayor venta, productos sin rotación en los últimos 30 días y márgenes brutos por familia.
4. ⏱️ **Pestaña Cocina:** Tiempos promedio de preparación y despacho por comanda.
* **Exportación:** Cada pestaña incluye un botón de **Exportar a CSV** con codificación UTF-8 BOM, garantizando compatibilidad nativa con Microsoft Excel.

### Panel Financiero (`/finance`)
* Estado mensual de Pérdidas y Ganancias (P&L): Ingresos brutos (-) Costo de Mercancía Vendida (COGS) (-) Gastos operativos (=) Utilidad Neta real.
* Visualización gráfica del flujo de caja mensual.

### Centro de Alertas Proactivas (`/alerts`)
* Semaforización en tiempo real:
  - 🟡 **Bajo:** Existencias entre el nivel mínimo y el umbral de seguridad.
  - 🟠 **Crítico:** Existencias menores al 50% del stock mínimo.
  - 🔴 **Agotado:** Existencia en cero (bloquea la venta en POS o advierte al cocinero).
* **Botón "Verificar Stock":** Realiza un barrido algorítmico inmediato por todo el catálogo y emite correos electrónicos automáticos si el servidor SMTP está configurado.

---

## 11. Gestión Administrativa y Configuración del Sistema

### Configuración Unificada (`/settings`)
La pantalla de configuración consolida en una interfaz por pestañas todas las variables maestras:

#### Pestaña 1: ⚙️ General
* **Datos del Establecimiento:** Nombre comercial, NIT, número telefónico, WhatsApp y dirección física.
* **Identidad Visual:** Subida y actualización del logotipo oficial en alta resolución.
* **Servidor de Correo SMTP:** Servidor saliente, puerto (ej. 465 SSL o 587 TLS), usuario y credenciales para el despacho automático de alertas y cierres de caja.
* **Manual de Usuario:** Botón directo para visualizar o descargar la versión oficial del Manual en formato PDF.
* **Mantenimiento y Rendimiento:** Botón **"Limpiar Caché Local"** para renovar de inmediato los datos cacheados en el navegador del cliente.

#### Pestaña 2: 📂 Categorías
Gestión integral de familias de productos y bebidas:
* Listado interactivo con código de categoría, nombre, tipo (Alimentos, Bebidas, Servicios), icono representativo y orden de aparición.
* Creación, edición y eliminación lógica de categorías con confirmaciones seguras vía SweetAlert2.

### Repositorio Documental y SG-SST (`/documentacion` & `/sg-sst`)
* **Documentación Operativa:** Manuales de BPM, servicio al salón, coctelería, formatos de temperaturas y actas de arqueo.
* **Carpeta Legal:** Control de vencimientos de RUT, Cámara de Comercio, Sayco & Acinpro y certificados de manipulación de alimentos.
* **SG-SST:** Matriz de riesgos laborales para personal de cocina y salón, protocolos de emergencias y dotación de seguridad.

---

## 12. Funcionalidades Transversales y Tecnológicas
* **Conexión en Tiempo Real (Socket.IO):** Indicador visual de conectividad en la interfaz. Notificaciones instantáneas de comandas y despachos entre salón, caja y cocina sin demoras.
* **Caché Inteligente Multinivel:** Estrategia híbrida de memoria + `localStorage` con tiempos de vida (TTL):
  - Catálogo de productos: 5 minutos.
  - Categorías de la carta: 10 minutos.
  - Alertas de stock: 2 minutos.
  - Parámetros de configuración: 30 minutos.
* **Diseño Responsivo:** Interfaz adaptada para monitores de escritorio, pantallas táctiles de cocina y dispositivos móviles de supervisión.

---

## 13. Guía de Solución de Problemas (Troubleshooting)

| Síntoma observado | Causa más probable | Procedimiento de Solución |
| :--- | :--- | :--- |
| **El Dashboard no muestra datos recientes** | Conexión a internet inestable o caché local expirada. | Haga clic en el botón de recarga del navegador. Si persiste, vaya a `Configuración` > `Limpiar Caché Local`. |
| **Los pedidos no suenan ni entran a Cocina** | Conexión WebSocket interrumpida o volumen del dispositivo silenciado. | Verifique que el indicador de conexión Socket esté en verde. En el navegador, autorice la reproducción de audio para el sitio. |
| **No llegan los correos de alerta de stock** | Parámetros SMTP erróneos o contraseña de aplicación no configurada. | Diríjase a `Configuración` > pestaña `General` > sección SMTP. Verifique el puerto y pruebe con una contraseña de aplicación de Gmail/Outlook. |
| **Aparece error "403 Prohibido" al ingresar a un menú** | El usuario logueado no posee el rol necesario para el módulo. | Ingrese con una cuenta de Administrador o solicite al encargado la actualización de permisos de su usuario en `Personal`. |
| **Aparece error "401 No Autorizado"** | El token de autenticación ha vencido por inactividad. | Cierre la sesión e ingrese nuevamente sus credenciales en la pantalla de Login. |
| **No permite cobrar una venta en POS** | No hay caja abierta en el turno o el talonario actual se ha agotado. | Abra el turno correspondiente en el menú `Caja` y verifique la disponibilidad de números en `Talonarios`. |

---
*Sistema de Gestión Integral para Restaurantes — Manual de Usuario. Documentación Oficial del Sistema.*
