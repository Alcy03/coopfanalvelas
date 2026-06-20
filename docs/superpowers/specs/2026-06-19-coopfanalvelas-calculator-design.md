# Diseño: Calculadora de Intereses COOPFANALVELAS

**Fecha:** 2026-06-19  
**Proyecto:** Calculadora de Intereses Corrientes y de Mora  
**Cliente:** Cooperativa Multiactiva Nacional de Fabricantes de Velas y Velones — COOPFANALVELAS (NIT 900.237.749-0)

---

## 1. Contexto y Problema

El sistema contable WordOffice que usa COOPFANALVELAS no calcula intereses sobre facturas. A partir del 1 de julio de 2026, la cooperativa comenzará a cobrar intereses corrientes sobre facturas de parafina y moldeo. Se necesita una herramienta que permita calcular exactamente cuánto debe cobrarle a un asociado en cualquier fecha dada, mostrando el desglose de capital, interés corriente e interés de mora.

### Reglamento vigente (aprobado 10 de junio de 2026)

- **Parafina y moldeo:** plazo de pago 15 días calendario.  
- **Productos cooperativa:** plazo 3 días hábiles desde recepción de factura electrónica.  
- **Interés corriente:** 1.4% efectivo mensual, se liquida a partir del día 16 para facturas de parafina/moldeo. Aplica desde el 1 de julio de 2026. Se calcula día a día y se cobra al cancelar.  
- **Interés de mora:** continúa vigente e independiente. Aplica desde el día 4 en facturas de productos. Tasa autorizada por Banrepública sin superar el límite de usura.  
- Ambos intereses son independientes y pueden coexistir en la misma factura si está vencida y no pagada.

---

## 2. Arquitectura

### Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI (Python) + SQLAlchemy |
| Base de datos | SQLite (archivo local en el servidor) |
| Frontend | React + Vite + Tailwind CSS |
| Despliegue | Render — **un solo servicio** |
| Colores | Paleta verde cooperativa (#00763a, #0b592a, #fcc420) |

### Un solo servicio en Render

FastAPI sirve la API en `/api/*` y también sirve el build estático de React para todas las demás rutas. No hay dos URLs ni dos servicios separados. El usuario accede a una sola URL.

```
Render (1 servicio)
├── FastAPI
│   ├── GET/POST /api/asociados
│   ├── GET/POST /api/facturas
│   ├── GET      /api/intereses/{factura_id}?fecha=YYYY-MM-DD
│   ├── GET      /api/calculadora/{asociado_id}?fecha=YYYY-MM-DD
│   ├── GET/PUT  /api/configuracion
│   └── /*       → sirve frontend/dist/index.html
└── SQLite → coopfanalvelas.db
```

### Estructura de carpetas

```
coopfanalvelas/
├── backend/
│   ├── main.py           ← FastAPI app + monta frontend
│   ├── database.py       ← conexión SQLite
│   ├── models.py         ← tablas ORM
│   ├── schemas.py        ← Pydantic schemas
│   ├── routes/
│   │   ├── asociados.py
│   │   ├── facturas.py
│   │   ├── intereses.py
│   │   └── configuracion.py
│   ├── services/
│   │   └── calculadora.py  ← lógica de intereses
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Asociados.tsx
│   │   │   ├── Facturas.tsx
│   │   │   ├── Calculadora.tsx
│   │   │   └── Configuracion.tsx
│   │   ├── components/
│   │   ├── api/
│   │   └── App.tsx
│   └── package.json
├── build.sh              ← build React + instala Python deps
└── render.yaml           ← configuración de Render
```

---

## 3. Modelo de Datos

### Tabla: `asociados`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | Auto-incremental |
| nombre | TEXT NOT NULL | Nombre completo del asociado |
| cedula_nit | TEXT UNIQUE | Cédula o NIT |
| telefono | TEXT | Teléfono de contacto (opcional) |
| activo | BOOLEAN | Default: true |

### Tabla: `facturas`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | Auto-incremental |
| asociado_id | INTEGER FK | Referencia a asociados |
| numero_factura | TEXT | Número de la factura electrónica |
| descripcion | TEXT | Descripción del producto/servicio |
| valor_capital | REAL NOT NULL | Valor de la factura en pesos |
| fecha_emision | DATE NOT NULL | Fecha de emisión de la factura |
| tipo | TEXT | `parafina_moldeo` \| `productos` |
| estado | TEXT | `pendiente` \| `pagada` (default: pendiente) |
| fecha_pago | DATE | Fecha en que fue cancelada (nullable) |
| notas | TEXT | Observaciones adicionales |

### Tabla: `configuracion`

Una sola fila, editable desde la app.

| Campo | Tipo | Default |
|-------|------|---------|
| id | INTEGER PK | 1 |
| tasa_corriente_mensual | REAL | 0.014 (1.4%) |
| tasa_mora_mensual | REAL | Ingresada manualmente por el usuario (tasa Banrepública vigente — cambia trimestralmente) |
| fecha_inicio_corriente | DATE | 2026-07-01 |
| dias_gracia_corriente | INTEGER | 15 |
| dias_habiles_gracia_mora | INTEGER | 3 (lunes a viernes, sin festivos) |

---

## 4. Lógica de Cálculo de Intereses

Toda la lógica vive en `backend/services/calculadora.py`.

### Interés Corriente (parafina_moldeo)

```
Solo aplica si fecha_calculo >= 2026-07-01

dias_transcurridos = (fecha_calculo - fecha_emision).days
si tipo == parafina_moldeo:
    si dias_transcurridos <= 15:
        interes_corriente = 0
    sino:
        dias_con_interes = dias_transcurridos - 15
        tasa_diaria = tasa_corriente_mensual / 30
        interes_corriente = valor_capital * tasa_diaria * dias_con_interes
```

### Interés de Mora

```
si tipo == productos:
    dia_vencimiento = fecha_emision + 3 días hábiles
    si fecha_calculo <= dia_vencimiento:
        interes_mora = 0
    sino:
        dias_mora = (fecha_calculo - dia_vencimiento).days
        tasa_diaria_mora = tasa_mora_mensual / 30
        interes_mora = valor_capital * tasa_diaria_mora * dias_mora

si tipo == parafina_moldeo y dias_transcurridos > 15:
    # también aplica mora por estar vencida
    dias_mora = dias_transcurridos - 15
    tasa_diaria_mora = tasa_mora_mensual / 30
    interes_mora = valor_capital * tasa_diaria_mora * dias_mora
```

### Respuesta del endpoint calculadora

```json
{
  "asociado": "Juan Pérez",
  "fecha_calculo": "2026-07-20",
  "facturas": [
    {
      "numero_factura": "FE-001",
      "tipo": "parafina_moldeo",
      "valor_capital": 500000,
      "dias_transcurridos": 35,
      "interes_corriente": 9333,
      "interes_mora": 0,
      "total_a_cobrar": 509333
    }
  ],
  "resumen": {
    "total_capital": 500000,
    "total_corriente": 9333,
    "total_mora": 0,
    "gran_total": 509333
  }
}
```

---

## 5. Pantallas (Frontend)

### 1. Dashboard
- Tarjetas resumen: total capital pendiente, total intereses acumulados hoy, cantidad de facturas vencidas.
- Lista de facturas próximas a vencer (próximos 5 días).

### 2. Asociados
- Tabla con todos los asociados activos.
- Botón para crear nuevo asociado (nombre, cédula/NIT, teléfono).
- Editar / desactivar asociado.

### 3. Facturas
- Tabla con filtros por estado (pendiente/pagada), tipo y asociado.
- Formulario para registrar nueva factura: asociado, número, valor, fecha de emisión, tipo.
- Marcar factura como pagada.

### 4. Calculadora *(pantalla de uso diario)*
- Selector de asociado → muestra sus facturas pendientes.
- Campo de fecha (default: hoy) → recalcula al cambiar.
- Tabla con desglose por factura: capital / interés corriente / interés mora / total.
- Fila de totales resaltada en verde.
- Botón "Imprimir / Guardar PDF" del desglose.

### 5. Configuración
- Editar tasa corriente mensual (default 1.4%).
- Editar tasa mora mensual (actualizar cuando Banrepública cambie la tasa).
- Fecha inicio cobro interés corriente (2026-07-01).

---

## 6. Despliegue en Render

- **Build command:** `cd frontend && npm install && npm run build && cd .. && pip install -r backend/requirements.txt`
- **Start command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Plan:** Free (suficiente para el volumen de la cooperativa)
- **Nota:** El plan gratuito duerme tras 15 min de inactividad — primera carga puede tardar ~30 segundos. Aceptable para uso interno.

---

## 7. Fuera de Alcance (MVP)

- Historial de pagos parciales (pagos abonos).
- Notificaciones automáticas por correo/WhatsApp.
- Integración directa con WordOffice.
- Roles y autenticación de usuarios (la URL es interna, sin login en MVP).
