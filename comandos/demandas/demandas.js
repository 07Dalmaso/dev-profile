#!/usr/bin/env node
// suas demandas (issues de um repositorio privado no GitHub): listar, criar, comecar, concluir
import * as p from '@clack/prompts'
import c from 'picocolors'
import { lerConfig } from '../../lib/comum/config.js'
import { ask } from '../../lib/comum/prompts.js'
import { ACOES as TODAS } from '../../lib/demandas/index.js'
import { erroGh, ghInstalado, ghLogado, PASSO_A_PASSO } from '../../lib/demandas/suporte/gh.js'
import { abertas } from '../../lib/demandas/suporte/issues.js'
import { projetoDaPasta } from '../../lib/demandas/suporte/projeto-atual.js'
import { configurarRepo, repoSalvo } from '../../lib/demandas/suporte/repo.js'

// Desativadas no dev > configurar ficam fora do menu.
const { desativados } = lerConfig()
const desativada = (acao) => desativados.includes(`demandas:${acao.id}`)
const ACOES = TODAS.filter((acao) => !desativada(acao))

if (['-h', '--help'].includes(process.argv[2])) {
    console.log(`\n${c.bold('demandas')} - suas demandas no GitHub (repositorio privado)\n`)
    console.log('  demandas          abre o menu')
    console.log('  demandas <acao>   vai direto para uma acao\n')
    for (const acao of TODAS) {
        const linha = `  ${acao.id.padEnd(10)} ${acao.label}${acao.hint ? ` - ${acao.hint}` : ''}`
        console.log(desativada(acao) ? c.dim(`${linha} ${c.yellow('(desativada)')}`) : linha)
    }
    console.log(`\nPrimeira vez:\n${PASSO_A_PASSO.replace(/^/gm, '  ')}\n`)
    process.exit(0)
}

p.intro(c.bgGreen(c.black(' demandas ')))

// Instalar, logar e criar o repositorio sao passos do usuario: aqui so se avisa.
if (!ghInstalado() || !ghLogado()) {
    p.log.warn(ghInstalado() ? 'O GitHub CLI nao esta logado.' : 'O GitHub CLI (gh) nao esta instalado.')
    p.note(PASSO_A_PASSO, 'Primeira vez')
    p.outro('Depois e so rodar demandas de novo.')
    process.exit(0)
}

let repo = repoSalvo() ?? await configurarRepo()
if (!repo) {
    p.note(PASSO_A_PASSO, 'Primeira vez')
    process.exit(1)
}

const TROCAR = Symbol('trocar')
const SAIR = Symbol('sair')

// `demandas nova` pula o menu na primeira vez.
const pedida = process.argv[2]?.toLowerCase()
let atual = ACOES.find((acao) => acao.id === pedida)
if (pedida && !atual) p.log.warn(`Acao indisponivel: ${pedida}. Use demandas -h para ver a lista.`)
let ultima = atual?.id

while (true) {
    if (!atual) {
        // Contagem atualizada a cada volta ao menu.
        let lista
        try {
            lista = abertas(repo)
        } catch (err) {
            p.log.error(`Nao foi possivel ler ${repo}: ${erroGh(err)}`)
            process.exit(1)
        }
        const altas = lista.filter((issue) => issue.prioridade === 'alta').length
        const andamento = lista.filter((issue) => issue.andamento).length
        // Projeto desta pasta, entre os que tem demanda aberta.
        const daPasta = projetoDaPasta([...new Set(lista.map((issue) => issue.projeto).filter(Boolean))])
        const naPasta = daPasta && lista.filter((issue) => issue.projeto === daPasta).length
        const resumo = [
            `${lista.length} abertas`,
            daPasta && `${naPasta} em ${daPasta}`,
            altas && `${altas} alta prioridade`,
            andamento && `${andamento} em andamento`,
        ].filter(Boolean).join(' - ')

        const id = ask(await p.select({
            message: `Demandas ${c.dim(`(${repo})`)}`,
            initialValue: ultima,
            options: [
                ...ACOES.map((acao) => ({ value: acao.id, label: acao.label, hint: acao.id === 'listar' ? resumo : acao.hint })),
                { value: TROCAR, label: 'trocar repositorio' },
                { value: SAIR, label: 'sair' },
            ],
        }))
        if (id === SAIR) break
        if (id === TROCAR) {
            repo = await configurarRepo() ?? repo
            continue
        }
        atual = ACOES.find((acao) => acao.id === id)
    }

    await atual.executar(repo)
    ultima = atual.id
    atual = null
}

p.outro('Ate mais.')
