from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, field_validator


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
    tipo: Literal["parafina_moldeo", "productos"]
    notas: Optional[str] = None

    @field_validator("valor_capital")
    @classmethod
    def capital_positivo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("valor_capital debe ser mayor a 0")
        return v


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
