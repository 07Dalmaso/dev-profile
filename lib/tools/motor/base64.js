// Motor do Base64: codificar e decodificar (JSON decodificado sai formatado).
import { lerJson } from './json.js'

// Aceita o formato normal e o de URL (- e _), com ou sem o = do final.
export function decodificarBase64(texto) {
    const limpo = texto.replace(/\s+/g, '')
    if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(limpo)) return null
    return Buffer.from(limpo.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

// Bytes que nao sao UTF-8 valido nao voltam iguais depois de virar texto.
const ehTexto = (bytes) => Buffer.from(bytes.toString('utf8'), 'utf8').equals(bytes)

export const ACOES = [
    { value: 'decodificar', label: 'decodificar' },
    { value: 'codificar', label: 'codificar' },
    { value: 'url', label: 'codificar para URL', hint: 'sem + / =, usado em JWT e query string' },
]

// `entrada` e texto ou Buffer (arquivo). Devolve { saida, json? } |
// { binario: { bytes, hex } } | { erro }.
export function processar(acao, entrada) {
    const bytes = Buffer.isBuffer(entrada) ? entrada : Buffer.from(entrada, 'utf8')
    if (acao === 'codificar') return { saida: bytes.toString('base64') }
    if (acao === 'url') return { saida: bytes.toString('base64url') }

    const decodificado = decodificarBase64(bytes.toString('utf8'))
    if (!decodificado) return { erro: 'Isso nao e Base64 valido.' }
    if (!ehTexto(decodificado)) {
        return { binario: { bytes: decodificado.length, hex: decodificado.subarray(0, 64).toString('hex').match(/../g)?.join(' ') ?? '' } }
    }

    const texto = decodificado.toString('utf8')
    try {
        return { saida: JSON.stringify(lerJson(texto), null, 2), json: true }
    } catch {
        return { saida: texto }
    }
}
