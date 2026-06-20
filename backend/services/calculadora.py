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
