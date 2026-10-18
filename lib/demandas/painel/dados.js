// Dados do painel, buscados pelo gh (com o login que ja existe). So leitura.
import { ghAsync } from '../suporte/gh.js'
import { normalizar } from '../suporte/issues.js'

const SEMANAS = 12
const DIA = 24 * 3600 * 1000

// Data local em aaaa-mm-dd, para a busca do GitHub.
export const dataBusca = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`

const paraJson = (issue) => ({ ...issue, criada: issue.criada.toISOString() })

async function abertas(repo) {
    const issues = await ghAsync(['issue', 'list', '-R', repo, '--state', 'open', '--limit', '500',
        '--json', 'number,title,labels,createdAt,url'], { json: true })
    return issues.map(normalizar).map(paraJson)
}

// Concluidas (sem as "nao planejadas") desde uma data: base do grafico semanal.
async function concluidasDesde(repo, desde) {
    const issues = await ghAsync(['issue', 'list', '-R', repo, '--state', 'closed', '--limit', '1000',
        '--search', `closed:>=${dataBusca(desde)}`,
        '--json', 'number,title,labels,createdAt,closedAt,url,stateReason'], { json: true })
    return issues
        .filter((issue) => issue.stateReason !== 'NOT_PLANNED')
        .map((issue) => ({ ...paraJson(normalizar(issue)), concluida: issue.closedAt }))
}

export async function painel(repo) {
    const desde = new Date(Date.now() - SEMANAS * 7 * DIA)
    const [lista, concluidas] = await Promise.all([abertas(repo), concluidasDesde(repo, desde)])
    return { repo, atualizado: new Date().toISOString(), abertas: lista, concluidas }
}

// https://api.github.com/repos/dono/repo/commits/sha -> https://github.com/dono/repo/commit/sha
const urlDoCommit = (api) => api?.replace('https://api.github.com/repos/', 'https://github.com/').replace('/commits/', '/commit/')

// Linha do tempo da demanda ligada ao codigo: commits que citam a issue, PRs e
// issues que referenciam, quando comecou e quando fechou.
function eventos(timeline) {
    return timeline.flatMap((ev) => {
        const data = ev.created_at ?? ev.committer?.date ?? null
        if (ev.event === 'referenced' && ev.commit_id) {
            return [{ tipo: 'commit', data, sha: ev.commit_id, url: urlDoCommit(ev.commit_url), api: ev.commit_url }]
        }
        if (ev.event === 'cross-referenced' && ev.source?.issue) {
            const origem = ev.source.issue
            return [{
                tipo: origem.pull_request ? 'pr' : 'issue',
                data,
                numero: origem.number,
                titulo: origem.title,
                url: origem.html_url,
                repo: origem.repository?.full_name ?? '',
                estado: origem.pull_request?.merged_at ? 'merged' : origem.state,
            }]
        }
        if (ev.event === 'labeled' && ev.label?.name === 'em andamento') return [{ tipo: 'comecou', data }]
        if (ev.event === 'closed') return [{ tipo: 'fechada', data }]
        if (ev.event === 'reopened') return [{ tipo: 'reaberta', data }]
        return []
    })
}

// Mensagem do commit (a timeline so traz o sha). Ate 20, em paralelo; se o
// repositorio do commit nao for acessivel, fica sem mensagem.
async function comMensagens(itens) {
    const commits = itens.filter((item) => item.tipo === 'commit').slice(0, 20)
    await Promise.all(commits.map(async (commit) => {
        try {
            const caminho = commit.api.replace('https://api.github.com/', '')
            commit.mensagem = (await ghAsync(['api', caminho, '--jq', '.commit.message'])).split('\n')[0]
        } catch {
            commit.mensagem = null
        }
    }))
    return itens.map(({ api, ...resto }) => resto)
}

export async function demanda(repo, numero) {
    const [dados, paginas] = await Promise.all([
        ghAsync(['issue', 'view', String(numero), '-R', repo, '--json', 'number,title,body,comments,createdAt,closedAt,state,labels,url'], { json: true }),
        ghAsync(['api', `repos/${repo}/issues/${numero}/timeline`, '--paginate', '--slurp'], { json: true }),
    ])
    return {
        ...paraJson(normalizar(dados)),
        estado: dados.state,
        corpo: dados.body ?? '',
        comentarios: dados.comments.map((comentario) => ({ autor: comentario.author?.login ?? '', data: comentario.createdAt, texto: comentario.body })),
        linhaDoTempo: await comMensagens(eventos(paginas.flat())),
    }
}
