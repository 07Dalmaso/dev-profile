#!/usr/bin/env node
import * as p from '@clack/prompts'
import c from 'picocolors'
import { ask } from '../lib/ui.js'
import base64 from '../lib/ferramentas/base64.js'
import data from '../lib/ferramentas/data.js'
import diff from '../lib/ferramentas/diff.js'
import documento from '../lib/ferramentas/documento.js'
import gerar from '../lib/ferramentas/gerar.js'
import hash from '../lib/ferramentas/hash.js'
import json from '../lib/ferramentas/json.js'
import jwt from '../lib/ferramentas/jwt.js'
import texto from '../lib/ferramentas/texto.js'
import url from '../lib/ferramentas/url.js'

// Ferramenta nova: um modulo em lib/ferramentas com { id, label, hint, executar }
// e uma linha aqui.
const FERRAMENTAS = [diff, json, base64, jwt, url, data, hash, gerar, texto, documento]

const SAIR = Symbol('sair')

if (['-h', '--help'].includes(process.argv[2])) {
    console.log(`\n${c.bold('tools')} - caixa de ferramentas\n`)
    console.log('  tools          abre o menu')
    console.log('  tools <nome>   vai direto para uma ferramenta\n')
    for (const f of FERRAMENTAS) console.log(`  ${f.id.padEnd(10)} ${f.label} ${c.dim(`- ${f.hint}`)}`)
    console.log()
    process.exit(0)
}

p.intro(c.bgCyan(c.black(' tools ')))

// `tools json` pula o menu na primeira vez.
const pedida = process.argv[2]
let atual = FERRAMENTAS.find((f) => f.id === pedida?.toLowerCase())
if (pedida && !atual) p.log.warn(`Ferramenta desconhecida: ${pedida}. Use tools -h para ver a lista.`)

// Depois de cada uso volta ao menu, com a ultima ferramenta ja selecionada.
let ultima = atual?.id

while (true) {
    if (!atual) {
        const id = ask(await p.select({
            message: 'Ferramenta',
            initialValue: ultima,
            maxItems: 12,
            options: [
                ...FERRAMENTAS.map((f) => ({ value: f.id, label: f.label, hint: f.hint })),
                { value: SAIR, label: 'sair' },
            ],
        }))
        if (id === SAIR) break
        atual = FERRAMENTAS.find((f) => f.id === id)
    }

    await atual.executar()
    ultima = atual.id
    atual = null
}

p.outro('Ate mais.')
