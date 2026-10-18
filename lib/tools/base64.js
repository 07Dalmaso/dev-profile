// Base64 no terminal: codificar e decodificar (JSON decodificado sai formatado).
// A logica fica em motor/base64.js (a mesma do DalmasoDev).
import * as p from '@clack/prompts'
import { escolherTexto } from '../comum/entrada.js'
import { ask } from '../comum/prompts.js'
import { entregar } from '../comum/saida.js'
import { ACOES, processar } from './motor/base64.js'

export default {
    id: 'base64',
    label: 'Base64',
    hint: 'codificar e decodificar',
    async executar() {
        const acao = ask(await p.select({ message: 'Base64', options: ACOES }))
        const resultado = processar(acao, await escolherTexto('o texto'))

        if (resultado.erro) return p.log.error(resultado.erro)
        if (resultado.binario) {
            p.log.warn(`O conteudo e binario (${resultado.binario.bytes} bytes), nao texto. Primeiros bytes em hex:`)
            return console.log(`\n${resultado.binario.hex}\n`)
        }
        if (resultado.json) p.log.info('O conteudo e JSON e saiu formatado.')
        entregar(resultado.saida)
    },
}
