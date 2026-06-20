import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Calculadora from "./pages/Calculadora";
import Facturas from "./pages/Facturas";
import Asociados from "./pages/Asociados";
import Configuracion from "./pages/Configuracion";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="calculadora" element={<Calculadora />} />
          <Route path="facturas" element={<Facturas />} />
          <Route path="asociados" element={<Asociados />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
