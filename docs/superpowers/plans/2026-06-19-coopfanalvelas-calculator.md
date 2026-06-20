# COOPFANALVELAS — Calculadora de Intereses: Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una aplicación web (FastAPI + React) que calcule intereses corrientes y de mora sobre facturas de COOPFANALVELAS, desplegada en Render como un único servicio.

**Architecture:** FastAPI sirve la API en `/api/*` y monta el build estático de React en `/`. SQLite almacena asociados, facturas y configuración. Toda la lógica de cálculo de intereses vive en `backend/services/calculadora.py` (función pura, sin dependencia de BD para facilitar el testing).

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2, SQLite, pytest, httpx; React 18 + Vite + TypeScript + Tailwind CSS; Render free tier.

**Directorio raíz:** `C:\Users\Acer\Desktop\COOPFANALVELAS\`

---

## Estructura de Archivos

```
COOPFANALVELAS/
├── backend/
│   ├── main.py                   ← FastAPI app + monta /frontend/dist
│   ├── database.py               ← engine, session, Base, get_db
│   ├── models.py                 ← Asociado, Factura, Configuracion ORM
│   ├── schemas.py                ← Pydantic schemas (request + response)
│   ├── routes/
│   │   ├── asociados.py          ← CRUD /api/asociados
│   │   ├── facturas.py           ← CRUD /api/facturas
│   │   ├── intereses.py          ← GET /api/calculadora/{asociado_id} + resumen
│   │   └── configuracion.py      ← GET + PUT /api/configuracion
│   └── services/
│       └── calculadora.py        ← lógica pura de intereses (sin BD)
├── tests/
│   ├── conftest.py               ← cliente de prueba con DB en memoria
│   ├── test_calculadora.py       ← TDD: unit tests del servicio de intereses
│   ├── test_asociados.py         ← API tests rutas asociados
│   ├── test_facturas.py          ← API tests rutas facturas
│   └── test_intereses.py         ← API tests ruta calculadora
├── frontend/
│   ├── src/
│   │   ├── types/index.ts        ← interfaces TypeScript
│   │   ├── api/
│   │   │   ├── client.ts         ← instancia axios
│   │   │   ├── asociados.ts
│   │   │   ├── facturas.ts
│   │   │   ├── calculadora.ts
│   │   │   └── configuracion.ts
│   │   ├── components/
│   │   │   └── Layout.tsx        ← sidebar + nav
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Asociados.tsx
│   │   │   ├── Facturas.tsx
│   │   │   ├── Calculadora.tsx   ← pantalla de uso diario
│   │   │   └── Configuracion.tsx
│   │   ├── App.tsx               ← React Router rutas
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── requirements.txt
├── build.sh
├── render.yaml
└── .gitignore
```

---

## Task 1: Setup del Proyecto

**Files:**
- Create: `requirements.txt`
- Create: `.gitignore`
- Create: `build.sh`
- Create: `render.yaml`

- [ ] **Step 1: Inicializar git y crear estructura de carpetas**

```bash
cd C:\Users\Acer\Desktop\COOPFANALVELAS
git init
mkdir -p backend/routes backend/services tests frontend/src
```

- [ ] **Step 2: Crear requirements.txt**

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.30
pydantic==2.7.1
pytest==8.2.0
httpx==0.27.0
python-dateutil==2.9.0
```

- [ ] **Step 3: Crear .gitignore**

```
__pycache__/
*.pyc
*.db
.env
node_modules/
frontend/dist/
.venv/
venv/
```

- [ ] **Step 4: Crear build.sh**

```bash
#!/bin/bash
set -e
echo "==> Installing Python dependencies"
pip install -r requirements.txt

echo "==> Building React frontend"
cd frontend
npm install
npm run build
cd ..

echo "==> Build complete"
```

- [ ] **Step 5: Crear render.yaml**

```yaml
services:
  - type: web
    name: coopfanalvelas
    env: python
    buildCommand: "bash build.sh"
    startCommand: "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: project scaffold and deployment config"
```

---

## Task 2: Backend — Base de Datos y Modelos

**Files:**
- Create: `backend/database.py`
- Create: `backend/models.py`
- Create: `backend/__init__.py`
- Create: `backend/routes/__init__.py`
- Create: `backend/services/__init__.py`

- [ ] **Step 1: Crear backend/__init__.py, backend/routes/__init__.py, backend/services/__init__.py** (archivos vacíos)

```bash
touch backend/__init__.py backend/routes/__init__.py backend/services/__init__.py tests/__init__.py
```

- [ ] **Step 2: Crear backend/database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./coopfanalvelas.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 3: Crear backend/models.py**

```python
from datetime import date
from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base


class Asociado(Base):
    __tablename__ = "asociados"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    cedula_nit = Column(String, unique=True, index=True)
    telefono = Column(String, nullable=True)
    activo = Column(Boolean, default=True)

    facturas = relationship("Factura", back_populates="asociado")


class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    asociado_id = Column(Integer, ForeignKey("asociados.id"), nullable=False)
    numero_factura = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    valor_capital = Column(Float, nullable=False)
    fecha_emision = Column(Date, nullable=False)
    # parafina_moldeo | productos
    tipo = Column(String, nullable=False)
    # pendiente | pagada
    estado = Column(String, default="pendiente")
    fecha_pago = Column(Date, nullable=True)
    notas = Column(Text, nullable=True)

    asociado = relationship("Asociado", back_populates="facturas")


class Configuracion(Base):
    __tablename__ = "configuracion"

    id = Column(Integer, primary_key=True, default=1)
    tasa_corriente_mensual = Column(Float, default=0.014)
    tasa_mora_mensual = Column(Float, default=0.022)
    fecha_inicio_corriente = Column(Date, default=date(2026, 7, 1))
    dias_gracia_corriente = Column(Integer, default=15)
    dias_habiles_gracia_mora = Column(Integer, default=3)
```

- [ ] **Step 4: Commit**

```bash
git add backend/
git commit -m "feat: database connection and ORM models"
```

---

## Task 3: Schemas Pydantic

**Files:**
- Create: `backend/schemas.py`

- [ ] **Step 1: Crear backend/schemas.py**

```python
from datetime import date
from typing import Optional
from pydantic import BaseModel


# ── Asociado ──────────────────────────────────────────────
class AsociadoCreate(BaseModel):
    nombre: str
    cedula_nit: str
    telefono: Optional[str] = None


class AsociadoUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None


class AsociadoOut(BaseModel):
    id: int
    nombre: str
    cedula_nit: str
    telefono: Optional[str]
    activo: bool

    model_config = {"from_attributes": True}


# ── Factura ───────────────────────────────────────────────
class FacturaCreate(BaseModel):
    asociado_id: int
    numero_factura: str
    descripcion: Optional[str] = None
    valor_capital: float
    fecha_emision: date
    tipo: str  # parafina_moldeo | productos
    notas: Optional[str] = None


class FacturaUpdate(BaseModel):
    numero_factura: Optional[str] = None
    descripcion: Optional[str] = None
    valor_capital: Optional[float] = None
    notas: Optional[str] = None


class FacturaOut(BaseModel):
    id: int
    asociado_id: int
    numero_factura: str
    descripcion: Optional[str]
    valor_capital: float
    fecha_emision: date
    tipo: str
    estado: str
    fecha_pago: Optional[date]
    notas: Optional[str]

    model_config = {"from_attributes": True}


# ── Configuracion ─────────────────────────────────────────
class ConfiguracionUpdate(BaseModel):
    tasa_corriente_mensual: Optional[float] = None
    tasa_mora_mensual: Optional[float] = None
    fecha_inicio_corriente: Optional[date] = None
    dias_gracia_corriente: Optional[int] = None
    dias_habiles_gracia_mora: Optional[int] = None


class ConfiguracionOut(BaseModel):
    id: int
    tasa_corriente_mensual: float
    tasa_mora_mensual: float
    fecha_inicio_corriente: date
    dias_gracia_corriente: int
    dias_habiles_gracia_mora: int

    model_config = {"from_attributes": True}


# ── Calculadora ───────────────────────────────────────────
class FacturaCalculo(BaseModel):
    id: int
    numero_factura: str
    descripcion: Optional[str]
    tipo: str
    valor_capital: float
    fecha_emision: date
    dias_transcurridos: int
    interes_corriente: float
    interes_mora: float
    total_a_cobrar: float
    estado: str


class ResumenCalculo(BaseModel):
    total_capital: float
    total_corriente: float
    total_mora: float
    gran_total: float


class CalculadoraOut(BaseModel):
    asociado_id: int
    asociado_nombre: str
    fecha_calculo: date
    facturas: list[FacturaCalculo]
    resumen: ResumenCalculo


class DashboardOut(BaseModel):
    total_capital_pendiente: float
    total_intereses_hoy: float
    facturas_vencidas: int
    facturas_por_vencer: list[FacturaOut]
```

- [ ] **Step 2: Commit**

```bash
git add backend/schemas.py
git commit -m "feat: pydantic schemas for all endpoints"
```

---

## Task 4: Servicio Calculadora (TDD — Lógica Central)

**Files:**
- Create: `tests/conftest.py`
- Create: `tests/test_calculadora.py`
- Create: `backend/services/calculadora.py`

- [ ] **Step 1: Instalar dependencias en entorno virtual**

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

- [ ] **Step 2: Crear tests/conftest.py**

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base, get_db
from backend.main import app

TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def test_engine():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db(test_engine):
    Session = sessionmaker(bind=test_engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture(scope="function")
def client(test_engine):
    from backend.main import app  # import aqui para que unit tests funcionen antes de que main.py exista
    Session = sessionmaker(bind=test_engine)

    def override_get_db():
        session = Session()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 3: Escribir tests/test_calculadora.py (escribir ANTES de implementar)**

```python
from datetime import date
from backend.services.calculadora import (
    calcular_dias_habiles,
    calcular_interes_corriente,
    calcular_interes_mora,
)
from backend.models import Configuracion

# Configuracion de prueba reutilizable
def config_default():
    cfg = Configuracion()
    cfg.tasa_corriente_mensual = 0.014
    cfg.tasa_mora_mensual = 0.022
    cfg.fecha_inicio_corriente = date(2026, 7, 1)
    cfg.dias_gracia_corriente = 15
    cfg.dias_habiles_gracia_mora = 3
    return cfg


# ── calcular_dias_habiles ─────────────────────────────────
class TestCalcularDiasHabiles:
    def test_lunes_mas_tres_dias_da_jueves(self):
        # Lunes 2026-07-06 + 3 días hábiles = Jueves 2026-07-09
        resultado = calcular_dias_habiles(date(2026, 7, 6), 3)
        assert resultado == date(2026, 7, 9)

    def test_jueves_mas_tres_dias_salta_fin_de_semana(self):
        # Jueves 2026-07-09 + 3 días hábiles = Martes 2026-07-14
        resultado = calcular_dias_habiles(date(2026, 7, 9), 3)
        assert resultado == date(2026, 7, 14)

    def test_viernes_mas_un_dia_da_lunes(self):
        # Viernes 2026-07-10 + 1 día hábil = Lunes 2026-07-13
        resultado = calcular_dias_habiles(date(2026, 7, 10), 1)
        assert resultado == date(2026, 7, 13)


# ── calcular_interes_corriente ────────────────────────────
class TestInteresCorreinte:
    def test_dentro_de_gracia_no_genera_interes(self):
        cfg = config_default()
        # 10 días transcurridos, gracia = 15
        resultado = calcular_interes_corriente(
            valor_capital=1_000_000,
            fecha_emision=date(2026, 7, 1),
            fecha_calculo=date(2026, 7, 11),
            config=cfg,
        )
        assert resultado == 0.0

    def test_exactamente_en_el_dia_15_no_genera(self):
        cfg = config_default()
        resultado = calcular_interes_corriente(
            valor_capital=1_000_000,
            fecha_emision=date(2026, 7, 1),
            fecha_calculo=date(2026, 7, 16),  # 15 días exactos
            config=cfg,
        )
        assert resultado == 0.0

    def test_dia_16_genera_un_dia_de_interes(self):
        cfg = config_default()
        # 1 día de interés: 1_000_000 * (0.014/30) * 1 = 466.67
        resultado = calcular_interes_corriente(
            valor_capital=1_000_000,
            fecha_emision=date(2026, 7, 1),
            fecha_calculo=date(2026, 7, 17),  # 16 días
            config=cfg,
        )
        expected = 1_000_000 * (0.014 / 30) * 1
        assert abs(resultado - expected) < 0.01

    def test_30_dias_con_interes_corriente(self):
        cfg = config_default()
        # 45 días transcurridos → 30 días de interés
        resultado = calcular_interes_corriente(
            valor_capital=500_000,
            fecha_emision=date(2026, 7, 1),
            fecha_calculo=date(2026, 8, 15),  # 45 días
            config=cfg,
        )
        expected = 500_000 * (0.014 / 30) * 30
        assert abs(resultado - expected) < 0.01

    def test_antes_del_1_julio_no_genera_interes(self):
        cfg = config_default()
        resultado = calcular_interes_corriente(
            valor_capital=1_000_000,
            fecha_emision=date(2026, 6, 1),
            fecha_calculo=date(2026, 6, 30),  # antes del 1 julio
            config=cfg,
        )
        assert resultado == 0.0


# ── calcular_interes_mora ─────────────────────────────────
class TestInteresMora:
    def test_productos_dentro_de_gracia_no_genera(self):
        cfg = config_default()
        # Factura emitida lunes, calcula el mismo lunes (0 días)
        resultado = calcular_interes_mora(
            valor_capital=200_000,
            fecha_emision=date(2026, 7, 6),   # lunes
            fecha_calculo=date(2026, 7, 6),
            tipo="productos",
            config=cfg,
        )
        assert resultado == 0.0

    def test_productos_en_vencimiento_exacto_no_genera(self):
        cfg = config_default()
        # Lunes + 3 días hábiles = Jueves
        resultado = calcular_interes_mora(
            valor_capital=200_000,
            fecha_emision=date(2026, 7, 6),   # lunes
            fecha_calculo=date(2026, 7, 9),   # jueves (día 3 hábil)
            tipo="productos",
            config=cfg,
        )
        assert resultado == 0.0

    def test_productos_un_dia_despues_del_vencimiento(self):
        cfg = config_default()
        # Vence jueves 9/jul, el viernes 10/jul ya hay mora (1 día)
        resultado = calcular_interes_mora(
            valor_capital=200_000,
            fecha_emision=date(2026, 7, 6),
            fecha_calculo=date(2026, 7, 10),  # viernes = 1 día de mora
            tipo="productos",
            config=cfg,
        )
        expected = 200_000 * (0.022 / 30) * 1
        assert abs(resultado - expected) < 0.01

    def test_parafina_dentro_de_15_dias_no_genera_mora(self):
        cfg = config_default()
        resultado = calcular_interes_mora(
            valor_capital=1_000_000,
            fecha_emision=date(2026, 7, 1),
            fecha_calculo=date(2026, 7, 15),  # 14 días
            tipo="parafina_moldeo",
            config=cfg,
        )
        assert resultado == 0.0

    def test_parafina_dia_16_genera_mora(self):
        cfg = config_default()
        resultado = calcular_interes_mora(
            valor_capital=1_000_000,
            fecha_emision=date(2026, 7, 1),
            fecha_calculo=date(2026, 7, 17),  # 16 días → 1 día de mora
            tipo="parafina_moldeo",
            config=cfg,
        )
        expected = 1_000_000 * (0.022 / 30) * 1
        assert abs(resultado - expected) < 0.01
```

- [ ] **Step 4: Ejecutar los tests — deben FALLAR (servicio no existe aún)**

```bash
pytest tests/test_calculadora.py -v
```

Resultado esperado: `ImportError` o `ModuleNotFoundError` porque `calculadora.py` no existe.

- [ ] **Step 5: Implementar backend/services/calculadora.py**

```python
from datetime import date, timedelta
from backend.models import Configuracion


def calcular_dias_habiles(fecha_inicio: date, n_dias: int) -> date:
    """Avanza n días hábiles (lunes-viernes) desde fecha_inicio."""
    fecha = fecha_inicio
    contados = 0
    while contados < n_dias:
        fecha += timedelta(days=1)
        if fecha.weekday() < 5:  # 0=lunes … 4=viernes
            contados += 1
    return fecha


def calcular_interes_corriente(
    valor_capital: float,
    fecha_emision: date,
    fecha_calculo: date,
    config: Configuracion,
) -> float:
    """Interés corriente para facturas parafina_moldeo.
    Aplica desde fecha_inicio_corriente (2026-07-01) y solo después del día 15.
    """
    if fecha_calculo < config.fecha_inicio_corriente:
        return 0.0

    dias = (fecha_calculo - fecha_emision).days
    if dias <= config.dias_gracia_corriente:
        return 0.0

    dias_con_interes = dias - config.dias_gracia_corriente
    tasa_diaria = config.tasa_corriente_mensual / 30
    return valor_capital * tasa_diaria * dias_con_interes


def calcular_interes_mora(
    valor_capital: float,
    fecha_emision: date,
    fecha_calculo: date,
    tipo: str,
    config: Configuracion,
) -> float:
    """Interés de mora.
    productos: desde el día hábil 4 (después de 3 días hábiles de gracia).
    parafina_moldeo: desde el día 16 calendario (igual umbral que corriente).
    """
    tasa_diaria = config.tasa_mora_mensual / 30

    if tipo == "productos":
        vencimiento = calcular_dias_habiles(
            fecha_emision, config.dias_habiles_gracia_mora
        )
        if fecha_calculo <= vencimiento:
            return 0.0
        dias_mora = (fecha_calculo - vencimiento).days
        return valor_capital * tasa_diaria * dias_mora

    if tipo == "parafina_moldeo":
        dias = (fecha_calculo - fecha_emision).days
        if dias <= config.dias_gracia_corriente:
            return 0.0
        dias_mora = dias - config.dias_gracia_corriente
        return valor_capital * tasa_diaria * dias_mora

    return 0.0


def calcular_factura(
    factura,
    fecha_calculo: date,
    config: Configuracion,
) -> dict:
    """Calcula intereses de una factura y retorna el desglose completo."""
    if factura.estado == "pagada":
        return {
            "id": factura.id,
            "numero_factura": factura.numero_factura,
            "descripcion": factura.descripcion,
            "tipo": factura.tipo,
            "valor_capital": factura.valor_capital,
            "fecha_emision": factura.fecha_emision,
            "dias_transcurridos": 0,
            "interes_corriente": 0.0,
            "interes_mora": 0.0,
            "total_a_cobrar": factura.valor_capital,
            "estado": "pagada",
        }

    dias = (fecha_calculo - factura.fecha_emision).days

    corriente = 0.0
    if factura.tipo == "parafina_moldeo":
        corriente = calcular_interes_corriente(
            factura.valor_capital, factura.fecha_emision, fecha_calculo, config
        )

    mora = calcular_interes_mora(
        factura.valor_capital, factura.fecha_emision, fecha_calculo, factura.tipo, config
    )

    return {
        "id": factura.id,
        "numero_factura": factura.numero_factura,
        "descripcion": factura.descripcion,
        "tipo": factura.tipo,
        "valor_capital": factura.valor_capital,
        "fecha_emision": factura.fecha_emision,
        "dias_transcurridos": dias,
        "interes_corriente": round(corriente, 2),
        "interes_mora": round(mora, 2),
        "total_a_cobrar": round(factura.valor_capital + corriente + mora, 2),
        "estado": factura.estado,
    }
```

- [ ] **Step 6: Ejecutar tests — deben PASAR**

```bash
pytest tests/test_calculadora.py -v
```

Resultado esperado: `11 passed`.

- [ ] **Step 7: Commit**

```bash
git add backend/services/calculadora.py tests/
git commit -m "feat: interest calculation service with full test coverage"
```

---

## Task 5: Ruta Configuración

**Files:**
- Create: `backend/routes/configuracion.py`

- [ ] **Step 1: Crear backend/routes/configuracion.py**

```python
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Configuracion
from backend.schemas import ConfiguracionOut, ConfiguracionUpdate

router = APIRouter(prefix="/api/configuracion", tags=["configuracion"])


def get_or_create_config(db: Session) -> Configuracion:
    cfg = db.get(Configuracion, 1)
    if not cfg:
        cfg = Configuracion(
            id=1,
            tasa_corriente_mensual=0.014,
            tasa_mora_mensual=0.022,
            fecha_inicio_corriente=date(2026, 7, 1),
            dias_gracia_corriente=15,
            dias_habiles_gracia_mora=3,
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


@router.get("", response_model=ConfiguracionOut)
def obtener_configuracion(db: Session = Depends(get_db)):
    return get_or_create_config(db)


@router.put("", response_model=ConfiguracionOut)
def actualizar_configuracion(
    data: ConfiguracionUpdate, db: Session = Depends(get_db)
):
    cfg = get_or_create_config(db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cfg, field, value)
    db.commit()
    db.refresh(cfg)
    return cfg
```

- [ ] **Step 2: Crear tests/test_configuracion.py**

```python
def test_obtener_configuracion_retorna_defaults(client):
    r = client.get("/api/configuracion")
    assert r.status_code == 200
    data = r.json()
    assert data["tasa_corriente_mensual"] == 0.014
    assert data["dias_gracia_corriente"] == 15


def test_actualizar_tasa_mora(client):
    r = client.put("/api/configuracion", json={"tasa_mora_mensual": 0.025})
    assert r.status_code == 200
    assert r.json()["tasa_mora_mensual"] == 0.025
```

- [ ] **Step 3: Ejecutar tests (necesita main.py — completar Task 9 primero antes de ejecutar API tests)**

Nota: los tests de API requieren que main.py esté creado. Ejecutar después del Task 9.

- [ ] **Step 4: Commit**

```bash
git add backend/routes/configuracion.py tests/test_configuracion.py
git commit -m "feat: configuration CRUD endpoint"
```

---

## Task 6: Ruta Asociados

**Files:**
- Create: `backend/routes/asociados.py`

- [ ] **Step 1: Crear backend/routes/asociados.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Asociado
from backend.schemas import AsociadoCreate, AsociadoOut, AsociadoUpdate

router = APIRouter(prefix="/api/asociados", tags=["asociados"])


@router.get("", response_model=list[AsociadoOut])
def listar_asociados(activo: bool = True, db: Session = Depends(get_db)):
    return db.query(Asociado).filter(Asociado.activo == activo).all()


@router.post("", response_model=AsociadoOut, status_code=201)
def crear_asociado(data: AsociadoCreate, db: Session = Depends(get_db)):
    existe = db.query(Asociado).filter(Asociado.cedula_nit == data.cedula_nit).first()
    if existe:
        raise HTTPException(status_code=400, detail="Cédula/NIT ya registrado")
    asociado = Asociado(**data.model_dump())
    db.add(asociado)
    db.commit()
    db.refresh(asociado)
    return asociado


@router.put("/{asociado_id}", response_model=AsociadoOut)
def actualizar_asociado(
    asociado_id: int, data: AsociadoUpdate, db: Session = Depends(get_db)
):
    asociado = db.get(Asociado, asociado_id)
    if not asociado:
        raise HTTPException(status_code=404, detail="Asociado no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(asociado, field, value)
    db.commit()
    db.refresh(asociado)
    return asociado


@router.delete("/{asociado_id}", status_code=204)
def desactivar_asociado(asociado_id: int, db: Session = Depends(get_db)):
    asociado = db.get(Asociado, asociado_id)
    if not asociado:
        raise HTTPException(status_code=404, detail="Asociado no encontrado")
    asociado.activo = False
    db.commit()
```

- [ ] **Step 2: Crear tests/test_asociados.py**

```python
def test_crear_y_listar_asociado(client):
    r = client.post("/api/asociados", json={
        "nombre": "Pedro Gómez",
        "cedula_nit": "12345678",
        "telefono": "3001234567"
    })
    assert r.status_code == 201
    assert r.json()["nombre"] == "Pedro Gómez"

    lista = client.get("/api/asociados")
    assert len(lista.json()) == 1


def test_cedula_duplicada_retorna_400(client):
    payload = {"nombre": "Ana", "cedula_nit": "999"}
    client.post("/api/asociados", json=payload)
    r = client.post("/api/asociados", json=payload)
    assert r.status_code == 400


def test_desactivar_asociado(client):
    r = client.post("/api/asociados", json={"nombre": "Luis", "cedula_nit": "111"})
    aid = r.json()["id"]
    client.delete(f"/api/asociados/{aid}")
    lista = client.get("/api/asociados")
    assert len(lista.json()) == 0
```

- [ ] **Step 3: Commit**

```bash
git add backend/routes/asociados.py tests/test_asociados.py
git commit -m "feat: asociados CRUD route with tests"
```

---

## Task 7: Ruta Facturas

**Files:**
- Create: `backend/routes/facturas.py`

- [ ] **Step 1: Crear backend/routes/facturas.py**

```python
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Factura
from backend.schemas import FacturaCreate, FacturaOut, FacturaUpdate

router = APIRouter(prefix="/api/facturas", tags=["facturas"])

TIPOS_VALIDOS = {"parafina_moldeo", "productos"}


@router.get("", response_model=list[FacturaOut])
def listar_facturas(
    asociado_id: Optional[int] = None,
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Factura)
    if asociado_id:
        q = q.filter(Factura.asociado_id == asociado_id)
    if estado:
        q = q.filter(Factura.estado == estado)
    if tipo:
        q = q.filter(Factura.tipo == tipo)
    return q.order_by(Factura.fecha_emision.desc()).all()


@router.post("", response_model=FacturaOut, status_code=201)
def crear_factura(data: FacturaCreate, db: Session = Depends(get_db)):
    if data.tipo not in TIPOS_VALIDOS:
        raise HTTPException(status_code=400, detail=f"tipo debe ser: {TIPOS_VALIDOS}")
    factura = Factura(**data.model_dump())
    db.add(factura)
    db.commit()
    db.refresh(factura)
    return factura


@router.put("/{factura_id}", response_model=FacturaOut)
def actualizar_factura(
    factura_id: int, data: FacturaUpdate, db: Session = Depends(get_db)
):
    factura = db.get(Factura, factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(factura, field, value)
    db.commit()
    db.refresh(factura)
    return factura


@router.patch("/{factura_id}/pagar", response_model=FacturaOut)
def marcar_pagada(factura_id: int, db: Session = Depends(get_db)):
    factura = db.get(Factura, factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    factura.estado = "pagada"
    factura.fecha_pago = date.today()
    db.commit()
    db.refresh(factura)
    return factura
```

- [ ] **Step 2: Crear tests/test_facturas.py**

```python
import pytest

@pytest.fixture
def asociado_id(client):
    r = client.post("/api/asociados", json={"nombre": "María", "cedula_nit": "123"})
    return r.json()["id"]


def test_crear_factura_parafina(client, asociado_id):
    r = client.post("/api/facturas", json={
        "asociado_id": asociado_id,
        "numero_factura": "FE-001",
        "valor_capital": 500000,
        "fecha_emision": "2026-07-01",
        "tipo": "parafina_moldeo",
    })
    assert r.status_code == 201
    assert r.json()["estado"] == "pendiente"


def test_tipo_invalido_retorna_400(client, asociado_id):
    r = client.post("/api/facturas", json={
        "asociado_id": asociado_id,
        "numero_factura": "FE-002",
        "valor_capital": 100000,
        "fecha_emision": "2026-07-01",
        "tipo": "invalido",
    })
    assert r.status_code == 400


def test_marcar_factura_como_pagada(client, asociado_id):
    r = client.post("/api/facturas", json={
        "asociado_id": asociado_id,
        "numero_factura": "FE-003",
        "valor_capital": 200000,
        "fecha_emision": "2026-07-01",
        "tipo": "productos",
    })
    fid = r.json()["id"]
    r2 = client.patch(f"/api/facturas/{fid}/pagar")
    assert r2.json()["estado"] == "pagada"
    assert r2.json()["fecha_pago"] is not None


def test_filtrar_por_asociado(client, asociado_id):
    client.post("/api/facturas", json={
        "asociado_id": asociado_id,
        "numero_factura": "FE-004",
        "valor_capital": 300000,
        "fecha_emision": "2026-07-01",
        "tipo": "parafina_moldeo",
    })
    r = client.get(f"/api/facturas?asociado_id={asociado_id}")
    assert len(r.json()) == 1
```

- [ ] **Step 3: Commit**

```bash
git add backend/routes/facturas.py tests/test_facturas.py
git commit -m "feat: facturas CRUD route with tests"
```

---

## Task 8: Ruta Calculadora / Intereses

**Files:**
- Create: `backend/routes/intereses.py`

- [ ] **Step 1: Crear backend/routes/intereses.py**

```python
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Asociado, Factura
from backend.routes.configuracion import get_or_create_config
from backend.schemas import CalculadoraOut, DashboardOut, FacturaOut
from backend.services.calculadora import calcular_factura

router = APIRouter(prefix="/api", tags=["calculadora"])


@router.get("/calculadora/{asociado_id}", response_model=CalculadoraOut)
def calcular_para_asociado(
    asociado_id: int,
    fecha: Optional[date] = None,
    db: Session = Depends(get_db),
):
    if fecha is None:
        fecha = date.today()
    asociado = db.get(Asociado, asociado_id)
    if not asociado:
        raise HTTPException(status_code=404, detail="Asociado no encontrado")

    config = get_or_create_config(db)
    facturas = (
        db.query(Factura)
        .filter(Factura.asociado_id == asociado_id, Factura.estado == "pendiente")
        .all()
    )

    detalle = [calcular_factura(f, fecha, config) for f in facturas]

    total_capital = sum(d["valor_capital"] for d in detalle)
    total_corriente = sum(d["interes_corriente"] for d in detalle)
    total_mora = sum(d["interes_mora"] for d in detalle)

    return {
        "asociado_id": asociado_id,
        "asociado_nombre": asociado.nombre,
        "fecha_calculo": fecha,
        "facturas": detalle,
        "resumen": {
            "total_capital": round(total_capital, 2),
            "total_corriente": round(total_corriente, 2),
            "total_mora": round(total_mora, 2),
            "gran_total": round(total_capital + total_corriente + total_mora, 2),
        },
    }


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    hoy = date.today()
    config = get_or_create_config(db)

    pendientes = db.query(Factura).filter(Factura.estado == "pendiente").all()
    calculos = [calcular_factura(f, hoy, config) for f in pendientes]

    total_capital = sum(f.valor_capital for f in pendientes)
    total_intereses = sum(c["interes_corriente"] + c["interes_mora"] for c in calculos)

    vencidas = sum(
        1
        for f in pendientes
        if (hoy - f.fecha_emision).days > (
            15 if f.tipo == "parafina_moldeo" else 3
        )
    )

    # Facturas que vencen en los próximos 5 días
    por_vencer = [
        f for f in pendientes
        if 0 <= (
            (f.fecha_emision + timedelta(days=15 if f.tipo == "parafina_moldeo" else 3))
            - hoy
        ).days <= 5
    ]

    return {
        "total_capital_pendiente": round(total_capital, 2),
        "total_intereses_hoy": round(total_intereses, 2),
        "facturas_vencidas": vencidas,
        "facturas_por_vencer": por_vencer,
    }
```

- [ ] **Step 2: Crear tests/test_intereses.py**

```python
import pytest
from datetime import date

@pytest.fixture
def setup_datos(client):
    """Crea un asociado y una factura parafina pendiente."""
    r = client.post("/api/asociados", json={"nombre": "Carlos", "cedula_nit": "456"})
    aid = r.json()["id"]
    client.post("/api/facturas", json={
        "asociado_id": aid,
        "numero_factura": "FE-001",
        "valor_capital": 1_000_000,
        "fecha_emision": "2026-07-01",
        "tipo": "parafina_moldeo",
    })
    return aid


def test_calculadora_dentro_de_gracia_no_cobra(client, setup_datos):
    aid = setup_datos
    # 10 días después: sin interés
    r = client.get(f"/api/calculadora/{aid}?fecha=2026-07-11")
    assert r.status_code == 200
    data = r.json()
    assert data["resumen"]["total_corriente"] == 0.0
    assert data["resumen"]["gran_total"] == 1_000_000.0


def test_calculadora_dia_16_cobra_corriente(client, setup_datos):
    aid = setup_datos
    r = client.get(f"/api/calculadora/{aid}?fecha=2026-07-17")
    assert r.status_code == 200
    data = r.json()
    # 1 día de corriente: 1_000_000 * (0.014/30) * 1 = 466.67
    assert data["resumen"]["total_corriente"] > 0
    assert data["resumen"]["gran_total"] > 1_000_000


def test_calculadora_asociado_inexistente_retorna_404(client):
    r = client.get("/api/calculadora/9999?fecha=2026-07-17")
    assert r.status_code == 404


def test_dashboard_retorna_estructura(client):
    r = client.get("/api/dashboard")
    assert r.status_code == 200
    keys = r.json().keys()
    assert "total_capital_pendiente" in keys
    assert "facturas_vencidas" in keys
```

- [ ] **Step 3: Commit**

```bash
git add backend/routes/intereses.py tests/test_intereses.py
git commit -m "feat: calculadora and dashboard endpoints with tests"
```

---

## Task 9: main.py y Scripts de Build

**Files:**
- Create: `backend/main.py`

- [ ] **Step 1: Crear backend/main.py**

```python
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import Base, engine
from backend.routes import asociados, facturas, intereses, configuracion

Base.metadata.create_all(bind=engine)

app = FastAPI(title="COOPFANALVELAS — Calculadora de Intereses")

app.include_router(asociados.router)
app.include_router(facturas.router)
app.include_router(intereses.router)
app.include_router(configuracion.router)

# Sirve el frontend React compilado
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_react(full_path: str):
        index = FRONTEND_DIST / "index.html"
        return FileResponse(index)
```

- [ ] **Step 2: Ejecutar todos los tests del backend**

```bash
pytest tests/ -v
```

Resultado esperado: todos los tests pasan (verificar mínimo 20 tests).

- [ ] **Step 3: Verificar que el servidor levanta correctamente**

```bash
uvicorn backend.main:app --reload --port 8000
```

Abrir `http://localhost:8000/docs` — debe mostrar el Swagger de FastAPI con todos los endpoints.

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "feat: wire FastAPI app with all routes and static file serving"
```

---

## Task 10: Frontend — Scaffold con Vite + Tailwind

**Files:**
- Create: `frontend/` (directorio completo generado por Vite)
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: Crear proyecto Vite + React + TypeScript**

```bash
cd C:\Users\Acer\Desktop\COOPFANALVELAS
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Instalar Tailwind CSS y dependencias frontend**

```bash
npm install -D tailwindcss postcss autoprefixer
npm install react-router-dom axios
npx tailwindcss init -p
```

- [ ] **Step 3: Configurar tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        coop: {
          green:      "#00763a",
          darkgreen:  "#0b592a",
          light:      "#EEF6F0",
          yellow:     "#fcc420",
          darkyellow: "#e79f18",
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Reemplazar frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Configurar vite.config.ts (proxy al backend en desarrollo)**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
```

- [ ] **Step 6: Verificar que el proyecto compila**

```bash
npm run build
```

Resultado esperado: carpeta `frontend/dist/` creada sin errores.

- [ ] **Step 7: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: React + Vite + Tailwind frontend scaffold"
```

---

## Task 11: Types + API Client

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/asociados.ts`
- Create: `frontend/src/api/facturas.ts`
- Create: `frontend/src/api/calculadora.ts`
- Create: `frontend/src/api/configuracion.ts`

- [ ] **Step 1: Crear frontend/src/types/index.ts**

```typescript
export interface Asociado {
  id: number;
  nombre: string;
  cedula_nit: string;
  telefono?: string;
  activo: boolean;
}

export interface Factura {
  id: number;
  asociado_id: number;
  numero_factura: string;
  descripcion?: string;
  valor_capital: number;
  fecha_emision: string;
  tipo: "parafina_moldeo" | "productos";
  estado: "pendiente" | "pagada";
  fecha_pago?: string;
  notas?: string;
}

export interface FacturaCalculo {
  id: number;
  numero_factura: string;
  descripcion?: string;
  tipo: string;
  valor_capital: number;
  fecha_emision: string;
  dias_transcurridos: number;
  interes_corriente: number;
  interes_mora: number;
  total_a_cobrar: number;
  estado: string;
}

export interface ResumenCalculo {
  total_capital: number;
  total_corriente: number;
  total_mora: number;
  gran_total: number;
}

export interface CalculadoraResult {
  asociado_id: number;
  asociado_nombre: string;
  fecha_calculo: string;
  facturas: FacturaCalculo[];
  resumen: ResumenCalculo;
}

export interface Configuracion {
  id: number;
  tasa_corriente_mensual: number;
  tasa_mora_mensual: number;
  fecha_inicio_corriente: string;
  dias_gracia_corriente: number;
  dias_habiles_gracia_mora: number;
}

export interface Dashboard {
  total_capital_pendiente: number;
  total_intereses_hoy: number;
  facturas_vencidas: number;
  facturas_por_vencer: Factura[];
}
```

- [ ] **Step 2: Crear frontend/src/api/client.ts**

```typescript
import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export default client;
```

- [ ] **Step 3: Crear frontend/src/api/asociados.ts**

```typescript
import client from "./client";
import type { Asociado } from "../types";

export const getAsociados = () =>
  client.get<Asociado[]>("/asociados").then((r) => r.data);

export const createAsociado = (data: Omit<Asociado, "id" | "activo">) =>
  client.post<Asociado>("/asociados", data).then((r) => r.data);

export const updateAsociado = (id: number, data: Partial<Asociado>) =>
  client.put<Asociado>(`/asociados/${id}`, data).then((r) => r.data);

export const deactivateAsociado = (id: number) =>
  client.delete(`/asociados/${id}`);
```

- [ ] **Step 4: Crear frontend/src/api/facturas.ts**

```typescript
import client from "./client";
import type { Factura } from "../types";

export const getFacturas = (params?: {
  asociado_id?: number;
  estado?: string;
  tipo?: string;
}) => client.get<Factura[]>("/facturas", { params }).then((r) => r.data);

export const createFactura = (data: Omit<Factura, "id" | "estado" | "fecha_pago">) =>
  client.post<Factura>("/facturas", data).then((r) => r.data);

export const updateFactura = (id: number, data: Partial<Factura>) =>
  client.put<Factura>(`/facturas/${id}`, data).then((r) => r.data);

export const marcarPagada = (id: number) =>
  client.patch<Factura>(`/facturas/${id}/pagar`).then((r) => r.data);
```

- [ ] **Step 5: Crear frontend/src/api/calculadora.ts**

```typescript
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
```

- [ ] **Step 6: Crear frontend/src/api/configuracion.ts**

```typescript
import client from "./client";
import type { Configuracion } from "../types";

export const getConfiguracion = () =>
  client.get<Configuracion>("/configuracion").then((r) => r.data);

export const updateConfiguracion = (data: Partial<Configuracion>) =>
  client.put<Configuracion>("/configuracion", data).then((r) => r.data);
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/types frontend/src/api
git commit -m "feat: TypeScript types and API client functions"
```

---

## Task 12: App Shell — Layout y Routing

**Files:**
- Create: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Crear frontend/src/components/Layout.tsx**

```tsx
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
      {/* Sidebar */}
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

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Reemplazar frontend/src/App.tsx**

```tsx
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
```

- [ ] **Step 3: Reemplazar frontend/src/main.tsx**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Crear páginas vacías temporales para que compilen**

Crear cada archivo con contenido mínimo:

`frontend/src/pages/Dashboard.tsx` → `export default function Dashboard() { return <div>Dashboard</div>; }`
`frontend/src/pages/Calculadora.tsx` → `export default function Calculadora() { return <div>Calculadora</div>; }`
`frontend/src/pages/Facturas.tsx` → `export default function Facturas() { return <div>Facturas</div>; }`
`frontend/src/pages/Asociados.tsx` → `export default function Asociados() { return <div>Asociados</div>; }`
`frontend/src/pages/Configuracion.tsx` → `export default function Configuracion() { return <div>Configuración</div>; }`

- [ ] **Step 5: Verificar que compila sin errores**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
cd ..
git add frontend/src/
git commit -m "feat: app shell with sidebar layout and routing"
```

---

## Task 13: Página Asociados

**Files:**
- Modify: `frontend/src/pages/Asociados.tsx`

- [ ] **Step 1: Implementar frontend/src/pages/Asociados.tsx**

```tsx
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
```

- [ ] **Step 2: Prueba manual**

Con el backend corriendo (`uvicorn backend.main:app --reload`) y el frontend en dev (`npm run dev`):
1. Abrir `http://localhost:5173/asociados`
2. Crear un asociado — debe aparecer en la tabla
3. Intentar crear con la misma cédula — debe mostrar error
4. Desactivar — debe desaparecer de la lista

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Asociados.tsx
git commit -m "feat: asociados page with list and create form"
```

---

## Task 14: Página Facturas

**Files:**
- Modify: `frontend/src/pages/Facturas.tsx`

- [ ] **Step 1: Implementar frontend/src/pages/Facturas.tsx**

```tsx
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
```

- [ ] **Step 2: Prueba manual**

1. Crear una factura de parafina para un asociado existente
2. Cambiar el filtro a "Pagadas" — lista vacía
3. Marcar una factura como pagada — desaparece del filtro "Pendientes"
4. Cambiar a "Todas" — debe aparecer con estado "pagada"

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Facturas.tsx
git commit -m "feat: facturas page with list, create and mark-paid"
```

---

## Task 15: Página Calculadora (Pantalla Estrella)

**Files:**
- Modify: `frontend/src/pages/Calculadora.tsx`

- [ ] **Step 1: Implementar frontend/src/pages/Calculadora.tsx**

```tsx
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
```

- [ ] **Step 2: Prueba manual — flujo principal**

1. Ir a `/calculadora`
2. Seleccionar un asociado con facturas pendientes
3. Dejar la fecha como hoy → clic "Calcular"
4. Verificar que muestra la tabla con capital, intereses y total
5. Cambiar la fecha a 30 días después de la emisión de una factura de parafina → confirmar que aparece interés corriente
6. Clic "Imprimir" → abre diálogo de impresión del navegador

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Calculadora.tsx
git commit -m "feat: calculadora page - main daily-use screen"
```

---

## Task 16: Página Dashboard

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Implementar frontend/src/pages/Dashboard.tsx**

```tsx
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
```

- [ ] **Step 2: Prueba manual**

1. Ir a `/` (Dashboard)
2. Verificar que las 3 tarjetas muestran valores (pueden ser 0 si no hay datos)
3. Registrar facturas con fechas cercanas a vencer → recargar y verificar que aparecen en "Próximas a vencer"

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: dashboard with summary cards and upcoming invoices"
```

---

## Task 17: Página Configuración

**Files:**
- Modify: `frontend/src/pages/Configuracion.tsx`

- [ ] **Step 1: Implementar frontend/src/pages/Configuracion.tsx**

```tsx
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
            <p className="text-xs text-gray-400 mt-1">Actualmente: {(config.tasa_corriente_mensual * 100).toFixed(2)}% — Reglamento: 1.4%</p>
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
            <p className="text-xs text-gray-400 mt-1">Actualmente: {(config.tasa_mora_mensual * 100).toFixed(2)}% — Verificar en banrep.gov.co</p>
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
```

- [ ] **Step 2: Prueba manual**

1. Ir a `/configuracion`
2. Cambiar la tasa de mora a 2.5% → Guardar → confirmar mensaje de éxito
3. Ir a la calculadora → calcular una factura vencida → la mora debe reflejar la nueva tasa

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Configuracion.tsx
git commit -m "feat: configuracion page to update interest rates"
```

---

## Task 18: Build Final y Despliegue en Render

**Files:**
- Verify: `build.sh`
- Verify: `render.yaml`

- [ ] **Step 1: Ejecutar build completo localmente**

```bash
cd C:\Users\Acer\Desktop\COOPFANALVELAS
bash build.sh
```

Resultado esperado: sin errores, `frontend/dist/` creado.

- [ ] **Step 2: Verificar que FastAPI sirve el frontend compilado**

```bash
uvicorn backend.main:app --port 8000
```

Abrir `http://localhost:8000` → debe cargar la app React (no el Swagger).
Abrir `http://localhost:8000/docs` → debe cargar el Swagger de la API.

- [ ] **Step 3: Ejecutar suite completa de tests**

```bash
pytest tests/ -v
```

Todos los tests deben pasar antes de hacer push.

- [ ] **Step 4: Commit final y push**

```bash
git add -A
git commit -m "feat: complete COOPFANALVELAS interest calculator app"
```

- [ ] **Step 5: Crear repositorio en GitHub y subir**

```bash
git remote add origin https://github.com/<tu-usuario>/coopfanalvelas.git
git branch -M main
git push -u origin main
```

- [ ] **Step 6: Crear servicio en Render**

1. Ir a [render.com](https://render.com) → New → Web Service
2. Conectar el repositorio de GitHub
3. Render detectará `render.yaml` automáticamente
4. Clic "Create Web Service"
5. Esperar el build (~3-5 min)
6. La URL final será: `https://coopfanalvelas.onrender.com`

- [ ] **Step 7: Prueba de humo en producción**

1. Abrir la URL de Render
2. Crear un asociado
3. Crear una factura de parafina con fecha de 20 días atrás
4. Ir a Calculadora → seleccionar el asociado → verificar que muestra interés corriente (5 días de interés: días 16, 17, 18, 19, 20)
5. Verificar que el total es correcto: `capital + (capital × 0.014/30 × 5)`
