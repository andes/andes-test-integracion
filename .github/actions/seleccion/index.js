#!/usr/bin/env node
"use strict"

const fs = require("fs")

// El stack va primero. andes es el default. Cada stack tiene sus grupos.
// Un nombre de stack corre los grupos de ese stack. Un grupo elige dentro
// del stack al que pertenece. todos corre los grupos del stack, que es andes
// si no se nombró otro.
//
// Lo que entra del PR se escribe en GITHUB_OUTPUT y después va a git y a find.
// Solo pasan estos juegos de caracteres. Un salto de línea o un %0A no sale.

const STACKS = {
    andes: ["core", "citas", "rup-internacion", "rup", "apps", "monitoreo", "mobile"],
    pacs: ["pacs"],
    recetar: [],
}
const DEFAULT_STACK = "andes"
const RAMAS = ["app", "api", "tests", "matriculaciones", "monitoreo", "mobile"]
const ORIGENES = ["api", "app", "mobile", "monitoreo", "matriculaciones"]
const PREFIJOS = [
    ["cypress/e2e/apps/pacs", "pacs"],
    ["cypress/e2e/apps/recetar", "recetar"],
]
const NOMBRE = /^[a-z][a-z0-9-]*$/
const REF = /^(?!.*\.\.)(?!\/)(?!.*\/$)[A-Za-z0-9][A-Za-z0-9._/-]{0,200}$/
const RUTA = /^(?!.*\.\.)[A-Za-z0-9][A-Za-z0-9._/-]{0,200}$/

function comando(mensaje) {
    return String(mensaje)
        .replace(/%/g, "%25")
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/::/g, ":")
}

function fallo(mensaje) {
    process.stderr.write(`::error::${comando(mensaje)}\n`)
    process.exit(1)
}

function visible(texto) {
    const limpio = String(texto).replace(/[\u0000-\u001f\u007f%]/g, "").slice(0, 80)
    return limpio || "esa línea"
}

function escribir(valores) {
    if (valores.run !== "true" && valores.run !== "false") fallo("run no es true ni false.")
    if (!Object.hasOwn(STACKS, valores.stack)) fallo("El stack de salida no es válido.")
    for (const ruta of valores.spec ? valores.spec.split(",") : []) {
        if (!RUTA.test(ruta)) fallo("La ruta de salida no es válida.")
    }
    for (const grupo of valores.grupos ? valores.grupos.split(",") : []) {
        if (!NOMBRE.test(grupo)) fallo("El grupo de salida no es válido.")
    }
    for (const nombre of RAMAS) {
        if (!REF.test(valores[nombre] || "")) fallo(`La rama de salida ${nombre} no es válida.`)
    }
    const lineas = []
    for (const [clave, valor] of Object.entries(valores)) {
        if (/[\r\n]/.test(clave) || /[\r\n]/.test(String(valor))) fallo("un output trae un salto de línea")
        lineas.push(`${clave}=${valor}`)
    }
    const texto = `${lineas.join("\n")}\n`
    const destino = process.env.GITHUB_OUTPUT
    if (destino) fs.appendFileSync(destino, texto)
    else process.stdout.write(texto)
}

function lineasDe(body) {
    return String(body).split(/\r\n|[\n\r\v\f\u001c\u001d\u001e\u0085\u2028\u2029]/)
}

function bloqueTest(body) {
    const lineas = lineasDe(String(body).replace(/<!--[\s\S]*?-->/g, ""))
    const inicio = lineas.findIndex((linea) => linea.trim() === "### Test")
    if (inicio === -1) return null
    const resto = lineas.slice(inicio + 1)
    const abre = resto.findIndex((linea) => linea.trim().startsWith("```"))
    if (abre === -1) return null
    const contenido = []
    for (const linea of resto.slice(abre + 1)) {
        if (linea.trim().startsWith("```")) return contenido
        contenido.push(linea)
    }
    fallo("El bloque Test abre ``` y no lo cierra.")
}

function gruposDe(stack) {
    if (!Object.hasOwn(STACKS, stack)) fallo(`No conozco el stack ${stack}.`)
    return STACKS[stack]
}

function duenoGrupo(nombre) {
    return Object.entries(STACKS)
        .filter(([, grupos]) => grupos.includes(nombre))
        .map(([stack]) => stack)
}

function duenoSpec(ruta) {
    for (const [prefijo, stack] of PREFIJOS) {
        if (ruta === prefijo || ruta.startsWith(`${prefijo}/`)) return stack
    }
    return DEFAULT_STACK
}

function referencia(valor, etiqueta) {
    if (!REF.test(valor)) fallo(`${etiqueta} no es una referencia válida.`)
    return valor
}

function main() {
    const body = process.env.BODY || ""
    const origen = (process.env.ORIGEN || "").trim()
    const origenRef = (process.env.ORIGEN_REF || "").trim()
    if (!ORIGENES.includes(origen)) {
        fallo(`origen tiene que ser uno de: ${ORIGENES.join(", ")}.`)
    }
    if (!origenRef) fallo("origen_ref viene vacío.")
    referencia(origenRef, "origen_ref")

    const ramas = {}
    for (const nombre of RAMAS) ramas[nombre] = "master"
    const stacks = []
    const pedidos = []
    const specs = []
    let todos = false
    const vistos = new Set()
    const conocidos = new Set(Object.values(STACKS).flat())

    const lineas = bloqueTest(body)
    if (lineas === null) {
        escribir({ run: "false", spec: "", grupos: "", stack: DEFAULT_STACK, ...ramas })
        return
    }

    for (const cruda of lineas) {
        let linea = cruda.trim()
        if (linea.startsWith("- ")) linea = linea.slice(2).trim()
        else if (linea.startsWith("* ")) linea = linea.slice(2).trim()
        if (!linea || linea.startsWith("#")) continue
        if (linea === "todos") {
            todos = true
            continue
        }
        const corte = linea.indexOf(":")
        const nombre = (corte === -1 ? linea : linea.slice(0, corte)).trim()
        const ref = corte === -1 ? "" : linea.slice(corte + 1).trim()
        const separador = corte !== -1
        if (separador && !ref) fallo(`A ${visible(nombre)} le falta la rama.`)
        const conocido = Object.hasOwn(STACKS, nombre) || conocidos.has(nombre) || RAMAS.includes(nombre)
        if (conocido) {
            if (vistos.has(nombre)) fallo(`${nombre} está dos veces.`)
            vistos.add(nombre)
            if (ref && !RAMAS.includes(nombre)) fallo(`${nombre} no lleva rama.`)
            if (Object.hasOwn(STACKS, nombre)) {
                stacks.push(nombre)
                continue
            }
            if (conocidos.has(nombre)) {
                pedidos.push(nombre)
                continue
            }
            if (ref) ramas[nombre] = referencia(ref, `La rama de ${nombre}`)
            else fallo(`${nombre} no es un grupo. Usá ${nombre}: rama.`)
            continue
        }
        if (nombre.includes("/") && !separador) {
            if (!RUTA.test(nombre)) fallo("La ruta no es válida.")
            specs.push(nombre)
            continue
        }
        fallo(`No conozco ${visible(linea)}.`)
    }

    if (stacks.length > 1) fallo("Una corrida lleva un solo stack.")
    if (todos && (pedidos.length || specs.length)) {
        fallo("todos va solo. El stack y las ramas pueden ir en otra línea.")
    }
    if (specs.length && pedidos.length) fallo("Una ruta va sola, sin grupos.")

    let stack
    if (stacks.length) stack = stacks[0]
    else if (pedidos.length) {
        const duenos = []
        for (const grupo of pedidos) {
            for (const dueno of duenoGrupo(grupo)) {
                if (!duenos.includes(dueno)) duenos.push(dueno)
            }
        }
        if (duenos.length > 1) fallo("Los grupos son de stacks distintos.")
        stack = duenos[0]
    } else stack = DEFAULT_STACK

    for (const grupo of pedidos) {
        if (!gruposDe(stack).includes(grupo)) fallo(`${grupo} no es un grupo de ${stack}.`)
    }

    if (specs.length) {
        const duenos = []
        for (const ruta of specs) {
            const dueno = duenoSpec(ruta)
            if (!duenos.includes(dueno)) duenos.push(dueno)
        }
        if (duenos.length > 1) fallo("Las rutas son de stacks distintos.")
        if (stacks.length && duenos[0] !== stack) {
            fallo(`La ruta es de ${duenos[0]} y el stack es ${stack}.`)
        }
        if (!stacks.length) stack = duenos[0]
    }

    if (Object.hasOwn(ramas, origen) && ramas[origen] !== "master") {
        process.stderr.write(`::notice::${comando(`Este PR es de ${origen}. Se usa el commit del push y se ignora la rama del bloque.`)}\n`)
    }
    if (Object.hasOwn(ramas, origen)) ramas[origen] = origenRef

    if (!(todos || stacks.length || pedidos.length || specs.length)) {
        escribir({ run: "false", spec: "", grupos: "", stack, ...ramas })
        return
    }
    if (!gruposDe(stack).length && !specs.length) fallo(`El stack ${stack} no tiene grupos.`)
    if (specs.length) {
        escribir({ run: "true", spec: specs.join(","), grupos: "", stack, ...ramas })
        return
    }
    if (pedidos.length && !todos) {
        const orden = gruposDe(stack).filter((grupo) => pedidos.includes(grupo))
        escribir({ run: "true", spec: "", grupos: orden.join(","), stack, ...ramas })
        return
    }
    escribir({ run: "true", spec: "", grupos: "", stack, ...ramas })
}

main()
