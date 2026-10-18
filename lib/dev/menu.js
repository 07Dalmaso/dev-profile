// Menu do comando dev. Chamado pela funcao dev (comandos/dev/dev.ps1), nao
// direto: um processo Node nao executa funcoes do PowerShell, entao o menu
// grava em `saida` a linha que a funcao dev deve executar.
import { readFileSync, writeFileSync } from 'node:fs'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { lerConfig } from '../comum/config.js'
import { ask, caber, sair } from '../comum/prompts.js'
import { lerComandos, nomeArea } from './comandos.js'
import { configurar } from './configurar.js'

const [entrada, saida, ...resto] = process.argv.slice(2)
if (!entrada || !saida) sair('Use o comando dev no PowerShell; este arquivo e chamado por ele.')

const lista = resto.some((arg) => ['-l', '--lista'].includes(arg))
const filtros = resto.filter((arg) => !arg.startsWith('-')).map((arg) => arg.toLowerCase())

// Do PowerShell vem o que so ele sabe: parametros de cada funcao carregada e se
// um alias esconde a funcao. Funcao ausente = desativada ou criada depois que o
// terminal abriu.
const info = JSON.parse(readFileSync(entrada, 'utf8').replace(/^﻿/, '') || '{}')
const { desativados } = lerConfig()

const todos = lerComandos().map((cmd) => {
    const dados = info[cmd.nome]
    return {
        ...cmd,
        ativo: !desativados.includes(cmd.nome),
        // ConvertTo-Json do 5.1 transforma lista de um item so em objeto.
        parametros: [].concat(dados?.parametros ?? []),
        conflito: typeof dados?.conflito === 'string' ? dados.conflito : null,
        naoCarregado: cmd.powershell && !dados && !desativados.includes(cmd.nome),
    }
})
const comandos = todos.filter((cmd) => filtros.every((filtro) =>
    `${cmd.nome} ${cmd.area} ${cmd.descricao}`.toLowerCase().includes(filtro)))

if (!comandos.length) sair(`Nenhum comando encontrado para: ${filtros.join(' ')}`)

// gcom <msg>, gbranch [name]
const assinatura = (cmd) => [cmd.nome, ...cmd.parametros.map((par) => par.obrigatorio ? `<${par.nome}>` : `[${par.nome}]`)].join(' ')

// Por que um comando nao roda, ou null se roda.
function impedimento(cmd) {
    if (!cmd.ativo) return 'desativado'
    if (cmd.conflito) return `nao funciona: ${cmd.conflito} tem prioridade`
    if (cmd.naoCarregado) return 'abra um terminal novo para carregar'
    return null
}

if (lista) {
    const largura = Math.max(...comandos.map((cmd) => assinatura(cmd).length))
    for (const area of [...new Set(comandos.map((cmd) => cmd.area))]) {
        console.log(`\n${c.bold(nomeArea(area))}`)
        for (const cmd of comandos.filter((item) => item.area === area)) {
            const motivo = impedimento(cmd)
            const linha = `  ${assinatura(cmd).padEnd(largura)}  ${cmd.descricao}`
            console.log(motivo ? c.dim(`${linha} ${c.yellow(`(${motivo})`)}`) : linha.replace(cmd.nome, c.cyan(cmd.nome)))
        }
    }
    console.log()
    process.exit(0)
}

const SAIR = Symbol('sair')
const VOLTAR = Symbol('voltar')
const CONFIGURAR = Symbol('configurar')

// No menu so entram os ativos; os desativados ficam na configuracao.
const ativos = comandos.filter((cmd) => cmd.ativo)
const areas = [...new Set(ativos.map((cmd) => cmd.area))]

function sairDoMenu() {
    p.outro('Ate mais.')
    process.exit(0)
}

// Primeiro nivel: a area. Com filtro que so achou uma area, vai direto nela.
async function escolherArea() {
    if (filtros.length && areas.length === 1) return areas[0]

    const area = ask(await p.select({
        message: 'Area',
        options: [
            ...areas.map((area) => {
                const daArea = ativos.filter((cmd) => cmd.area === area)
                // Area de um comando so (Demandas) mostra o que ele faz.
                const hint = daArea.length === 1 ? caber(daArea[0].descricao, 25) : `${daArea.length} comandos`
                return { value: area, label: nomeArea(area), hint }
            }),
            { value: CONFIGURAR, label: 'configurar', hint: 'ativar / desativar comandos' },
            { value: SAIR, label: 'sair' },
        ],
    }))
    if (area === SAIR) sairDoMenu()
    if (area === CONFIGURAR) {
        await configurar(todos)
        sairDoMenu()
    }
    return area
}

// Segundo nivel: os comandos da area. null volta para as areas.
async function escolherComando(area) {
    const daArea = ativos.filter((cmd) => cmd.area === area)
    // Um comando so: escolher a area ja e escolher o comando.
    if (daArea.length === 1 && !impedimento(daArea[0])) return daArea[0]
    const largura = Math.max(...daArea.map((cmd) => assinatura(cmd).length))

    while (true) {
        const nome = ask(await p.select({
            message: nomeArea(area),
            maxItems: 15,
            options: [
                ...daArea.map((cmd) => ({
                    value: cmd.nome,
                    label: assinatura(cmd).padEnd(largura),
                    hint: impedimento(cmd) ? c.yellow(impedimento(cmd)) : caber(cmd.descricao, largura + 10),
                })),
                filtros.length && areas.length === 1 ? { value: SAIR, label: 'sair' } : { value: VOLTAR, label: 'voltar' },
            ],
        }))
        if (nome === SAIR) sairDoMenu()
        if (nome === VOLTAR) return null

        const cmd = daArea.find((item) => item.nome === nome)
        if (!impedimento(cmd)) return cmd
        p.log.warn(`${cmd.nome}: ${impedimento(cmd)}.`)
    }
}

p.intro(c.bgBlue(c.black(' dev ')))

let escolhido = null
while (!escolhido) escolhido = await escolherComando(await escolherArea())

// Parametro vai nomeado (-msg 'texto'): opcional pulado nao desalinha os outros.
// Aspas simples nao expandem $ no PowerShell; ' vira ''.
const args = []
for (const par of escolhido.parametros) {
    const valor = ask(await p.text({
        message: par.obrigatorio ? par.nome : `${par.nome} (opcional)`,
        defaultValue: '',
        validate: (texto) => {
            if (par.obrigatorio && !texto?.trim()) return 'Obrigatorio.'
        },
    })).trim()
    if (valor) args.push(`-${par.nome} '${valor.replace(/'/g, "''")}'`)
}

const linha = [escolhido.nome, ...args].join(' ')
writeFileSync(saida, linha)
p.outro(`Executando: ${c.cyan(linha)}`)
