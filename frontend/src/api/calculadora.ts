import client from "./client";
import type { CalculadoraResult, Dashboard } from "../types";

export const calcular = (asociadoId: number, fecha?: string) =>
  client
    .get<CalculadoraResult>(`/calculadora/${asociadoId}`, {
      params: fecha ? { fecha } : {},
    })
    .then((r) => r.data);

export const getDashboard = () =>
  client.get<Dashboard>("/dashboard").then((r) => r.data);
