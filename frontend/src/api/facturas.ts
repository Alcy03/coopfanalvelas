import client from "./client";
import type { Factura } from "../types";

export const getFacturas = (params?: {
  asociado_id?: number;
  estado?: string;
  tipo?: string;
}) => client.get<Factura[]>("/facturas", { params }).then((r) => r.data);

export const createFactura = (data: Omit<Factura, "id" | "estado" | "fecha_pago">) =>
  client.post<Factura>("/facturas", data).then((r) => r.data);

export const updateFactura = (id: number, data: Partial<Factura>) =>
  client.put<Factura>(`/facturas/${id}`, data).then((r) => r.data);

export const marcarPagada = (id: number) =>
  client.patch<Factura>(`/facturas/${id}/pagar`).then((r) => r.data);
