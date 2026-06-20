from datetime import date
from backend.services.calculadora import (
    calcular_dias_habiles,
    calcular_interes_corriente,
    calcular_interes_mora,
)
from backend.models import Configuracion


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
