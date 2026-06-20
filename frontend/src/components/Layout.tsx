import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/calculadora", label: "Calculadora", icon: "🧮" },
  { to: "/facturas", label: "Facturas", icon: "📄" },
  { to: "/asociados", label: "Asociados", icon: "👥" },
  { to: "/configuracion", label: "Configuración", icon: "⚙️" },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-coop-light">
      <aside className="w-56 bg-coop-darkgreen text-white flex flex-col">
        <div className="px-4 py-5 border-b border-coop-green">
          <p className="text-xs text-green-300 font-medium uppercase tracking-wider">
            Cooperativa
          </p>
          <h1 className="text-base font-bold leading-tight mt-1">
            COOPFANALVELAS
          </h1>
          <p className="text-xs text-green-300 mt-1">Calculadora de Intereses</p>
        </div>
        <nav className="flex-1 py-4">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-coop-green text-white font-semibold"
                    : "text-green-200 hover:bg-coop-green/40"
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 text-xs text-green-400">
          NIT 900.237.749-0
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
