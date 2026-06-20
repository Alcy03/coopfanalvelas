import client from "./client";
import type { Asociado } from "../types";

export const getAsociados = () =>
  client.get<Asociado[]>("/asociados").then((r) => r.data);

export const createAsociado = (data: Omit<Asociado, "id" | "activo">) =>
  client.post<Asociado>("/asociados", data).then((r) => r.data);

export const updateAsociado = (id: number, data: Partial<Asociado>) =>
  client.put<Asociado>(`/asociados/${id}`, data).then((r) => r.data);

export const deactivateAsociado = (id: number) =>
  client.delete(`/asociados/${id}`);
