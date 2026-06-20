import { useEffect, useState } from "react";
import { calcular } from "../api/calculadora";
import { getAsociados } from "../api/asociados";
import type { Asociado, CalculadoraResult } from "../types";

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const labelTipo = (tipo: string) =>
  tipo === "parafina_moldeo" ? "Parafina/Moldeo" : "Productos";

export default function Calculadora() {
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [asociadoId, setAsociadoId] = useState<number>(0);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [resultado, setResultado] = useState<CalculadoraResult | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => { getAsociados().then(setAsociados); }, []);

  const calcularIntereses = async () => {
    if (!asociadoId) return;
    setCargando(true);
    try {
      const data = await calcular(asociadoId, fecha);
      setResultado(data);
    } finally {
      setCargando(false);
    }
  };

  const imprimir = () => window.print();

  return (
    <div>
      <h2 className="text-2xl font-bold text-coop-darkgreen mb-6">Calculadora de Intereses</h2>

      {/* Controles */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asociado</label>
            <select
              value={asociadoId}
              onChange={(e) => setAsociadoId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coop-green"
            >
              <option value={0}>Seleccionar asociado...</option>
              {asociados.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre} — {a.cedula_nit}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de corte</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coop-green"
            />
          </div>
          <button
            onClick={calcularIntereses}
            disabled={!asociadoId || cargando}
            className="bg-coop-green text-white px-6 py-2 rounded-lg hover:bg-coop-darkgreen disabled:opacity-50 transition-colors font-medium"
          >
            {cargando ? "Calculando..." : "Calcular"}
          </button>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="print:shadow-none">
          {/* Header resultado */}
          <div className="bg-coop-darkgreen text-white rounded-t-xl px-5 py-4 flex justify-between items-center">
            <div>
              <p className="text-green-300 text-xs font-medium uppercase tracking-wider">Estado de cuenta</p>
              <h3 className="text-lg font-bold">{resultado.asociado_nombre}</h3>
              <p className="text-green-300 text-sm">Fecha de corte: {resultado.fecha_calculo}</p>
            </div>
            <button
              onClick={imprimir}
              className="bg-coop-yellow text-coop-darkgreen px-4 py-2 rounded-lg text-sm font-semibold hover:bg-coop-darkyellow print:hidden"
            >
              Imprimir
            </button>
          </div>

          {/* Tabla de facturas */}
          {resultado.facturas.length === 0 ? (
            <div className="bg-white rounded-b-xl p-8 text-center text-gray-400 border border-gray-100">
              Este asociado no tiene facturas pendientes.
            </div>
          ) : (
            <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Factura</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Días</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Capital</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Int. Corriente</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Int. Mora</th>
                    <th className="text-right px-4 py-3 font-semibold text-coop-darkgreen">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.facturas.map((f, i) => (
                    <tr key={f.id} className={i % 2 === 0 ? "bg-white" : "bg-coop-light"}>
                      <td className="px-4 py-3 font-medium">{f.numero_factura}</td>
                      <td className="px-4 py-3 text-gray-600">{labelTipo(f.tipo)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{f.dias_transcurridos}</td>
                      <td className="px-4 py-3 text-right">{cop(f.valor_capital)}</td>
                      <td className="px-4 py-3 text-right text-blue-700">
                        {f.interes_corriente > 0 ? cop(f.interes_corriente) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {f.interes_mora > 0 ? cop(f.interes_mora) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-coop-darkgreen">
                        {cop(f.total_a_cobrar)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Fila de totales */}
                <tfoot>
                  <tr className="bg-coop-darkgreen text-white font-semibold">
                    <td colSpan={3} className="px-4 py-3">TOTAL A COBRAR</td>
                    <td className="px-4 py-3 text-right">{cop(resultado.resumen.total_capital)}</td>
                    <td className="px-4 py-3 text-right">{cop(resultado.resumen.total_corriente)}</td>
                    <td className="px-4 py-3 text-right">{cop(resultado.resumen.total_mora)}</td>
                    <td className="px-4 py-3 text-right text-coop-yellow text-lg">
                      {cop(resultado.resumen.gran_total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
