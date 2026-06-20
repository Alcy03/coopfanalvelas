import { useEffect, useState } from "react";
import { createAsociado, deactivateAsociado, getAsociados } from "../api/asociados";
import type { Asociado } from "../types";

export default function Asociados() {
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [form, setForm] = useState({ nombre: "", cedula_nit: "", telefono: "" });
  const [error, setError] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = () => getAsociados().then(setAsociados);

  useEffect(() => { cargar(); }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createAsociado(form);
      setForm({ nombre: "", cedula_nit: "", telefono: "" });
      setMostrarForm(false);
      cargar();
    } catch {
      setError("Error: la cédula/NIT ya está registrada.");
    }
  };

  const desactivar = async (id: number) => {
    if (!confirm("¿Desactivar este asociado?")) return;
    await deactivateAsociado(id);
    cargar();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-coop-darkgreen">Asociados</h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-coop-green text-white px-4 py-2 rounded-lg hover:bg-coop-darkgreen transition-colors"
        >
          + Nuevo Asociado
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={guardar} className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-coop-darkgreen mb-4">Nuevo Asociado</h3>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coop-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cédula / NIT *</label>
              <input
                required
                value={form.cedula_nit}
                onChange={(e) => setForm({ ...form, cedula_nit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coop-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coop-green"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="bg-coop-green text-white px-4 py-2 rounded-lg text-sm hover:bg-coop-darkgreen">
              Guardar
            </button>
            <button type="button" onClick={() => setMostrarForm(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-coop-darkgreen text-white">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Cédula / NIT</th>
              <th className="text-left px-4 py-3">Teléfono</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {asociados.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">
                  No hay asociados registrados
                </td>
              </tr>
            )}
            {asociados.map((a, i) => (
              <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-coop-light"}>
                <td className="px-4 py-3 font-medium">{a.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{a.cedula_nit}</td>
                <td className="px-4 py-3 text-gray-600">{a.telefono || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => desactivar(a.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
