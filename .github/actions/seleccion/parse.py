#!/usr/bin/env python3
"""Lee el bloque Test del body y escribe los inputs de test.yml.

El stack va primero. andes es el default. Cada stack tiene sus grupos.
Un nombre de stack corre los grupos de ese stack. Un grupo elige dentro
del stack al que pertenece. todos corre los grupos del stack, que es andes
si no se nombró otro.
"""

import os
import re
import sys

STACKS = {
    "andes": (
        "core",
        "citas",
        "rup-internacion",
        "rup",
        "apps",
        "monitoreo",
        "mobile",
    ),
    "pacs": ("pacs",),
    "recetar": (),
}
DEFAULT_STACK = "andes"
RAMAS = (
    "app",
    "api",
    "tests",
    "matriculaciones",
    "monitoreo",
    "mobile",
)
ORIGENES = ("api", "app", "mobile", "monitoreo", "matriculaciones")
PREFIJOS = (
    ("cypress/e2e/apps/pacs", "pacs"),
    ("cypress/e2e/apps/recetar", "recetar"),
)


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


def grupos_de(stack):
    if stack not in STACKS:
        fallo(f"No conozco el stack {stack}.")
    return STACKS[stack]


def dueno_grupo(nombre):
    return [stack for stack, grupos in STACKS.items() if nombre in grupos]


def dueno_spec(path):
    for prefijo, stack in PREFIJOS:
        if path == prefijo or path.startswith(prefijo + "/"):
            return stack
    return DEFAULT_STACK


def main():
    body = os.environ.get("BODY") or ""
    origen = (os.environ.get("ORIGEN") or "").strip()
    origen_ref = (os.environ.get("ORIGEN_REF") or "").strip()
    if origen not in ORIGENES:
        fallo(f"origen tiene que ser uno de: {', '.join(ORIGENES)}.")
    if not origen_ref:
        fallo("origen_ref viene vacío.")

    ramas = {nombre: "master" for nombre in RAMAS}
    stacks = []
    pedidos = []
    specs = []
    todos = False
    vistos = set()
    conocidos = {grupo for grupos in STACKS.values() for grupo in grupos}

    lineas = bloque_test(body)
    if lineas is None:
        escribir({"run": "false", "spec": "", "grupos": "", "stack": DEFAULT_STACK, **ramas})
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
        if nombre in STACKS or nombre in conocidos or nombre in RAMAS:
            if nombre in vistos:
                fallo(f"{nombre} está dos veces.")
            vistos.add(nombre)
            if ref and nombre not in RAMAS:
                fallo(f"{nombre} no lleva rama.")
            if nombre in STACKS:
                stacks.append(nombre)
                continue
            if nombre in conocidos:
                pedidos.append(nombre)
                continue
            if ref:
                ramas[nombre] = ref
            else:
                fallo(f"{nombre} no es un grupo. Usá {nombre}: rama.")
            continue
        if "/" in nombre and not separador:
            specs.append(nombre)
            continue
        fallo(f"No conozco {linea}.")

    if len(stacks) > 1:
        fallo("Una corrida lleva un solo stack.")
    if todos and (pedidos or specs):
        fallo("todos va solo. El stack y las ramas pueden ir en otra línea.")
    if specs and pedidos:
        fallo("Una ruta va sola, sin grupos.")

    if stacks:
        stack = stacks[0]
    elif pedidos:
        duenos = []
        for grupo in pedidos:
            duenos.extend(dueno_grupo(grupo))
        duenos = list(dict.fromkeys(duenos))
        if len(duenos) > 1:
            fallo("Los grupos son de stacks distintos.")
        stack = duenos[0]
    else:
        stack = DEFAULT_STACK

    for grupo in pedidos:
        if grupo not in grupos_de(stack):
            fallo(f"{grupo} no es un grupo de {stack}.")

    if specs:
        duenos = list(dict.fromkeys(dueno_spec(path) for path in specs))
        if len(duenos) > 1:
            fallo("Las rutas son de stacks distintos.")
        if stacks and duenos[0] != stack:
            fallo(f"La ruta es de {duenos[0]} y el stack es {stack}.")
        if not stacks:
            stack = duenos[0]

    if origen in ramas and ramas[origen] != "master":
        print(
            f"::notice::Este PR es de {origen}. Se usa el commit del push y se ignora la rama del bloque.",
            file=sys.stderr,
        )
    if origen in ramas:
        ramas[origen] = origen_ref

    if not (todos or stacks or pedidos or specs):
        escribir({"run": "false", "spec": "", "grupos": "", "stack": stack, **ramas})
        return

    if not grupos_de(stack) and not specs:
        fallo(f"El stack {stack} no tiene grupos.")

    if specs:
        escribir({"run": "true", "spec": ",".join(specs), "grupos": "", "stack": stack, **ramas})
        return
    if pedidos and not todos:
        orden = [grupo for grupo in grupos_de(stack) if grupo in pedidos]
        escribir({"run": "true", "spec": "", "grupos": ",".join(orden), "stack": stack, **ramas})
        return

    escribir({"run": "true", "spec": "", "grupos": "", "stack": stack, **ramas})


if __name__ == "__main__":
    main()
