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
