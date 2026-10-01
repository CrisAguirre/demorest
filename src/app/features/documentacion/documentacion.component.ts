import { Component, OnInit } from '@angular/core';

interface DocItem {
  _id: string;
  codigo: string;
  titulo: string;
  categoria: string;
  tipo: 'manual' | 'formato' | 'contrato' | 'politica';
  version: string;
  responsable: string;
  actualizado: string;
  estado: 'Vigente' | 'En revisión' | 'Próximo a vencer' | 'Vencido';
  paginas?: number;
  descripcion: string;
  contenido?: string;
}

const SEED: DocItem[] = [
  // ── Manuales operativos ──
  { _id: 'd1', codigo: 'MAN-001', titulo: 'Manual de cocina y BPM', categoria: 'Cocina', tipo: 'manual', version: 'v3.2', responsable: 'Chef ejecutivo', actualizado: '2026-08-15', estado: 'Vigente', paginas: 48, descripcion: 'Buenas prácticas de manufactura, temperaturas, contaminación cruzada y mise en place.', contenido: '1. Higiene del personal\n2. Temperaturas (refrigeración 0-4°C, congelación -18°C)\n3. Contaminación cruzada: tablas por color\n4. Mise en place por turno\n5. Control de mermas' },
  { _id: 'd2', codigo: 'MAN-002', titulo: 'Manual de servicio a la mesa', categoria: 'Servicio', tipo: 'manual', version: 'v2.8', responsable: 'Jefe de servicio', actualizado: '2026-07-20', estado: 'Vigente', paginas: 36, descripcion: 'Secuencia de servicio, montaje, atención de quejas y ventas sugeridas.', contenido: '1. Bienvenida en <2 min\n2. Secuencia: bebida → entrada → fuerte → postre\n3. Montaje básico y de eventos\n4. Manejo de quejas (escuchar, disculparse, compensar)\n5. Venta sugerida' },
  { _id: 'd3', codigo: 'MAN-003', titulo: 'Manual de barra y coctelería', categoria: 'Barra', tipo: 'manual', version: 'v2.1', responsable: 'Jefe de barra', actualizado: '2026-06-10', estado: 'Vigente', paginas: 28, descripcion: 'Recetario base, dosificación, control de botellas y cierre de barra.', contenido: '1. Dosificación estándar 1.5 oz\n2. 15 cocteles de la casa\n3. Control de mermas de licor\n4. Cierre e inventario diario' },
  { _id: 'd4', codigo: 'MAN-004', titulo: 'Manual de apertura y cierre de caja', categoria: 'Caja', tipo: 'manual', version: 'v4.0', responsable: 'Administración', actualizado: '2026-09-01', estado: 'Vigente', paginas: 18, descripcion: 'Base, arqueos, medios de pago, descuentos autorizados y cierre Z.', contenido: '1. Base de $300.000\n2. Arqueo cada turno\n3. Medios: efectivo, transferencia, mixto\n4. Solo admin autoriza descuentos\n5. Cierre y consignación' },
  { _id: 'd5', codigo: 'MAN-005', titulo: 'Manual de domicilios', categoria: 'Domicilios', tipo: 'manual', version: 'v1.9', responsable: 'Coordinador domicilios', actualizado: '2026-05-12', estado: 'En revisión', paginas: 22, descripcion: 'Toma de pedidos, tiempos, empaque térmico y protocolo con repartidores.', contenido: '1. Tiempo promesa 35-45 min\n2. Empaque térmico y sellado\n3. Doble verificación antes de despachar\n4. Protocolo de novedades' },
  { _id: 'd6', codigo: 'MAN-006', titulo: 'Manual de eventos y BEO', categoria: 'Eventos', tipo: 'manual', version: 'v2.4', responsable: 'Coordinadora eventos', actualizado: '2026-08-28', estado: 'Vigente', paginas: 31, descripcion: 'Cotización, BEO, montaje, minuta de cocina y cierre de evento.', contenido: '1. Cotización a 48h\n2. Anticipo 50% + hitos\n3. BEO firmado 72h antes\n4. Minuta y prueba de montaje' },
  // ── Formatos ──
  { _id: 'd7', codigo: 'FOR-001', titulo: 'Formato de requisición cocina/barra', categoria: 'Inventario', tipo: 'formato', version: 'v2.0', responsable: 'Almacén', actualizado: '2026-08-05', estado: 'Vigente', paginas: 2, descripcion: 'Solicitud de insumos por área con código, cantidad y firma de quien entrega.', contenido: 'Campos: fecha, área, código, producto, cantidad, unidad, solicitado por, entregado por.' },
  { _id: 'd8', codigo: 'FOR-002', titulo: 'Planilla control de temperaturas', categoria: 'Cocina', tipo: 'formato', version: 'v1.5', responsable: 'Chef de turno', actualizado: '2026-07-15', estado: 'Vigente', paginas: 1, descripcion: 'Registro mañana/tarde de neveras, congeladores y baños María.', contenido: 'Nevera 1-3, congelador, baño María. Rango OK / acción correctiva + firma.' },
  { _id: 'd9', codigo: 'FOR-003', titulo: 'Lista de chequeo limpieza y desinfección', categoria: 'Cocina', tipo: 'formato', version: 'v2.3', responsable: 'Jefe de cocina', actualizado: '2026-09-10', estado: 'Vigente', paginas: 2, descripcion: 'Cronograma diario/semanal por zona con producto y responsable.', contenido: 'Zona, frecuencia, producto (cloro 200ppm / amonio), verifica y firma.' },
  { _id: 'd10', codigo: 'FOR-004', titulo: 'Acta de arqueo de caja', categoria: 'Caja', tipo: 'formato', version: 'v3.0', responsable: 'Cajero + admin', actualizado: '2026-08-22', estado: 'Vigente', paginas: 1, descripcion: 'Conteo de billetes, monedas, vouchers y diferencia vs sistema.', contenido: 'Base, ventas sistema, conteo físico, diferencia, firmas.' },
  { _id: 'd11', codigo: 'FOR-005', titulo: 'Formato de quejas y reclamos (PQRS)', categoria: 'Servicio', tipo: 'formato', version: 'v1.2', responsable: 'Servicio al cliente', actualizado: '2026-04-18', estado: 'Próximo a vencer', paginas: 1, descripcion: 'Radicación, tipificación y respuesta en máximo 5 días hábiles.', contenido: 'Fecha, cliente, mesa/pedido, motivo, acción inmediata, responsable, cierre.' },
  { _id: 'd12', codigo: 'FOR-006', titulo: 'Entrega y control de domicilios', categoria: 'Domicilios', tipo: 'formato', version: 'v1.7', responsable: 'Despacho', actualizado: '2026-06-30', estado: 'Vigente', paginas: 1, descripcion: 'Hora pedido, hora despacho, repartidor, tiempo total y novedad.', contenido: 'Pedido, cliente, dirección, repartidor, hora salida/llegada, firma.' },
  // ── Contratos modelo ──
  { _id: 'd13', codigo: 'CON-001', titulo: 'Modelo contrato a término fijo — Mesero', categoria: 'Talento humano', tipo: 'contrato', version: 'v2026', responsable: 'Abogado externo', actualizado: '2026-01-15', estado: 'Vigente', paginas: 6, descripcion: 'Plantilla 6 meses prorrogables, salario + propinas, turno y dominicales.', contenido: 'Cláusulas: objeto, salario $1.423.500 + aux. transporte, jornada, propinas, confidencialidad.' },
  { _id: 'd14', codigo: 'CON-002', titulo: 'Modelo contrato indefinido — Cocinero', categoria: 'Talento humano', tipo: 'contrato', version: 'v2026', responsable: 'Abogado externo', actualizado: '2026-01-15', estado: 'Vigente', paginas: 7, descripcion: 'Indefinido con periodo de prueba de 2 meses y funciones BPM.', contenido: 'Funciones, salario, periodo de prueba, dotación, SST, terminación.' },
  { _id: 'd15', codigo: 'CON-003', titulo: 'Modelo prestación de servicios — Domiciliario', categoria: 'Talento humano', tipo: 'contrato', version: 'v2026', responsable: 'Abogado externo', actualizado: '2026-02-01', estado: 'En revisión', paginas: 5, descripcion: 'OPS por eventos/temporadas con moto propia, SOAT y póliza al día.', contenido: 'Honorarios por turno, autonomía, documentos moto, seguridad vial.' },
  { _id: 'd16', codigo: 'CON-004', titulo: 'Modelo contrato aprendizaje SENA', categoria: 'Talento humano', tipo: 'contrato', version: 'v2026', responsable: 'Abogado externo', actualizado: '2026-02-10', estado: 'Vigente', paginas: 4, descripcion: 'Cuota de aprendices cocina/servicio con apoyo de sostenimiento.', contenido: 'Etapa lectiva/productiva, apoyo 75%-100% SMMLV, ARL.' },
  { _id: 'd17', codigo: 'CON-005', titulo: 'Modelo acuerdo con proveedor de cárnicos', categoria: 'Proveedores', tipo: 'contrato', version: 'v2025', responsable: 'Administración', actualizado: '2025-11-20', estado: 'Próximo a vencer', paginas: 8, descripcion: 'Suministro semanal, fichas técnicas, cadena de frío y crédito 15 días.', contenido: 'Calidades, entregas martes/viernes, devoluciones, precio y pago.' },
  { _id: 'd18', codigo: 'CON-006', titulo: 'Modelo contrato de arrendamiento local', categoria: 'Legal', tipo: 'contrato', version: 'v2024', responsable: 'Abogado externo', actualizado: '2024-12-01', estado: 'Vigente', paginas: 12, descripcion: 'Local Salón 1 y 2, canon con incremento IPC + uso comercial gastronómico.', contenido: 'Canon, incremento, reparaciones, pólizas, restitución.' },
  // ── Políticas y certificados ──
  { _id: 'd19', codigo: 'POL-001', titulo: 'Reglamento interno de trabajo', categoria: 'Legal', tipo: 'politica', version: 'v2025', responsable: 'Gerencia', actualizado: '2025-10-01', estado: 'Vigente', paginas: 24, descripcion: 'Jornadas, permisos, prohibiciones, escala de faltas y procedimiento.', contenido: 'Aprobado y publicado en cartelera + inducción firmada.' },
  { _id: 'd20', codigo: 'POL-002', titulo: 'Política de calidad e inocuidad', categoria: 'Calidad', tipo: 'politica', version: 'v2.0', responsable: 'Gerencia', actualizado: '2026-03-12', estado: 'Vigente', paginas: 5, descripcion: 'Compromiso con BPM, plan de saneamiento y mejora continua.', contenido: 'Objetivos, indicadores (quejas <2%, temperaturas 100%), revisión semestral.' },
  { _id: 'd21', codigo: 'POL-003', titulo: 'Plan de saneamiento básico', categoria: 'Calidad', tipo: 'politica', version: 'v3.0', responsable: 'Chef ejecutivo', actualizado: '2026-08-01', estado: 'Vigente', paginas: 20, descripcion: 'Limpieza, agua potable, residuos, control de plagas (4 programas).', contenido: 'Cronogramas, fichas de productos, empresa plagas certificada.' },
  { _id: 'd22', codigo: 'POL-004', titulo: 'Certificado manipulación de alimentos (plantilla)', categoria: 'Calidad', tipo: 'politica', version: 'v2026', responsable: 'Talento humano', actualizado: '2026-09-05', estado: 'Vigente', paginas: 1, descripcion: 'Control de vencimientos de los 18 certificados del personal de cocina.', contenido: 'Nombre, documento, entidad, vigencia 1 año, alerta 30 días antes.' },
  { _id: 'd23', codigo: 'POL-005', titulo: 'Carpeta legal del establecimiento', categoria: 'Legal', tipo: 'politica', version: 'v2026', responsable: 'Administración', actualizado: '2026-09-12', estado: 'En revisión', paginas: 10, descripcion: 'RUT, Cámara de Comercio, Sayco/Acinpro, Bomberos, uso de suelos.', contenido: 'Checklist con fecha de renovación y responsable por documento.' },
  { _id: 'd24', codigo: 'POL-006', titulo: 'Protocolo de alergenos e información al cliente', categoria: 'Servicio', tipo: 'politica', version: 'v1.4', responsable: 'Chef + servicio', actualizado: '2026-05-25', estado: 'Vigente', paginas: 6, descripcion: 'Matriz de 14 alérgenos por plato de la carta de 15 preparaciones.', contenido: 'Matriz C1..C15 vs gluten, lácteos, huevo, maní, pescado, mariscos, soya.' },
];

const LS_KEY = 'soupe-docs-v1';

@Component({
  selector: 'app-documentacion',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">📚 Documentación</h1>
          <p class="page-subtitle">Manuales, formatos, contratos modelo y carpeta legal del restaurante</p>
        </div>
        <button class="btn-primary" (click)="nuevo()">+ Nuevo documento</button>
      </div>

      <div class="grid-4 mb-3">
        <div class="stat-card"><div class="stat-icon bg-gold">📄</div><div><div class="stat-value">{{ docs.length }}</div><div class="stat-label">Documentos</div></div></div>
        <div class="stat-card"><div class="stat-icon bg-green">✅</div><div><div class="stat-value">{{ porEstado('Vigente') }}</div><div class="stat-label">Vigentes</div></div></div>
        <div class="stat-card"><div class="stat-icon bg-orange">🔎</div><div><div class="stat-value">{{ porEstado('En revisión') }}</div><div class="stat-label">En revisión</div></div></div>
        <div class="stat-card"><div class="stat-icon bg-bronze">⏰</div><div><div class="stat-value">{{ porEstado('Próximo a vencer') + porEstado('Vencido') }}</div><div class="stat-label">Por actualizar</div></div></div>
      </div>

      <div class="tabs-bar">
        <button [class]="tab==='manuales'?'tab active':'tab'" (click)="tab='manuales'">📖 Manuales ({{ conteo('manual') }})</button>
        <button [class]="tab==='formatos'?'tab active':'tab'" (click)="tab='formatos'">🧾 Formatos ({{ conteo('formato') }})</button>
        <button [class]="tab==='contratos'?'tab active':'tab'" (click)="tab='contratos'">✍️ Contratos ({{ conteo('contrato') }})</button>
        <button [class]="tab==='politicas'?'tab active':'tab'" (click)="tab='politicas'">🏛️ Políticas y legal ({{ conteo('politica') }})</button>
      </div>

      <div class="search-bar">
        <input class="form-input" placeholder="🔍 Buscar por título, código o responsable..." [(ngModel)]="search" />
        <select class="form-input" style="max-width:200px" [(ngModel)]="estadoFiltro">
          <option value="">Todos los estados</option>
          <option>Vigente</option>
          <option>En revisión</option>
          <option>Próximo a vencer</option>
          <option>Vencido</option>
        </select>
      </div>

      <!-- Manuales como tarjetas -->
      <div class="doc-grid" *ngIf="tab==='manuales'">
        <div class="neon-card doc-card" *ngFor="let d of filtrados">
          <div class="doc-top"><span class="doc-code">{{ d.codigo }} · {{ d.version }}</span><span class="badge" [ngClass]="badge(d.estado)">{{ d.estado }}</span></div>
          <h3 class="doc-title">{{ d.titulo }}</h3>
          <p class="doc-desc">{{ d.descripcion }}</p>
          <div class="doc-meta">👤 {{ d.responsable }} · 📅 {{ d.actualizado }} · 📄 {{ d.paginas }} pág.</div>
          <div class="doc-actions">
            <button class="btn-secondary btn-sm" (click)="ver(d)">👁️ Ver</button>
            <button class="btn-secondary btn-sm" (click)="descargar(d)">⬇️ Plantilla</button>
            <button class="btn-icon" (click)="editar(d)" title="Editar">✏️</button>
            <button class="btn-icon btn-icon-danger" (click)="eliminar(d)" title="Eliminar">🗑️</button>
          </div>
        </div>
        <div class="empty-state" *ngIf="filtrados.length===0">Sin documentos en esta vista</div>
      </div>

      <!-- Resto como tabla -->
      <div class="card table-card" *ngIf="tab!=='manuales'">
        <div class="empty-state" *ngIf="filtrados.length===0">Sin documentos en esta vista</div>
        <table class="data-table" *ngIf="filtrados.length>0">
          <thead><tr><th>Código</th><th>Título</th><th>Categoría</th><th>Versión</th><th>Responsable</th><th>Actualizado</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            <tr *ngFor="let d of filtrados">
              <td><span class="product-code">{{ d.codigo }}</span></td>
              <td><strong>{{ d.titulo }}</strong><div class="row-sub">{{ d.descripcion }}</div></td>
              <td><span class="badge badge-cyan">{{ d.categoria }}</span></td>
              <td>{{ d.version }}</td>
              <td>{{ d.responsable }}</td>
              <td>{{ d.actualizado }}</td>
              <td><span class="badge" [ngClass]="badge(d.estado)">{{ d.estado }}</span></td>
              <td class="actions">
                <button class="btn-icon" (click)="ver(d)" title="Ver">👁️</button>
                <button class="btn-icon" (click)="descargar(d)" title="Descargar plantilla">⬇️</button>
                <button class="btn-icon" (click)="editar(d)" title="Editar">✏️</button>
                <button class="btn-icon btn-icon-danger" (click)="eliminar(d)" title="Eliminar">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Detalle -->
      <div class="modal-overlay" *ngIf="seleccionado" (click)="seleccionado=null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ seleccionado.codigo }} — {{ seleccionado.titulo }}</h2>
          <p class="modal-sub">{{ seleccionado.categoria }} · {{ seleccionado.version }} · {{ seleccionado.responsable }} · {{ seleccionado.actualizado }}</p>
          <p style="margin:.75rem 0">{{ seleccionado.descripcion }}</p>
          <pre class="preview">{{ seleccionado.contenido || 'Contenido ficticio de demostración.' }}</pre>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="descargar(seleccionado)">⬇️ Descargar plantilla</button>
            <button class="btn-outline" (click)="seleccionado=null">Cerrar</button>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="modal-overlay" *ngIf="showForm" (click)="cerrarForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ editando ? '✏️ Editar documento' : '➕ Nuevo documento' }}</h2>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Código *</label><input class="form-input" [(ngModel)]="form.codigo" placeholder="MAN-007" /></div>
            <div class="form-group"><label class="form-label">Versión</label><input class="form-input" [(ngModel)]="form.version" placeholder="v1.0" /></div>
            <div class="form-group full-width"><label class="form-label">Título *</label><input class="form-input" [(ngModel)]="form.titulo" /></div>
            <div class="form-group"><label class="form-label">Tipo</label><select class="form-input" [(ngModel)]="form.tipo"><option value="manual">Manual</option><option value="formato">Formato</option><option value="contrato">Contrato</option><option value="politica">Política / Legal</option></select></div>
            <div class="form-group"><label class="form-label">Categoría</label><input class="form-input" [(ngModel)]="form.categoria" placeholder="Cocina, Caja..." /></div>
            <div class="form-group"><label class="form-label">Responsable</label><input class="form-input" [(ngModel)]="form.responsable" /></div>
            <div class="form-group"><label class="form-label">Estado</label><select class="form-input" [(ngModel)]="form.estado"><option>Vigente</option><option>En revisión</option><option>Próximo a vencer</option><option>Vencido</option></select></div>
            <div class="form-group full-width"><label class="form-label">Descripción</label><textarea class="form-input" rows="2" [(ngModel)]="form.descripcion"></textarea></div>
            <div class="form-group full-width"><label class="form-label">Contenido / índice</label><textarea class="form-input" rows="4" [(ngModel)]="form.contenido"></textarea></div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="cerrarForm()">Cancelar</button>
            <button class="btn-primary" (click)="guardar()" [disabled]="!form.codigo || !form.titulo">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title { margin:0; font-size:1.5rem; }
    .mb-3 { margin-bottom:1.25rem; }
    .tabs-bar { display:flex; gap:.5rem; margin-bottom:1rem; border-bottom:2px solid rgb(212 175 55 / 10%); padding-bottom:.5rem; flex-wrap:wrap; }
    .tab { padding:.6rem 1.1rem; border:none; background:transparent; color:var(--text-secondary); font-size:.85rem; font-weight:600; border-radius:8px 8px 0 0; cursor:pointer; }
    .tab.active { background:rgb(212 175 55 / 10%); color:var(--brand-gold); border-bottom:3px solid var(--brand-gold); }
    .search-bar { display:flex; gap:.75rem; align-items:center; margin-bottom:1rem; flex-wrap:wrap; }
    .search-bar .form-input:first-child { flex:1; min-width:200px; }
    .doc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; }
    .doc-card { display:flex; flex-direction:column; gap:.5rem; margin:0; }
    .doc-top { display:flex; justify-content:space-between; align-items:center; gap:.5rem; }
    .doc-code { font-family:Outfit,monospace; font-size:.72rem; font-weight:700; letter-spacing:.08em; color:var(--brand-gold); }
    .doc-title { margin:.1rem 0; font-size:1rem; }
    .doc-desc { font-size:.82rem; color:var(--text-secondary); margin:0; flex:1; }
    .doc-meta { font-size:.72rem; color:var(--text-muted); }
    .doc-actions { display:flex; gap:.4rem; align-items:center; flex-wrap:wrap; margin-top:.4rem; }
    .row-sub { font-size:.72rem; color:var(--text-muted); margin-top:.15rem; max-width:340px; }
    .actions { display:flex; gap:.3rem; }
    .preview { background:var(--bg-input); border-radius:8px; padding:.8rem; font-size:.78rem; white-space:pre-wrap; max-height:220px; overflow:auto; margin:.5rem 0 0; }
    .modal-sub { font-size:.78rem; color:var(--brand-gold); margin:.25rem 0 0; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; }
    .full-width { grid-column:1 / -1; }
    .badge-green { background:rgb(0 230 118 / 12%); color:#00C853; }
    .badge-orange { background:rgb(255 145 0 / 12%); color:#E65100; }
    .badge-red { background:rgb(255 23 68 / 12%); color:#D50000; }
    .badge-violet { background:rgb(124 77 255 / 12%); color:#651FFF; }
    @media (max-width:640px){ .form-grid{grid-template-columns:1fr;} .doc-grid{grid-template-columns:1fr;} }
  `]
})
export class DocumentacionComponent implements OnInit {
  docs: DocItem[] = [];
  tab: 'manuales' | 'formatos' | 'contratos' | 'politicas' = 'manuales';
  search = '';
  estadoFiltro = '';
  seleccionado: DocItem | null = null;
  showForm = false;
  editando = false;
  form: DocItem = this.vacio();

  ngOnInit(): void { this.cargar(); }

  vacio(): DocItem {
    return { _id: '', codigo: '', titulo: '', categoria: 'Cocina', tipo: 'manual', version: 'v1.0', responsable: '', actualizado: new Date().toISOString().slice(0, 10), estado: 'Vigente', descripcion: '', contenido: '' };
  }

  cargar(): void {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { this.docs = JSON.parse(raw); return; }
    } catch { /* semilla */ }
    this.docs = SEED;
    this.persistir();
  }

  persistir(): void { try { localStorage.setItem(LS_KEY, JSON.stringify(this.docs)); } catch { /* privado */ } }

  tipoDeTab(): DocItem['tipo'] {
    return this.tab === 'manuales' ? 'manual' : this.tab === 'formatos' ? 'formato' : this.tab === 'contratos' ? 'contrato' : 'politica';
  }

  get filtrados(): DocItem[] {
    const q = this.search.trim().toLowerCase();
    return this.docs
      .filter(d => d.tipo === this.tipoDeTab())
      .filter(d => !this.estadoFiltro || d.estado === this.estadoFiltro)
      .filter(d => !q || (d.titulo + ' ' + d.codigo + ' ' + d.responsable).toLowerCase().includes(q));
  }

  conteo(t: DocItem['tipo']): number { return this.docs.filter(d => d.tipo === t).length; }
  porEstado(e: string): number { return this.docs.filter(d => d.estado === e).length; }

  badge(e: string): string {
    return e === 'Vigente' ? 'badge-green' : e === 'En revisión' ? 'badge-orange' : e === 'Próximo a vencer' ? 'badge-violet' : 'badge-red';
  }

  ver(d: DocItem): void { this.seleccionado = d; }
  nuevo(): void { this.form = this.vacio(); this.form.tipo = this.tipoDeTab(); this.editando = false; this.showForm = true; }
  editar(d: DocItem): void { this.form = { ...d }; this.editando = true; this.showForm = true; }
  cerrarForm(): void { this.showForm = false; }

  guardar(): void {
    if (!this.form.codigo || !this.form.titulo) return;
    if (this.editando) {
      this.docs = this.docs.map(d => (d._id === this.form._id ? { ...this.form } : d));
    } else {
      this.form._id = 'd' + Date.now();
      this.form.actualizado = new Date().toISOString().slice(0, 10);
      this.docs = [...this.docs, { ...this.form }];
    }
    this.persistir();
    this.showForm = false;
  }

  eliminar(d: DocItem): void {
    if (!confirm('¿Eliminar ' + d.codigo + ' — ' + d.titulo + '?')) return;
    this.docs = this.docs.filter(x => x._id !== d._id);
    this.persistir();
  }

  descargar(d: DocItem): void {
    const txt = d.codigo + ' ' + d.titulo + ' (' + d.version + ')\nResponsable: ' + d.responsable + ' · Actualizado: ' + d.actualizado + '\n\n' + d.descripcion + '\n\n' + (d.contenido || '');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = d.codigo + '-' + d.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
}
