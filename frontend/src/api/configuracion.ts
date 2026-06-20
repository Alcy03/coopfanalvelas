import client from "./client";
import type { Configuracion } from "../types";

export const getConfiguracion = () =>
  client.get<Configuracion>("/configuracion").then((r) => r.data);

export const updateConfiguracion = (data: Partial<Configuracion>) =>
  client.put<Configuracion>("/configuracion", data).then((r) => r.data);
