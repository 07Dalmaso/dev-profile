// Gerar no terminal: UUID, senha forte, token hex e APP_KEY do Laravel.
// A logica fica em motor/gerar.js (a mesma do DalmasoDev).
import * as p from '@clack/prompts'
import { ask } from '../comum/prompts.js'
import { entregar } from '../comum/saida.js'
import { limitesValidos, processar, TIPOS } from './motor/gerar.js'

async function pedirNumero(message, inicial, [min, max]) {
    return Number(ask(await p.text({
        message,
        initialValue: inicial,
        validate: (valor) => {
            if (!/^\d+$/.test(valor) || valor < min || valor > max) return `Use um numero entre ${min} e ${max}.`
        },
    })))
}

export default {
    id: 'gerar',
    label: 'Gerar',
    hint: 'UUID, senha, token, APP_KEY do Laravel',
    async executar() {
        const tipo = ask(await p.select({ message: 'Gerar', options: TIPOS }))
        const opcoes = {}
        if (tipo === 'senha') opcoes.tamanho = await pedirNumero('Tamanho', '20', limitesValidos.tamanho)
        if (tipo === 'uuid') opcoes.quantidade = await pedirNumero('Quantos?', '1', limitesValidos.quantidade)

        const resultado = processar(tipo, opcoes)
        if (resultado.erro) return p.log.error(resultado.erro)
        entregar(resultado.saida)
    },
}
