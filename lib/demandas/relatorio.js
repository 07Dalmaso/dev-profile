// Relatorio das demandas concluidas num periodo: gera um .md e um .html (para
// salvar em PDF) em Documentos\demandas. So le do GitHub.
import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { abrirNoEditor } from '../comum/editor.js'
import { ask } from '../comum/prompts.js'
import { abrirUrl } from './navegador.js'
import { html, markdown } from './suporte/documento.js'
import { erroGh, gh } from './suporte/gh.js'
import { normalizar, projetos } from './suporte/issues.js'
import { escolherPeriodo } from './suporte/periodo.js'
import { projetoDaPasta } from './suporte/projeto-atual.js'

const TODOS = Symbol('todos')

async function escolherProjeto(repo) {
    const nomes = projetos(repo)
    if (!nomes.length) return null
    const atual = projetoDaPasta(nomes)
    const escolha = ask(await p.select({
        message: 'Projeto',
        initialValue: atual ?? TODOS,
        maxItems: 12,
        options: [
            { value: TODOS, label: 'todos' },
            ...nomes.map((nome) => ({ value: nome, label: nome, hint: nome === atual ? 'esta pasta' : undefined })),
        ],
    }))
    return escolha === TODOS ? null : escolha
}

// Data local em aaaa-mm-dd, para a busca do GitHub (closed:de..ate).
const dataBusca = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`

// Fechadas como concluidas no periodo; "nao planejadas" ficam de fora. O
// ultimo comentario costuma ser o de conclusao (o que o concluir pede).
export function concluidas(repo, periodo, projeto) {
    const busca = [`closed:${dataBusca(periodo.de)}..${dataBusca(periodo.ate)}`, ...(projeto ? [`label:"projeto:${projeto}"`] : [])].join(' ')
    const issues = gh(['issue', 'list', '-R', repo, '--state', 'closed', '--limit', '1000', '--search', busca,
        '--json', 'number,title,labels,createdAt,closedAt,url,stateReason,comments'], { json: true })

    return issues
        .filter((issue) => issue.stateReason !== 'NOT_PLANNED')
        .map((issue) => ({
            ...normalizar(issue),
            concluida: new Date(issue.closedAt),
            observacao: issue.comments.at(-1)?.body ?? '',
        }))
        .sort((a, b) => a.concluida - b.concluida)
}

// Pasta Documentos real (pode estar no OneDrive), como no install.ps1.
function pastaDocumentos() {
    return execFileSync('powershell.exe', ['-NoProfile', '-Command', "[Environment]::GetFolderPath('MyDocuments')"], { encoding: 'utf8' }).trim()
}

export default {
    id: 'relatorio',
    label: 'relatorio de concluidas',
    hint: 'documento .md e PDF por periodo e projeto',
    async executar(repo) {
        const periodo = await escolherPeriodo()
        const projeto = await escolherProjeto(repo)

        let issues
        try {
            issues = concluidas(repo, periodo, projeto)
        } catch (err) {
            return p.log.error(`Nao foi possivel buscar as concluidas: ${erroGh(err)}`)
        }
        if (!issues.length) return p.log.info('Nenhuma demanda concluida nesse periodo.')

        const titulo = `Demandas concluidas${projeto ? ` - ${projeto}` : ''}`
        const dados = { titulo, periodo, projeto, issues }
        const pasta = join(pastaDocumentos(), 'demandas')
        const base = join(pasta, `relatorio-${periodo.nome}${projeto ? `-${projeto}` : ''}`)
        mkdirSync(pasta, { recursive: true })
        writeFileSync(`${base}.md`, markdown(dados))
        writeFileSync(`${base}.html`, html(dados))

        p.log.success(`${issues.length} concluida(s). Salvo em:\n${c.dim(`${base}.md\n${base}.html`)}`)

        while (true) {
            const acao = ask(await p.select({
                message: 'Abrir',
                options: [
                    { value: 'html', label: 'no navegador', hint: 'Ctrl+P salva como PDF' },
                    { value: 'md', label: 'o .md no editor', hint: 'para editar ou copiar' },
                    { value: 'pasta', label: 'a pasta' },
                    { value: 'pronto', label: 'pronto' },
                ],
            }))
            if (acao === 'pronto') return
            if (acao === 'html') abrirUrl(`${base}.html`)
            if (acao === 'md') abrirNoEditor([`${base}.md`])
            if (acao === 'pasta') spawn('explorer.exe', [pasta], { detached: true, stdio: 'ignore' }).unref()
        }
    },
}
