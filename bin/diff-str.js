#!/usr/bin/env node
import { parseArgs } from 'node:util'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { comparar, modoAuto, mostrar } from '../lib/ferramentas/diff.js'
import { lerArquivo, lerClipboard, sair } from '../lib/ui.js'

const AJUDA = `
${c.bold('diff-str')} - mostra a diferenca entre dois textos

  diff-str                         menu interativo (clipboard, arquivo ou digitar)
  diff-str "texto A" "texto B"     direto pelos argumentos
  diff-str -f antigo.sql novo.sql  compara dois arquivos
  diff-str -c ["texto B"]          clipboard atual como texto A

  -m, --modo <modo>   auto (padrao), char, palavra ou linha
  -h, --help          mostra esta ajuda

Codigo de saida: 0 se iguais, 1 se diferentes, 2 em caso de erro.
Tambem fica no menu do comando tools.
`

const MODOS = {
    auto: 'auto',
    c: 'char', char: 'char', caractere: 'char',
    p: 'palavra', w: 'palavra', palavra: 'palavra', word: 'palavra',
    l: 'linha', linha: 'linha', line: 'linha',
}

let opcoes
try {
    opcoes = parseArgs({
        allowPositionals: true,
        options: {
            arquivo: { type: 'boolean', short: 'f' },
            clipboard: { type: 'boolean', short: 'c' },
            modo: { type: 'string', short: 'm', default: 'auto' },
            help: { type: 'boolean', short: 'h' },
        },
    })
} catch (err) {
    sair(`${err.message}\n${AJUDA}`)
}

const { values: flags, positionals: args } = opcoes

if (flags.help) {
    console.log(AJUDA)
    process.exit(0)
}

const modo = MODOS[flags.modo.toLowerCase()]
if (!modo) sair(`Modo invalido: ${flags.modo}. Use auto, char, palavra ou linha.`)

async function interativo(a) {
    p.intro(c.bgCyan(c.black(' diff-str ')))
    await comparar({ a, modo: modo === 'auto' ? null : modo })
    p.outro('Ate mais.')
    process.exit(0)
}

let a
let b

if (flags.arquivo) {
    if (args.length !== 2) sair('Use: diff-str -f <arquivo A> <arquivo B>')
    a = lerArquivo(args[0])
    b = lerArquivo(args[1])
} else if (flags.clipboard) {
    if (args.length > 1) sair('Use: diff-str -c ["texto B"]')
    a = lerClipboard()
    if (!a) sair('Clipboard vazio.')
    if (!args.length) await interativo(a)
    b = args[0]
} else if (args.length === 2) {
    [a, b] = args
} else if (!args.length) {
    await interativo()
} else {
    sair(`Passe dois textos, ou nenhum para o modo interativo.\n${AJUDA}`)
}

if (a === b) {
    console.log(c.green('Textos identicos.'))
    process.exit(0)
}

const { texto, aviso } = mostrar(a, b, modo === 'auto' ? modoAuto(a, b) : modo)
if (aviso) console.log(c.yellow(`! ${aviso}`))
console.log(c.dim(texto))

process.exit(1)
