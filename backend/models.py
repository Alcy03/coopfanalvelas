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
