// Texto no terminal: camelCase, snake_case, slug, sem acentos e contagem.
// A logica fica em motor/texto.js (a mesma do DalmasoDev).
import * as p from '@clack/prompts'
import { escolherTexto } from '../comum/entrada.js'
import { escolherECopiar } from '../comum/saida.js'
import { processar } from './motor/texto.js'

export default {
    id: 'texto',
    label: 'Texto',
    hint: 'camelCase, snake_case, slug, sem acentos, contagem',
    async executar() {
        const resultado = processar(await escolherTexto('o texto'))
        p.log.info(resultado.contagem)
        if (!resultado.formatos.length) return p.log.warn('Sem letras ou numeros para converter.')
        await escolherECopiar(resultado.formatos)
    },
}
