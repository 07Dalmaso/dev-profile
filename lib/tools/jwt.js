// JWT no terminal: decodificar o token, mostrar as datas e se esta expirado.
// A logica fica em motor/jwt.js (a mesma do DalmasoDev).
import * as p from '@clack/prompts'
import c from 'picocolors'
import { escolherTexto } from '../comum/entrada.js'
import { entregar } from '../comum/saida.js'
import { processar } from './motor/jwt.js'

export default {
    id: 'jwt',
    label: 'JWT',
    hint: 'decodificar token, ver expiracao',
    async executar() {
        const resultado = processar(await escolherTexto('o token'))
        if (resultado.erro) return p.log.error(resultado.erro)

        p.note(JSON.stringify(resultado.header, null, 2), 'Header')
        if (resultado.datas.length) {
            p.note(resultado.datas.map((d) => `${d.rotulo.padEnd(18)} ${d.local} ${c.dim(`(${d.relativo})`)}`).join('\n'), 'Datas')
        }
        if (resultado.expirado === true) p.log.error('Token EXPIRADO.')
        if (resultado.expirado === false) p.log.success('Token dentro da validade.')
        if (resultado.aindaNaoValido) p.log.warn('Token ainda nao e valido (nbf no futuro).')

        p.log.warn(c.dim('A assinatura nao e verificada: isso so le o conteudo.'))
        p.log.step('Payload')
        entregar(JSON.stringify(resultado.payload, null, 2))
    },
}
