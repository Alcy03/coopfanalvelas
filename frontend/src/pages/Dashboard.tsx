import { useEffect, useState } from "react";
import { getDashboard } from "../api/calculadora";
import type { Dashboard } from "../types";

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => { getDashboard().then(setData); }, []);

  if (!data) return <div className="text-gray-400 py-8 text-center">Cargando...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-coop-darkgreen mb-6">
        Resumen del Día — {new Date().toLocaleDateString("es-CO", { dateStyle: "long" })}
      </h2>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Capital Pendiente Total</p>
          <p className="text-3xl font-bold text-coop-darkgreen">{cop(data.total_capital_pendiente)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Intereses Acumulados Hoy</p>
          <p className="text-3xl font-bold text-blue-700">{cop(data.total_intereses_hoy)}</p>
        </div>
        <div className={`rounded-xl p-5 shadow-sm border ${
          data.facturas_vencidas > 0
            ? "bg-red-50 border-red-200"
            : "bg-white border-gray-100"
        }`}>
          <p className="text-sm text-gray-500 mb-1">Facturas Vencidas</p>
          <p className={`text-3xl font-bold ${
            data.facturas_vencidas > 0 ? "text-red-600" : "text-gray-400"
          }`}>
            {data.facturas_vencidas}
          </p>
        </div>
      </div>

      {/* Próximas a vencer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-coop-darkgreen">Próximas a vencer (5 días)</h3>
        </div>
        {data.facturas_por_vencer.length === 0 ? (
          <p className="text-center py-6 text-gray-400 text-sm">Sin facturas próximas a vencer</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">N° Factura</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Valor</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Emisión</th>
              </tr>
            </thead>
            <tbody>
              {data.facturas_por_vencer.map((f, i) => (
                <tr key={f.id} className={i % 2 === 0 ? "bg-white" : "bg-coop-light"}>
                  <td className="px-4 py-3 font-medium">{f.numero_factura}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {f.tipo === "parafina_moldeo" ? "Parafina/Moldeo" : "Productos"}
                  </td>
                  <td className="px-4 py-3 text-right">{cop(f.valor_capital)}</td>
                  <td className="px-4 py-3 text-gray-600">{f.fecha_emision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
