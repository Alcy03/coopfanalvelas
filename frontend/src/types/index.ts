export interface Asociado {
  id: number;
  nombre: string;
  cedula_nit: string;
  telefono?: string;
  activo: boolean;
}

export interface Factura {
  id: number;
  asociado_id: number;
  numero_factura: string;
  descripcion?: string;
  valor_capital: number;
  fecha_emision: string;
  tipo: "parafina_moldeo" | "productos";
  estado: "pendiente" | "pagada";
  fecha_pago?: string;
  notas?: string;
}

export interface FacturaCalculo {
  id: number;
  numero_factura: string;
  descripcion?: string;
  tipo: string;
  valor_capital: number;
  fecha_emision: string;
  dias_transcurridos: number;
  interes_corriente: number;
  interes_mora: number;
  total_a_cobrar: number;
  estado: string;
}

export interface ResumenCalculo {
  total_capital: number;
  total_corriente: number;
  total_mora: number;
  gran_total: number;
}

export interface CalculadoraResult {
  asociado_id: number;
  asociado_nombre: string;
  fecha_calculo: string;
  facturas: FacturaCalculo[];
  resumen: ResumenCalculo;
}

export interface Configuracion {
  id: number;
  tasa_corriente_mensual: number;
  tasa_mora_mensual: number;
  fecha_inicio_corriente: string;
  dias_gracia_corriente: number;
  dias_habiles_gracia_mora: number;
}

export interface Dashboard {
  total_capital_pendiente: number;
  total_intereses_hoy: number;
  facturas_vencidas: number;
  facturas_por_vencer: Factura[];
}
