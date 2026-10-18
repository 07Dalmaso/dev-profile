// Servidor do painel. Seguranca:
// - escuta so em 127.0.0.1 (nada na rede) e confere o Host (contra DNS rebinding);
// - toda rota /api exige a chave aleatoria da sessao no header X-Chave, que o
//   navegador recebe no #fragmento da URL (fragmento nao trafega em requisicao);
// - sem CORS: outro site aberto no navegador nao consegue ler as respostas;
// - CSP restrita: so os arquivos do proprio painel, nenhum script de fora;
// - so leitura: nao ha rota que altere nada no GitHub;
// - a credencial e a do gh, que fica no Windows e nunca chega ao navegador.
import { createServer } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { concluidas } from '../relatorio.js'
import { html as documentoHtml } from '../suporte/documento.js'
import { erroGh } from '../suporte/gh.js'
import { projetoDaPasta } from '../suporte/projeto-atual.js'
import { demanda, painel } from './dados.js'

const WEB = join(dirname(fileURLToPath(import.meta.url)), 'web')
const ARQUIVOS = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
    '/painel.css': ['painel.css', 'text/css; charset=utf-8'],
}

const CSP_PAINEL = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
// O relatorio e o mesmo HTML do terminal: estilo embutido e nenhum script.
const CSP_RELATORIO = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"

function responder(res, status, corpo, tipo, csp = CSP_PAINEL) {
    res.writeHead(status, {
        'Content-Type': tipo,
        'Content-Security-Policy': csp,
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store',
    })
    res.end(corpo)
}

const json = (res, status, dados) => responder(res, status, JSON.stringify(dados), 'application/json; charset=utf-8')

function mesmaChave(recebida, chave) {
    const a = Buffer.from(String(recebida ?? ''))
    const b = Buffer.from(chave)
    return a.length === b.length && timingSafeEqual(a, b)
}

// aaaa-mm-dd local
function lerData(texto, fimDoDia) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto ?? '')
    if (!m) return null
    return fimDoDia ? new Date(m[1], m[2] - 1, m[3], 23, 59, 59) : new Date(m[1], m[2] - 1, m[3])
}

export function iniciarPainel(repo) {
    const chave = randomBytes(24).toString('hex')
    // O relatorio abre numa aba nova (navegacao, sem header): usa um bilhete
    // de uso unico que vale 60s, pedido pela API com a chave.
    const bilhetes = new Map()
    let porta

    const servidor = createServer(async (req, res) => {
        if (req.headers.host !== `127.0.0.1:${porta}`) return responder(res, 403, 'Host invalido', 'text/plain')
        if (req.method !== 'GET') return responder(res, 405, 'Metodo nao permitido', 'text/plain')

        const url = new URL(req.url, `http://127.0.0.1:${porta}`)
        try {
            if (ARQUIVOS[url.pathname]) {
                const [arquivo, tipo] = ARQUIVOS[url.pathname]
                return responder(res, 200, readFileSync(join(WEB, arquivo)), tipo)
            }

            if (url.pathname === '/relatorio') {
                const bilhete = bilhetes.get(url.searchParams.get('b'))
                bilhetes.delete(url.searchParams.get('b'))
                if (!bilhete || bilhete < Date.now()) return responder(res, 403, 'Link expirado: gere de novo no painel.', 'text/plain; charset=utf-8')
                const de = lerData(url.searchParams.get('de'), false)
                const ate = lerData(url.searchParams.get('ate'), true)
                if (!de || !ate) return responder(res, 400, 'Periodo invalido.', 'text/plain; charset=utf-8')
                const projeto = url.searchParams.get('projeto') || null
                const periodo = { de, ate }
                const documento = documentoHtml({
                    titulo: `Demandas concluidas${projeto ? ` - ${projeto}` : ''}`,
                    periodo,
                    projeto,
                    issues: concluidas(repo, periodo, projeto),
                })
                return responder(res, 200, documento, 'text/html; charset=utf-8', CSP_RELATORIO)
            }

            if (!url.pathname.startsWith('/api/')) return responder(res, 404, 'Nao encontrado', 'text/plain')
            if (!mesmaChave(req.headers['x-chave'], chave)) return json(res, 401, { erro: 'Chave da sessao invalida. Abra o painel de novo pelo terminal.' })

            if (url.pathname === '/api/painel') {
                const nomes = []
                const dados = await painel(repo)
                for (const issue of dados.abertas) if (issue.projeto) nomes.push(issue.projeto)
                return json(res, 200, { ...dados, projetoDaPasta: projetoDaPasta([...new Set(nomes)]) })
            }
            const numero = /^\/api\/demanda\/(\d+)$/.exec(url.pathname)?.[1]
            if (numero) return json(res, 200, await demanda(repo, Number(numero)))
            if (url.pathname === '/api/bilhete') {
                const bilhete = randomBytes(16).toString('hex')
                bilhetes.set(bilhete, Date.now() + 60_000)
                return json(res, 200, { bilhete })
            }
            return json(res, 404, { erro: 'Rota desconhecida.' })
        } catch (err) {
            return json(res, 500, { erro: erroGh(err) })
        }
    })

    return new Promise((resolve, reject) => {
        servidor.once('error', reject)
        // Porta 0: o sistema escolhe uma livre.
        servidor.listen(0, '127.0.0.1', () => {
            porta = servidor.address().port
            resolve({
                url: `http://127.0.0.1:${porta}/#k=${chave}`,
                fechar: () => new Promise((fim) => {
                    servidor.closeAllConnections()
                    servidor.close(() => fim())
                }),
            })
        })
    })
}
