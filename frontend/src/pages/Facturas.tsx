import { useEffect, useState } from "react";
import { createFactura, getFacturas, marcarPagada } from "../api/facturas";
import { getAsociados } from "../api/asociados";
import type { Asociado, Factura } from "../types";

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    asociado_id: 0,
    numero_factura: "",
    descripcion: "",
    valor_capital: "",
    fecha_emision: new Date().toISOString().split("T")[0],
    tipo: "parafina_moldeo" as "parafina_moldeo" | "productos",
    notas: "",
  });

  const cargar = () =>
    getFacturas({ estado: filtroEstado || undefined }).then(setFacturas);

  useEffect(() => {
    cargar();
    getAsociados().then(setAsociados);
  }, [filtroEstado]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFactura({
      ...form,
      asociado_id: Number(form.asociado_id),
      valor_capital: Number(form.valor_capital),
    });
    setMostrarForm(false);
    cargar();
  };

  const pagar = async (id: number) => {
    if (!confirm("¿Marcar esta factura como pagada?")) return;
    await marcarPagada(id);
    cargar();
  };

  const labelTipo = (tipo: string) =>
    tipo === "parafina_moldeo" ? "Parafina/Moldeo" : "Productos";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-coop-darkgreen">Facturas</h2>
        <div className="flex gap-3">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="pendiente">Pendientes</option>
            <option value="pagada">Pagadas</option>
            <option value="">Todas</option>
          </select>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-coop-green text-white px-4 py-2 rounded-lg hover:bg-coop-darkgreen text-sm"
          >
            + Nueva Factura
          </button>
        </div>
      </div>

      {mostrarForm && (
        <form onSubmit={guardar} className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-coop-darkgreen mb-4">Nueva Factura</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asociado *</label>
              <select
                required
                value={form.asociado_id}
                onChange={(e) => setForm({ ...form, asociado_id: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>Seleccionar...</option>
                {asociados.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Factura *</label>
              <input
                required
                value={form.numero_factura}
                onChange={(e) => setForm({ ...form, numero_factura: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as "parafina_moldeo" | "productos" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="parafina_moldeo">Parafina / Moldeo</option>
                <option value="productos">Productos Cooperativa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Capital *</label>
              <input
                required
                type="number"
                min="1"
                value={form.valor_capital}
                onChange={(e) => setForm({ ...form, valor_capital: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión *</label>
              <input
                required
                type="date"
                value={form.fecha_emision}
                onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="bg-coop-green text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            <button type="button" onClick={() => setMostrarForm(false)} className="border px-4 py-2 rounded-lg text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-coop-darkgreen text-white">
            <tr>
              <th className="text-left px-4 py-3">N° Factura</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Valor</th>
              <th className="text-left px-4 py-3">Emisión</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {facturas.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin facturas</td></tr>
            )}
            {facturas.map((f, i) => (
              <tr key={f.id} className={i % 2 === 0 ? "bg-white" : "bg-coop-light"}>
                <td className="px-4 py-3 font-medium">{f.numero_factura}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    f.tipo === "parafina_moldeo"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {labelTipo(f.tipo)}
                  </span>
                </td>
                <td className="px-4 py-3">{cop(f.valor_capital)}</td>
                <td className="px-4 py-3 text-gray-600">{f.fecha_emision}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    f.estado === "pendiente"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {f.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {f.estado === "pendiente" && (
                    <button
                      onClick={() => pagar(f.id)}
                      className="text-coop-green hover:text-coop-darkgreen text-xs font-medium"
                    >
                      Marcar pagada
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
