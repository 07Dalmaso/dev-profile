// CPF / CNPJ no terminal: gerar para teste e validar (inclusive CNPJ alfanumerico).
// A logica fica em motor/documento.js (a mesma do DalmasoDev).
import * as p from '@clack/prompts'
import { ask } from '../comum/prompts.js'
import { escolherECopiar } from '../comum/saida.js'
import { gerar, validar } from './motor/documento.js'

export default {
    id: 'documento',
    label: 'CPF / CNPJ',
    hint: 'gerar para teste e validar',
    async executar() {
        const acao = ask(await p.select({
            message: 'CPF / CNPJ',
            options: [
                { value: 'cpf', label: 'gerar CPF' },
                { value: 'cnpj', label: 'gerar CNPJ' },
                { value: 'validar', label: 'validar', hint: 'CPF ou CNPJ, com ou sem mascara' },
            ],
        }))

        if (acao === 'validar') {
            const resultado = validar(ask(await p.text({ message: 'CPF ou CNPJ' })))
            if (resultado.erro) return p.log.error(resultado.erro)
            if (resultado.ok) p.log.success(`${resultado.tipo} valido: ${resultado.formatado}`)
            else p.log.error(`${resultado.tipo} INVALIDO: ${resultado.formatado}`)
            return
        }

        const { mascarado, numeros } = gerar(acao)
        p.log.info('Documento valido so na conta, para testes: nao pertence a ninguem de verdade.')
        await escolherECopiar([['com mascara', mascarado], ['so numeros', numeros]])
    },
}
