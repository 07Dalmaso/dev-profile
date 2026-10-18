// Mostrar o resultado de uma ferramenta e copiar para o clipboard.
import * as p from '@clack/prompts'
import c from 'picocolors'
import { copiar } from './clipboard.js'
import { ask } from './prompts.js'

function avisarCopia(texto) {
    if (copiar(texto)) p.log.success('Copiado para o clipboard.')
    else p.log.warn('Nao foi possivel copiar para o clipboard.')
}

// Resultado unico: mostra e ja copia.
export function entregar(texto) {
    console.log(`\n${texto}\n`)
    avisarCopia(texto)
}

const NAO_COPIAR = Symbol('nao copiar')

// Varios resultados ([rotulo, valor]): mostra todos e copia o escolhido.
export async function escolherECopiar(itens, message = 'Copiar qual?') {
    const largura = Math.max(...itens.map(([rotulo]) => rotulo.length))
    const curto = (valor) => valor.length > 70 ? `${valor.slice(0, 67)}...` : valor

    const valor = ask(await p.select({
        message,
        options: [
            ...itens.map(([rotulo, valor]) => ({ value: valor, label: `${rotulo.padEnd(largura)}  ${curto(valor)}` })),
            { value: NAO_COPIAR, label: c.dim('nao copiar') },
        ],
    }))

    if (valor !== NAO_COPIAR) avisarCopia(valor)
}
