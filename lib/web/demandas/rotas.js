// Rotas das demandas no DalmasoDev. So leitura: nada aqui altera o GitHub.
import { randomBytes } from 'node:crypto'
import { erroGh, ghInstalado, ghLogado } from '../../demandas/suporte/gh.js'
import { projetoDaPasta } from '../../demandas/suporte/projeto-atual.js'
import { repoSalvo } from '../../demandas/suporte/repo.js'
import { concluidas } from '../../demandas/relatorio.js'
import { html as documentoHtml } from '../../demandas/suporte/documento.js'
import { demanda, painel } from './dados.js'

// O repositorio e lido a cada pedido: configurar no terminal vale sem reabrir.
function repo() {
    if (!ghInstalado() || !ghLogado()) throw Object.assign(new Error('O GitHub CLI nao esta instalado ou logado. Rode demandas no terminal para ver o passo a passo.'), { status: 409 })
    const salvo = repoSalvo()
    if (!salvo) throw Object.assign(new Error('Demandas ainda nao configuradas. Rode demandas no terminal e informe o repositorio.'), { status: 409 })
    return salvo
}

// Erro do gh vira mensagem curta.
async function comGh(fn) {
    try {
        return await fn()
    } catch (err) {
        if (err.status) throw err
        throw new Error(erroGh(err))
    }
}

// O relatorio abre numa aba nova: bilhete de uso unico que vale 60s, pedido
// pela API (com a chave).
const bilhetes = new Map()

export const rotas = [
    {
        metodo: 'GET',
        caminho: /^\/api\/demandas\/painel$/,
        executar: () => comGh(async () => {
            const dados = await painel(repo())
            const nomes = [...new Set(dados.abertas.map((issue) => issue.projeto).filter(Boolean))]
            return { json: { ...dados, projetoDaPasta: projetoDaPasta(nomes) } }
        }),
    },
    {
        metodo: 'GET',
        caminho: /^\/api\/demandas\/(\d+)$/,
        executar: ({ parametros }) => comGh(async () => ({ json: await demanda(repo(), Number(parametros[0])) })),
    },
    {
        metodo: 'GET',
        caminho: /^\/api\/demandas\/bilhete$/,
        executar: () => {
            const bilhete = randomBytes(16).toString('hex')
            bilhetes.set(bilhete, Date.now() + 60_000)
            return { json: { bilhete } }
        },
    },
]

// aaaa-mm-dd local
function lerData(texto, fimDoDia) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto ?? '')
    if (!m) return null
    return fimDoDia ? new Date(m[1], m[2] - 1, m[3], 23, 59, 59) : new Date(m[1], m[2] - 1, m[3])
}

// O documento e o mesmo HTML do terminal: estilo embutido e nenhum script.
const CSP_RELATORIO = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
const texto = (status, mensagem) => ({ status, html: mensagem, csp: CSP_RELATORIO })

export async function relatorio(url) {
    const bilhete = url.searchParams.get('b')
    const validade = bilhetes.get(bilhete)
    bilhetes.delete(bilhete)
    if (!validade || validade < Date.now()) return texto(403, 'Link expirado: gere de novo no DalmasoDev.')

    const de = lerData(url.searchParams.get('de'), false)
    const ate = lerData(url.searchParams.get('ate'), true)
    if (!de || !ate) return texto(400, 'Periodo invalido.')

    const projeto = url.searchParams.get('projeto') || null
    const periodo = { de, ate }
    const html = await comGh(async () => documentoHtml({
        titulo: `Demandas concluidas${projeto ? ` - ${projeto}` : ''}`,
        periodo,
        projeto,
        issues: concluidas(repo(), periodo, projeto),
    }))
    return { status: 200, html, csp: CSP_RELATORIO }
}
