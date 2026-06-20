import { useEffect, useState } from "react";
import { getConfiguracion, updateConfiguracion } from "../api/configuracion";
import type { Configuracion } from "../types";

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [form, setForm] = useState({
    tasa_corriente_mensual: "",
    tasa_mora_mensual: "",
    fecha_inicio_corriente: "",
  });
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    getConfiguracion().then((c) => {
      setConfig(c);
      setForm({
        tasa_corriente_mensual: (c.tasa_corriente_mensual * 100).toFixed(2),
        tasa_mora_mensual: (c.tasa_mora_mensual * 100).toFixed(2),
        fecha_inicio_corriente: c.fecha_inicio_corriente,
      });
    });
  }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfiguracion({
      tasa_corriente_mensual: Number(form.tasa_corriente_mensual) / 100,
      tasa_mora_mensual: Number(form.tasa_mora_mensual) / 100,
      fecha_inicio_corriente: form.fecha_inicio_corriente,
    });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  if (!config) return <div className="text-gray-400 py-8 text-center">Cargando...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-coop-darkgreen mb-6">Configuración de Tasas</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-lg">
        <p className="text-sm text-gray-500 mb-5">
          Actualiza las tasas cuando Banrepública cambie la tasa de usura (trimestral).
          Los cambios aplican a todos los cálculos futuros.
        </p>
        <form onSubmit={guardar} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasa Corriente Mensual (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.tasa_corriente_mensual}
              onChange={(e) => setForm({ ...form, tasa_corriente_mensual: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coop-green"
            />
            <p className="text-xs text-gray-400 mt-1">
              Actualmente: {(config.tasa_corriente_mensual * 100).toFixed(2)}% — Reglamento: 1.4%
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasa Mora Mensual (%) — Banrepública
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.tasa_mora_mensual}
              onChange={(e) => setForm({ ...form, tasa_mora_mensual: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coop-green"
            />
            <p className="text-xs text-gray-400 mt-1">
              Actualmente: {(config.tasa_mora_mensual * 100).toFixed(2)}% — Verificar en banrep.gov.co
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha inicio cobro interés corriente
            </label>
            <input
              type="date"
              value={form.fecha_inicio_corriente}
              onChange={(e) => setForm({ ...form, fecha_inicio_corriente: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coop-green"
            />
          </div>
          <button
            type="submit"
            className="bg-coop-green text-white px-6 py-2 rounded-lg hover:bg-coop-darkgreen transition-colors font-medium"
          >
            Guardar Configuración
          </button>
          {guardado && (
            <p className="text-coop-green text-sm font-medium">✓ Configuración guardada</p>
          )}
        </form>
      </div>
    </div>
  );
}
