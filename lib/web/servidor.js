// Servidor do DalmasoDev (demandas + ferramentas no navegador). Seguranca:
// - escuta so em 127.0.0.1 (nada na rede) e confere o Host (contra DNS rebinding);
// - toda rota /api exige a chave aleatoria da sessao no header X-Chave, que o
//   navegador recebe no #fragmento da URL (fragmento nao trafega em requisicao);
// - POST so com corpo JSON (Content-Type conferido) e ate 30 MB;
// - sem CORS: outro site aberto no navegador nao consegue ler as respostas;
// - CSP restrita: so os arquivos do proprio site, nenhum script de fora;
// - nada e enviado para fora: as ferramentas rodam aqui, e as demandas so leem
//   do GitHub pelo gh (credencial no Windows, nunca no navegador).
import { createServer } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { relatorio, rotas as rotasDemandas } from './demandas/rotas.js'
import { rotas as rotasFerramentas } from './ferramentas.js'

const SITE = join(dirname(fileURLToPath(import.meta.url)), 'site')

// So estes arquivos sao servidos (nada de caminho vindo da URL).
const ARQUIVOS = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/estilo.css': ['estilo.css', 'text/css; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
    '/comum.js': ['comum.js', 'text/javascript; charset=utf-8'],
    '/demandas.js': ['demandas.js', 'text/javascript; charset=utf-8'],
}

// Uma ferramenta do site por arquivo: /ferramentas/json.js. So nomes simples
// (letras, numeros, hifen) que existam na pasta.
function arquivoDeFerramenta(caminho) {
    const nome = /^\/ferramentas\/([a-z0-9-]+)\.js$/.exec(caminho)?.[1]
    if (!nome) return null
    const arquivo = join(SITE, 'ferramentas', `${nome}.js`)
    return existsSync(arquivo) ? arquivo : null
}

const ROTAS = [...rotasDemandas, ...rotasFerramentas]
const LIMITE = 30 * 1024 * 1024

export const CSP_SITE = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"

function responder(res, status, corpo, tipo, csp = CSP_SITE) {
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

function lerCorpo(req) {
    return new Promise((resolve, reject) => {
        const partes = []
        let tamanho = 0
        req.on('data', (parte) => {
            tamanho += parte.length
            if (tamanho > LIMITE) {
                reject(Object.assign(new Error('Entrada maior que 30 MB.'), { status: 413 }))
                req.destroy()
            } else {
                partes.push(parte)
            }
        })
        req.on('end', () => {
            try {
                resolve(JSON.parse(Buffer.concat(partes).toString('utf8') || '{}'))
            } catch {
                reject(Object.assign(new Error('JSON invalido na requisicao.'), { status: 400 }))
            }
        })
        req.on('error', reject)
    })
}

// `aba` escolhe a aba que abre primeiro (ex.: 'demandas', 'json').
export function iniciarServidor() {
    const chave = randomBytes(24).toString('hex')
    let porta

    const servidor = createServer(async (req, res) => {
        if (req.headers.host !== `127.0.0.1:${porta}`) return responder(res, 403, 'Host invalido', 'text/plain')
        const url = new URL(req.url, `http://127.0.0.1:${porta}`)

        try {
            if (req.method === 'GET' && ARQUIVOS[url.pathname]) {
                const [arquivo, tipo] = ARQUIVOS[url.pathname]
                return responder(res, 200, readFileSync(join(SITE, arquivo)), tipo)
            }
            const ferramenta = req.method === 'GET' && arquivoDeFerramenta(url.pathname)
            if (ferramenta) return responder(res, 200, readFileSync(ferramenta), 'text/javascript; charset=utf-8')
            // Relatorio abre numa aba nova (navegacao, sem header): usa bilhete.
            if (req.method === 'GET' && url.pathname === '/relatorio') {
                const { status, html, csp } = await relatorio(url)
                return responder(res, status, html, 'text/html; charset=utf-8', csp)
            }

            if (!url.pathname.startsWith('/api/')) return responder(res, 404, 'Nao encontrado', 'text/plain')
            if (!mesmaChave(req.headers['x-chave'], chave)) return json(res, 401, { erro: 'Chave da sessao invalida. Abra o DalmasoDev de novo pelo terminal.' })

            const rota = ROTAS.find((r) => r.metodo === req.method && r.caminho.test(url.pathname))
            if (!rota) return json(res, 404, { erro: 'Rota desconhecida.' })

            let corpo = {}
            if (req.method === 'POST') {
                if (!String(req.headers['content-type']).startsWith('application/json')) return json(res, 415, { erro: 'Envie JSON.' })
                corpo = await lerCorpo(req)
            }
            const resultado = await rota.executar({ url, corpo, parametros: rota.caminho.exec(url.pathname).slice(1) })
            return json(res, resultado.status ?? 200, resultado.json)
        } catch (err) {
            return json(res, err.status ?? 500, { erro: err.message })
        }
    })

    return new Promise((resolve, reject) => {
        servidor.once('error', reject)
        // Porta 0: o sistema escolhe uma livre.
        servidor.listen(0, '127.0.0.1', () => {
            porta = servidor.address().port
            resolve({
                url: (aba = '') => `http://127.0.0.1:${porta}/#k=${chave}${aba ? `&aba=${aba}` : ''}`,
                fechar: () => new Promise((fim) => {
                    servidor.closeAllConnections()
                    servidor.close(() => fim())
                }),
            })
        })
    })
}
