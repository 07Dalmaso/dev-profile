// Base64: codificar e decodificar (JSON decodificado sai formatado).
import * as p from '@clack/prompts'
import { escolherTexto } from '../comum/entrada.js'
import { ask } from '../comum/prompts.js'
import { entregar } from '../comum/saida.js'
import { lerJson } from './json.js'

// Aceita o formato normal e o de URL (- e _), com ou sem o = do final.
export function decodificarBase64(texto) {
    const limpo = texto.replace(/\s+/g, '')
    if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(limpo)) return null
    return Buffer.from(limpo.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

// Bytes que nao sao UTF-8 valido nao voltam iguais depois de virar texto.
function ehTexto(bytes) {
    return Buffer.from(bytes.toString('utf8'), 'utf8').equals(bytes)
}

export default {
    id: 'base64',
    label: 'Base64',
    hint: 'codificar e decodificar',
    async executar() {
        const acao = ask(await p.select({
            message: 'Base64',
            options: [
                { value: 'decodificar', label: 'decodificar' },
                { value: 'codificar', label: 'codificar' },
                { value: 'url', label: 'codificar para URL', hint: 'sem + / =, usado em JWT e query string' },
            ],
        }))

        const texto = await escolherTexto('o texto')

        if (acao === 'codificar') return entregar(Buffer.from(texto, 'utf8').toString('base64'))
        if (acao === 'url') return entregar(Buffer.from(texto, 'utf8').toString('base64url'))

        const bytes = decodificarBase64(texto)
        if (!bytes) return p.log.error('Isso nao e Base64 valido.')

        if (!ehTexto(bytes)) {
            p.log.warn(`O conteudo e binario (${bytes.length} bytes), nao texto. Primeiros bytes em hex:`)
            return console.log(`\n${bytes.subarray(0, 64).toString('hex').match(/../g).join(' ')}\n`)
        }

        const decodificado = bytes.toString('utf8')
        let json
        try {
            json = JSON.stringify(lerJson(decodificado), null, 2)
        } catch {
            return entregar(decodificado)
        }
        p.log.info('O conteudo e JSON e saiu formatado.')
        entregar(json)
    },
}
