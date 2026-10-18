#!/usr/bin/env node
// caixa de ferramentas: diff, JSON, Base64, JWT, URL, datas, hash...
import * as p from '@clack/prompts'
import c from 'picocolors'
import { lerConfig } from '../../lib/comum/config.js'
import { ask } from '../../lib/comum/prompts.js'
import { FERRAMENTAS } from '../../lib/tools/index.js'

// Desativadas no dev > configurar ficam fora do menu.
const { desativados } = lerConfig()
const desativada = (f) => desativados.includes(`tools:${f.id}`)
const disponiveis = FERRAMENTAS.filter((f) => !desativada(f))

const SAIR = Symbol('sair')

if (['-h', '--help'].includes(process.argv[2])) {
    console.log(`\n${c.bold('tools')} - caixa de ferramentas\n`)
    console.log('  tools          abre o menu')
    console.log('  tools <nome>   vai direto para uma ferramenta\n')
    for (const f of FERRAMENTAS) {
        const linha = `  ${f.id.padEnd(10)} ${f.label} - ${f.hint}`
        console.log(desativada(f) ? c.dim(`${linha} ${c.yellow('(desativada)')}`) : linha)
    }
    console.log()
    process.exit(0)
}

p.intro(c.bgCyan(c.black(' tools ')))

// `tools json` pula o menu na primeira vez.
const pedida = process.argv[2]?.toLowerCase()
let atual = disponiveis.find((f) => f.id === pedida)
if (pedida && !atual) p.log.warn(`Ferramenta indisponivel: ${pedida}. Use tools -h para ver a lista.`)

// Depois de cada uso volta ao menu, com a ultima ferramenta ja selecionada.
let ultima = atual?.id

while (true) {
    if (!atual) {
        const id = ask(await p.select({
            message: 'Ferramenta',
            initialValue: ultima,
            maxItems: 12,
            options: [
                ...disponiveis.map((f) => ({ value: f.id, label: f.label, hint: f.hint })),
                { value: SAIR, label: 'sair' },
            ],
        }))
        if (id === SAIR) break
        atual = disponiveis.find((f) => f.id === id)
    }

    await atual.executar()
    ultima = atual.id
    atual = null
}

p.outro('Ate mais.')
