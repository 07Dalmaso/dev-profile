// Comecar uma demanda: cria a branch LOCAL com o numero da issue, a partir da
// base certa (igual ao gbranch), e opcionalmente marca "em andamento" no GitHub.
// Nunca faz push: subir e com o usuario.
import { execFileSync } from 'node:child_process'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { executar } from '../comum/processo.js'
import { ask } from '../comum/prompts.js'
import { palavras } from '../tools/motor/texto.js'
import { erroGh, gh } from './suporte/gh.js'
import { ANDAMENTO, escolherIssue, garantirLabels } from './suporte/issues.js'

const TIPOS = [
    { value: 'feature', label: 'feature', hint: 'a partir da develop' },
    { value: 'bugfix', label: 'bugfix', hint: 'a partir da develop' },
    { value: 'hotfix', label: 'hotfix', hint: 'a partir da master' },
]

function git(args) {
    try {
        return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    } catch {
        return null
    }
}

export async function comecar(repo, issue) {
    if (git(['rev-parse', '--is-inside-work-tree']) !== 'true') {
        return p.log.error('Rode demandas dentro da pasta do projeto (repositorio git) para criar a branch.')
    }
    if (git(['status', '--porcelain'])) {
        return p.log.warn('Existem alteracoes nao commitadas. Faca commit ou stash antes de trocar de branch.')
    }

    const tipo = ask(await p.select({ message: 'Tipo da branch', options: TIPOS }))
    const base = tipo === 'hotfix' ? 'master' : 'develop'
    // "#42 Ajustar tela de login" vira feature/42-ajustar-tela-de-login.
    const branch = `${tipo}/${issue.numero}-${palavras(issue.titulo).slice(0, 6).join('-')}`

    const acao = ask(await p.select({
        message: 'Confirmar',
        options: [
            { value: 'tudo', label: `criar ${branch} e marcar #${issue.numero} "em andamento"`, hint: 'a marcacao vai para o GitHub' },
            { value: 'branch', label: `so criar ${branch}`, hint: 'nada vai para o GitHub' },
            { value: 'cancelar', label: 'cancelar' },
        ],
    }))
    if (acao === 'cancelar') return

    // Sem entrada (stdin ignorado): esses comandos nao perguntam nada, e um
    // filho que herda a entrada do menu pode travar no `git pull`.
    p.log.step(c.dim(`git checkout ${base} && git pull && git checkout -b ${branch}`))
    for (const args of [['checkout', base], ['pull'], ['checkout', '-b', branch]]) {
        if (await executar('git', args, { stdio: ['ignore', 'inherit', 'inherit'] }) !== 0) {
            return p.log.error(`Parou em: git ${args.join(' ')}`)
        }
    }
    p.log.success(`Branch ${branch} criada (so local; o push e com voce).`)

    if (acao === 'tudo') {
        try {
            garantirLabels(repo, [ANDAMENTO])
            gh(['issue', 'edit', String(issue.numero), '-R', repo, '--add-label', ANDAMENTO])
            p.log.success(`#${issue.numero} marcada como em andamento.`)
        } catch (err) {
            p.log.error(`Nao foi possivel marcar no GitHub: ${erroGh(err)}`)
        }
    }

    p.log.info([
        `Commits feitos com o gcom nesta branch ja levam "Refs ${repo}#${issue.numero}" e aparecem no painel.`,
        `"Closes ${repo}#${issue.numero}" na descricao da PR fecha a demanda quando ela for aceita.`,
    ].join('\n'))
}

export default {
    id: 'comecar',
    label: 'comecar',
    hint: 'cria a branch com o numero da demanda',
    async executar(repo) {
        const issue = await escolherIssue(repo, 'Comecar qual demanda?')
        if (issue) await comecar(repo, issue)
    },
}
