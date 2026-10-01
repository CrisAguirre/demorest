// Bandeja local de requisiciones (solo-front).
// Las áreas (cocina/barra/servicio) escriben aquí sus requisiciones confirmadas
// y el menú Compras las lee para gestionarlas. Clave compartida en localStorage.
export interface RequisicionItem {
  codigo: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface Requisicion {
  id: string;
  area: 'cocina' | 'barra' | 'servicio';
  fecha: string; // ISO
  items: RequisicionItem[];
  estado: 'pendiente' | 'atendida' | 'descartada';
}

const KEY = 'requisiciones';
let consec = 0;

export function leerRequisiciones(): Requisicion[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function guardarTodas(reqs: Requisicion[]): void {
  localStorage.setItem(KEY, JSON.stringify(reqs));
}

export function contarPendientes(): number {
  return leerRequisiciones().filter(r => r.estado === 'pendiente').length;
}

export function enviarRequisicion(area: Requisicion['area'], items: RequisicionItem[]): Requisicion {
  const reqs = leerRequisiciones();
  const nueva: Requisicion = {
    id: `req-${Date.now()}-${(consec++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
    area,
    fecha: new Date().toISOString(),
    items,
    estado: 'pendiente'
  };
  reqs.unshift(nueva);
  guardarTodas(reqs);
  return nueva;
}

export function cambiarEstadoRequisicion(id: string, estado: Requisicion['estado']): void {
  guardarTodas(leerRequisiciones().map(r => (r.id === id ? { ...r, estado } : r)));
}

export function eliminarRequisicion(id: string): void {
  guardarTodas(leerRequisiciones().filter(r => r.id !== id));
}

export const AREA_LABEL: Record<Requisicion['area'], string> = {
  cocina: '🍳 Cocina',
  barra: '🍹 Barra',
  servicio: '🍽️ Servicio'
};
