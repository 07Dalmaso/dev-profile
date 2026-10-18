#!/usr/bin/env node
// menu de PHP: cache, servidor, logs, rotas, tinker (Laravel e Yii2)
import * as p from '@clack/prompts'
import c from 'picocolors'
import { lerConfig } from '../../lib/comum/config.js'
import { ask } from '../../lib/comum/prompts.js'
import { ACOES } from '../../lib/phpt/index.js'
import { FRAMEWORK, NOME } from '../../lib/phpt/suporte/framework.js'

// Aparecem as acoes do framework da pasta, menos as desativadas no dev > configurar.
const { desativados } = lerConfig()
const desativada = (acao) => desativados.includes(`phpt:${acao.id}`)
const disponiveis = ACOES.filter((acao) => !desativada(acao) && (!acao.fw || acao.fw.includes(FRAMEWORK)))

const SAIR = Symbol('sair')

if (['-h', '--help'].includes(process.argv[2])) {
    console.log(`\n${c.bold('phpt')} - menu de PHP para Laravel e Yii2\n`)
    console.log('  phpt          abre o menu')
    console.log('  phpt <acao>   vai direto para uma acao\n')
    for (const acao of ACOES) {
        const linha = `  ${acao.id.padEnd(9)} ${acao.label}${acao.fw ? ` (${acao.fw.map((fw) => NOME[fw]).join(', ')})` : ''}`
        console.log(desativada(acao) ? c.dim(`${linha} ${c.yellow('(desativada)')}`) : linha)
    }
    console.log()
    process.exit(0)
}

p.intro(c.bgMagenta(c.black(' phpt ')))
if (FRAMEWORK) p.log.info(`Projeto ${NOME[FRAMEWORK]} em ${c.dim(process.cwd())}`)
else p.log.warn('Nenhum projeto Laravel ou Yii2 nesta pasta: so as acoes gerais aparecem.')

// `phpt log` pula o menu na primeira vez.
const pedida = process.argv[2]?.toLowerCase()
let atual = disponiveis.find((acao) => acao.id === pedida)
if (pedida && !atual) p.log.warn(`Acao indisponivel aqui: ${pedida}. Use phpt -h para ver a lista.`)

// Depois de cada uso volta ao menu, com a ultima acao ja selecionada.
let ultima = atual?.id

while (true) {
    if (!atual) {
        const id = ask(await p.select({
            message: 'Acao',
            initialValue: ultima,
            maxItems: 15,
            options: [
                ...disponiveis.map((acao) => ({ value: acao.id, label: acao.label, hint: acao.hint })),
                { value: SAIR, label: 'sair' },
            ],
        }))
        if (id === SAIR) break
        atual = disponiveis.find((acao) => acao.id === id)
    }

    await atual.executar()
    ultima = atual.id
    atual = null
}

p.outro('Ate mais.')
