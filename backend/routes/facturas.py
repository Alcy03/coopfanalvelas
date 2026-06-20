from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
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
