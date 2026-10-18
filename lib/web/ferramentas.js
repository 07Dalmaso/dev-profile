// Rotas das ferramentas no DalmasoDev: POST /api/ferramentas/<id> chama o
// mesmo motor que o terminal usa. Tudo roda aqui; nada sai do computador.
// Ferramenta nova no site: uma linha em MOTORES e um arquivo em site/ferramentas/.
import { lerConfig } from '../comum/config.js'
import { FERRAMENTAS } from '../tools/index.js'
import { comparar } from '../tools/motor/diff.js'
import { processar as base64 } from '../tools/motor/base64.js'
import { processar as data } from '../tools/motor/data.js'
import { gerar as gerarDocumento, validar as validarDocumento } from '../tools/motor/documento.js'
import { processar as gerar } from '../tools/motor/gerar.js'
import { processar as hash } from '../tools/motor/hash.js'
import { processar as json } from '../tools/motor/json.js'
import { processar as jwt } from '../tools/motor/jwt.js'
import { processar as texto } from '../tools/motor/texto.js'
import { processar as url } from '../tools/motor/url.js'

// Arquivo arrastado chega em base64 (bytes exatos); texto chega como texto.
const entrada = (corpo) => corpo.arquivo ? Buffer.from(corpo.arquivo, 'base64') : String(corpo.texto ?? '')

const MOTORES = {
    diff: (c) => comparar(String(c.a ?? ''), String(c.b ?? ''), c.modo ?? 'auto'),
    json: (c) => json(c.acao, String(c.texto ?? '')),
    base64: (c) => base64(c.acao, entrada(c)),
    jwt: (c) => jwt(String(c.texto ?? '')),
    url: (c) => url(c.acao, String(c.texto ?? '')),
    data: (c) => data(String(c.texto ?? '')),
    hash: (c) => ({ hashes: hash(entrada(c)) }),
    // Sem tamanho/quantidade, valem os padroes do motor (20 e 1).
    gerar: (c) => gerar(c.tipo, {
        ...(c.tamanho !== undefined && { tamanho: Number(c.tamanho) }),
        ...(c.quantidade !== undefined && { quantidade: Number(c.quantidade) }),
    }),
    texto: (c) => texto(String(c.texto ?? '')),
    documento: (c) => c.acao === 'validar' ? validarDocumento(c.texto) : gerarDocumento(c.acao),
}

export const rotas = [
    // O site esconde o que foi desativado no dev > configurar, como o terminal.
    {
        metodo: 'GET',
        caminho: /^\/api\/config$/,
        // `ferramentas`: a lista oficial (lib/tools/index.js), na ordem do menu.
        executar: () => {
            const { desativados } = lerConfig()
            return { json: { desativados, ferramentas: FERRAMENTAS.map((f) => f.id) } }
        },
    },
    {
        metodo: 'POST',
        caminho: /^\/api\/ferramentas\/([a-z0-9]+)$/,
        executar: ({ parametros, corpo }) => {
            const motor = MOTORES[parametros[0]]
            if (!motor) return { status: 404, json: { erro: 'Ferramenta desconhecida.' } }
            return { json: motor(corpo) }
        },
    },
]
