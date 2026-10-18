// URL: encode, decode e separar host, caminho e parametros.
import * as p from '@clack/prompts'
import c from 'picocolors'
import { escolherTexto } from '../comum/entrada.js'
import { ask } from '../comum/prompts.js'
import { entregar } from '../comum/saida.js'

function analisar(texto) {
    let url
    try {
        url = new URL(texto.trim())
    } catch {
        return p.log.error('URL invalida. Ela precisa ter o protocolo (https://...).')
    }

    const partes = [
        ['protocolo', url.protocol.replace(/:$/, '')],
        ['host', url.hostname],
        ['porta', url.port],
        ['caminho', decodeURIComponent(url.pathname)],
        ['ancora', url.hash.replace(/^#/, '')],
    ].filter(([, valor]) => valor)
    p.note(partes.map(([rotulo, valor]) => `${rotulo.padEnd(10)} ${valor}`).join('\n'), 'URL')

    // Chave repetida (filtro[]=a&filtro[]=b) vira lista.
    const params = {}
    for (const [chave, valor] of url.searchParams) {
        if (chave in params) params[chave] = [].concat(params[chave], valor)
        else params[chave] = valor
    }
    if (!Object.keys(params).length) return p.log.info('Sem parametros na query string.')

    p.log.step(`Parametros ${c.dim('(ja decodificados)')}`)
    entregar(JSON.stringify(params, null, 2))
}

export default {
    id: 'url',
    label: 'URL',
    hint: 'encode, decode, ver parametros',
    async executar() {
        const acao = ask(await p.select({
            message: 'URL',
            options: [
                { value: 'analisar', label: 'analisar URL', hint: 'host, caminho e parametros' },
                { value: 'decodificar', label: 'decodificar', hint: '%20 vira espaco' },
                { value: 'codificar', label: 'codificar', hint: 'para usar como valor de parametro' },
            ],
        }))

        const texto = await escolherTexto('a URL ou texto')

        if (acao === 'analisar') return analisar(texto)
        if (acao === 'codificar') return entregar(encodeURIComponent(texto))

        try {
            entregar(decodeURIComponent(texto))
        } catch {
            p.log.error('Texto com % invalido (ex.: um % sem dois digitos depois).')
        }
    },
}
