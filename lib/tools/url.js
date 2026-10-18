// URL no terminal: encode, decode e separar host, caminho e parametros.
// A logica fica em motor/url.js (a mesma do DalmasoDev).
import * as p from '@clack/prompts'
import c from 'picocolors'
import { escolherTexto } from '../comum/entrada.js'
import { ask } from '../comum/prompts.js'
import { entregar } from '../comum/saida.js'
import { ACOES, processar } from './motor/url.js'

export default {
    id: 'url',
    label: 'URL',
    hint: 'encode, decode, ver parametros',
    async executar() {
        const acao = ask(await p.select({ message: 'URL', options: ACOES }))
        const resultado = processar(acao, await escolherTexto('a URL ou texto'))

        if (resultado.erro) return p.log.error(resultado.erro)
        if (acao !== 'analisar') return entregar(resultado.saida)

        p.note(resultado.partes.map(([rotulo, valor]) => `${rotulo.padEnd(10)} ${valor}`).join('\n'), 'URL')
        if (!resultado.params) return p.log.info('Sem parametros na query string.')
        p.log.step(`Parametros ${c.dim('(ja decodificados)')}`)
        entregar(JSON.stringify(resultado.params, null, 2))
    },
}
