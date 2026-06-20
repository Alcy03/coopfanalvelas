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

FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_react(full_path: str):
        index = FRONTEND_DIST / "index.html"
        return FileResponse(index)
