// Demandas = issues abertas do repositorio. Prioridade e projeto sao labels
// ("prioridade:alta", "projeto:loja") e "em andamento" marca o que foi comecado.
import * as p from '@clack/prompts'
import c from 'picocolors'
import { ask, caber } from '../../comum/prompts.js'
import { gh } from './gh.js'

export const PRIORIDADES = ['alta', 'media', 'baixa']
export const ANDAMENTO = 'em andamento'

const CORES = { 'prioridade:alta': 'b60205', 'prioridade:media': 'fbca04', 'prioridade:baixa': '0e8a16', [ANDAMENTO]: '5319e7' }
const COR_PROJETO = '1d76db'

export function normalizar(issue) {
    const nomes = issue.labels.map((label) => label.name)
    return {
        numero: issue.number,
        titulo: issue.title,
        url: issue.url,
        criada: new Date(issue.createdAt),
        prioridade: PRIORIDADES.find((pr) => nomes.includes(`prioridade:${pr}`)) ?? null,
        projeto: nomes.find((nome) => nome.startsWith('projeto:'))?.slice('projeto:'.length) ?? null,
        andamento: nomes.includes(ANDAMENTO),
    }
}

// Em andamento primeiro, depois por prioridade (sem prioridade no fim) e, no
// empate, a mais antiga primeiro.
function ordem(a, b) {
    const peso = (issue) => issue.prioridade ? PRIORIDADES.indexOf(issue.prioridade) : PRIORIDADES.length
    return (b.andamento - a.andamento) || (peso(a) - peso(b)) || (a.criada - b.criada)
}

export function abertas(repo) {
    const issues = gh(['issue', 'list', '-R', repo, '--state', 'open', '--limit', '200',
        '--json', 'number,title,labels,createdAt,url'], { json: true })
    return issues.map(normalizar).sort(ordem)
}

export function projetos(repo) {
    return gh(['label', 'list', '-R', repo, '--limit', '200', '--json', 'name'], { json: true })
        .map((label) => label.name)
        .filter((nome) => nome.startsWith('projeto:'))
        .map((nome) => nome.slice('projeto:'.length))
        .sort()
}

const COR_PRIORIDADE = { alta: c.red, media: c.yellow, baixa: c.green }

// "#42  alta  loja  Ajustar login  > em andamento", cortado na largura do terminal.
export function resumo(issue, reservado = 6) {
    const partes = [
        c.dim(`#${issue.numero}`),
        issue.prioridade ? COR_PRIORIDADE[issue.prioridade](issue.prioridade) : null,
        issue.projeto ? c.cyan(issue.projeto) : null,
    ].filter(Boolean)
    const extra = issue.andamento ? '  > em andamento' : ''
    const prefixo = `#${issue.numero}  ${issue.prioridade ?? ''}  ${issue.projeto ?? ''}  `.length
    return `${partes.join('  ')}  ${caber(issue.titulo, reservado + prefixo + extra.length)}${c.magenta(extra)}`
}

const VOLTAR = Symbol('voltar')

// Escolhe uma demanda aberta; null se nao houver ou se o usuario voltar.
// `filtro` limita a lista (ex.: so um projeto).
export async function escolherIssue(repo, message = 'Qual demanda?', filtro = () => true) {
    const lista = abertas(repo).filter(filtro)
    if (!lista.length) {
        p.log.info('Nenhuma demanda aberta aqui.')
        return null
    }
    const numero = ask(await p.select({
        message,
        maxItems: 12,
        options: [
            ...lista.map((issue) => ({ value: issue.numero, label: resumo(issue) })),
            { value: VOLTAR, label: 'voltar' },
        ],
    }))
    return numero === VOLTAR ? null : lista.find((issue) => issue.numero === numero)
}

// Label que ainda nao existe no repositorio e criada com a cor certa; --force
// so atualiza a cor se ja existir. Chamado so depois da confirmacao do usuario.
export function garantirLabels(repo, labels) {
    for (const label of labels) {
        gh(['label', 'create', label, '-R', repo, '--color', CORES[label] ?? COR_PROJETO, '--force'])
    }
}
