#!/usr/bin/env python3
"""Lee el bloque Test del body y escribe los inputs de test.yml."""

import os
import re
import sys

GRUPOS = (
    "core",
    "citas",
    "rup-internacion",
    "rup",
    "apps",
    "monitoreo",
    "mobile",
)
RAMAS = (
    "app",
    "api",
    "tests",
    "matriculaciones",
    "monitoreo",
    "mobile",
)
ORIGENES = ("api", "app", "mobile", "monitoreo", "matriculaciones")


def escribir(valores):
    destino = os.environ.get("GITHUB_OUTPUT")
    lineas = [f"{clave}={valor}" for clave, valor in valores.items()]
    texto = "\n".join(lineas) + "\n"
    if destino:
        with open(destino, "a", encoding="utf-8") as salida:
            salida.write(texto)
    else:
        sys.stdout.write(texto)


def fallo(mensaje):
    print(f"::error::{mensaje}", file=sys.stderr)
    sys.exit(1)


def bloque_test(body):
    sin_comentarios = re.sub(r"<!--.*?-->", "", body, flags=re.DOTALL)
    lineas = sin_comentarios.splitlines()
    inicio = None
    for indice, linea in enumerate(lineas):
        if linea.strip() == "### Test":
            inicio = indice + 1
            break
    if inicio is None:
        return None
    resto = lineas[inicio:]
    abre = None
    for indice, linea in enumerate(resto):
        if linea.strip().startswith("```"):
            abre = indice + 1
            break
    if abre is None:
        return None
    contenido = []
    for linea in resto[abre:]:
        if linea.strip().startswith("```"):
            break
        contenido.append(linea)
    else:
        fallo("El bloque Test abre ``` y no lo cierra.")
    return contenido


def main():
    body = os.environ.get("BODY") or ""
    origen = (os.environ.get("ORIGEN") or "").strip()
    origen_ref = (os.environ.get("ORIGEN_REF") or "").strip()
    if origen not in ORIGENES:
        fallo(f"origen tiene que ser uno de: {', '.join(ORIGENES)}.")
    if not origen_ref:
        fallo("origen_ref viene vacío.")

    ramas = {nombre: "master" for nombre in RAMAS}
    pedidos = []
    specs = []
    todos = False
    vistos = set()

    lineas = bloque_test(body)
    if lineas is None:
        escribir({"run": "false", "spec": "", "grupos": "", **ramas})
        return

    for cruda in lineas:
        linea = cruda.strip()
        if linea.startswith("- "):
            linea = linea[2:].strip()
        elif linea.startswith("* "):
            linea = linea[2:].strip()
        if not linea or linea.startswith("#"):
            continue
        if linea == "todos":
            todos = True
            continue
        nombre, separador, ref = linea.partition(":")
        nombre = nombre.strip()
        ref = ref.strip()
        if separador and not ref:
            fallo(f"A {nombre} le falta la rama.")
        if nombre in GRUPOS or nombre in RAMAS:
            if nombre in vistos:
                fallo(f"{nombre} está dos veces.")
            vistos.add(nombre)
            if ref:
                if nombre not in RAMAS:
                    fallo(f"{nombre} es un grupo y no lleva rama.")
                ramas[nombre] = ref
            if nombre in GRUPOS:
                pedidos.append(nombre)
            elif not ref:
                fallo(f"{nombre} no es un grupo. Usá {nombre}: rama.")
            continue
        if "/" in nombre and not separador:
            specs.append(nombre)
            continue
        fallo(f"No conozco {linea}.")

    if todos and (pedidos or specs):
        fallo("todos va solo. Las ramas pueden ir en otra línea.")
    if specs and pedidos:
        fallo("Una ruta va sola, sin grupos.")

    if origen in ramas and ramas[origen] != "master":
        print(
            f"::notice::Este PR es de {origen}. Se usa el commit del push y se ignora la rama del bloque.",
            file=sys.stderr,
        )
    if origen in ramas:
        ramas[origen] = origen_ref

    if todos:
        escribir({"run": "true", "spec": "", "grupos": "", **ramas})
        return
    if specs:
        escribir({"run": "true", "spec": ",".join(specs), "grupos": "", **ramas})
        return
    if pedidos:
        orden = [nombre for nombre in GRUPOS if nombre in pedidos]
        escribir({"run": "true", "spec": "", "grupos": ",".join(orden), **ramas})
        return

    escribir({"run": "false", "spec": "", "grupos": "", **ramas})


if __name__ == "__main__":
    main()
