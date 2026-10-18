// Saidas padrao dos menus: cancelar e erro fatal.
import * as p from '@clack/prompts'
import c from 'picocolors'

// Aborta limpo quando o usuario da Ctrl+C em qualquer prompt.
export function ask(value) {
    if (p.isCancel(value)) {
        p.cancel('Operacao cancelada.')
        process.exit(0)
    }
    return value
}

// Linha mais larga que o terminal quebra em duas, e o clack apaga uma linha so
// ao redesenhar: o menu comeca a duplicar. Corta com ... para caber, deixando
// `reservado` colunas para o que vem antes (marcador, nome, margem).
export function caber(texto, reservado = 0) {
    const maximo = Math.max(10, (process.stdout.columns || 80) - reservado)
    return texto.length > maximo ? `${texto.slice(0, maximo - 3)}...` : texto
}

export function sair(msg) {
    console.error(c.red(msg))
    process.exit(2)
}
