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
