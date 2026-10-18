// JSON no terminal: formatar, minificar, ordenar chaves, validar, escapar.
// A logica fica em motor/json.js (a mesma do DalmasoDev).
import * as p from '@clack/prompts'
import c from 'picocolors'
import { escolherTexto } from '../comum/entrada.js'
import { ask } from '../comum/prompts.js'
import { entregar } from '../comum/saida.js'
import { ACOES, processar } from './motor/json.js'

// Linha do erro com um ^ embaixo.
function mostrarErro(erro) {
    if (erro.trecho === undefined) return p.log.error(erro.mensagem)
    p.log.error([erro.mensagem, c.dim(erro.detalhe), '', erro.trecho, `${' '.repeat(erro.seta)}${c.red('^')}`].join('\n'))
}

export default {
    id: 'json',
    label: 'JSON',
    hint: 'formatar, minificar, validar, escapar',
    async executar() {
        const acao = ask(await p.select({ message: 'JSON', options: ACOES }))
        const resultado = processar(acao, await escolherTexto('o JSON', { extensao: 'json' }))

        if (resultado.erro) return mostrarErro(resultado.erro)
        if (resultado.aviso) return p.log.warn(resultado.aviso)
        if (resultado.valido) return p.log.success(resultado.valido)
        entregar(resultado.saida)
    },
}
