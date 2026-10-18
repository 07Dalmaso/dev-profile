// Data / timestamp no terminal: Unix <-> data, formato MySQL, ISO e relativo.
// A logica fica em motor/data.js (a mesma do DalmasoDev).
import * as p from '@clack/prompts'
import { escolherTexto } from '../comum/entrada.js'
import { ask } from '../comum/prompts.js'
import { escolherECopiar } from '../comum/saida.js'
import { processar } from './motor/data.js'

export default {
    id: 'data',
    label: 'Data / timestamp',
    hint: 'unix <-> data, formato MySQL, relativo',
    async executar() {
        const origem = ask(await p.select({
            message: 'Data',
            options: [
                { value: 'converter', label: 'converter um valor', hint: '1729267200, 18/10/2026 14:30, 2026-10-18T17:30:00Z' },
                { value: 'agora', label: 'agora' },
            ],
        }))

        const resultado = processar(origem === 'agora' ? '' : await escolherTexto('a data ou timestamp'))
        if (resultado.erro) return p.log.error(resultado.erro)

        p.log.info(`Relativo: ${resultado.relativo}`)
        await escolherECopiar(resultado.formatos)
    },
}
