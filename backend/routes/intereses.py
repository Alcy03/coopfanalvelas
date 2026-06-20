from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Asociado, Factura
from backend.routes.configuracion import get_or_create_config
from backend.schemas import CalculadoraOut, DashboardOut
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
