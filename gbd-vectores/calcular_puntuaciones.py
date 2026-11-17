"""
Calcula, sin conectarse a ningun lado, las puntuaciones que deberia devolver MongoDB Atlas
($vectorSearch con similarity "cosine") para las 6 fichas y las 2 consultas del laboratorio.

Atlas normaliza el coseno a un puntaje entre 0 y 1:   score = (1 + coseno) / 2

Uso:  python calcular_puntuaciones.py
"""
import math

# Cada posicion del vector es un tema:
DIMENSIONES = ["agua/riego", "plagas/enfermedades", "nutrientes/fertilizacion", "cosecha/rendimiento", "clima/calor"]

FICHAS = {
    1: ("Riego por goteo en uva Red Globe",               [0.95, 0.05, 0.20, 0.10, 0.30]),
    2: ("Control de oidio con fungicida en la vid",      [0.10, 0.95, 0.15, 0.05, 0.35]),
    3: ("Fertilizacion nitrogenada en palta",             [0.25, 0.05, 0.95, 0.20, 0.05]),
    4: ("Rendimiento por hectarea en la cosecha de mango", [0.05, 0.05, 0.15, 0.95, 0.10]),
    5: ("Estres hidrico por ola de calor",                [0.70, 0.10, 0.05, 0.10, 0.85]),
    6: ("Mosca de la fruta antes de la cosecha",          [0.05, 0.80, 0.05, 0.60, 0.15]),
}

CONSULTAS = {
    "Busqueda 1: 'Que hago con mis cultivos cuando hace mucho calor y falta agua?'": [0.80, 0.05, 0.10, 0.05, 0.70],
    "Busqueda 2: 'Que hago si aparecen insectos en la fruta antes de cosechar?'":    [0.05, 0.85, 0.05, 0.55, 0.10],
}


def coseno(a, b):
    punto = sum(x * y for x, y in zip(a, b))
    return punto / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))


for consulta, q in CONSULTAS.items():
    print("\n" + consulta)
    print(f"  vector de la consulta: {q}")
    filas = sorted(((coseno(q, v), n, t) for n, (t, v) in FICHAS.items()), reverse=True)
    print(f"  {'#':>2}  {'ficha':<48} {'coseno':>7} {'score Atlas':>12}")
    for pos, (c, n, t) in enumerate(filas, 1):
        print(f"  {pos:>2}  {('[' + str(n) + '] ' + t):<48} {c:7.4f} {(1 + c) / 2:12.4f}")
