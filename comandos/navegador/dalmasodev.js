#!/usr/bin/env node
// abre o DalmasoDev no navegador: demandas e todas as ferramentas (so neste computador)
import * as p from '@clack/prompts'
import c from 'picocolors'
import { FERRAMENTAS } from '../../lib/tools/index.js'
import { abrirDalmasoDev } from '../../lib/web/abrir.js'

const ABAS = ['demandas', ...FERRAMENTAS.map((f) => f.id)]

if (['-h', '--help'].includes(process.argv[2])) {
    console.log(`\n${c.bold('dalmasodev')} - demandas e ferramentas no navegador\n`)
    console.log('  dalmasodev          abre na primeira aba')
    console.log('  dalmasodev <aba>    abre direto numa aba\n')
    console.log(`  abas: ${ABAS.join(', ')}\n`)
    console.log('Roda so neste computador (127.0.0.1); Ctrl+C no terminal fecha.\n')
    process.exit(0)
}

const aba = process.argv[2]?.toLowerCase() ?? ''
p.intro(c.bgBlue(c.white(' DalmasoDev ')))
if (aba && !ABAS.includes(aba)) p.log.warn(`Aba desconhecida: ${aba}. Abrindo na primeira.`)
await abrirDalmasoDev(ABAS.includes(aba) ? aba : '')
p.outro('Ate mais.')
process.exit(0)
