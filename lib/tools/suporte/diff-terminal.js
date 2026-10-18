// Desenha no terminal (cores ANSI) o resultado do motor do diff.
// Usado pela ferramenta diff (menu) e pelo comando diff-str (argumentos).
import c from 'picocolors'
import { comparar, visivel } from '../motor/diff.js'

export { modoAuto } from '../motor/diff.js'

// Trecho igual muito longo vira inicio...fim, para a diferenca nao se perder.
function encurtar(texto, limite = 120) {
    if (texto.length <= limite) return texto
    return `${texto.slice(0, 40)}${c.dim(` ...(${texto.length - 80} iguais)... `)}${texto.slice(-40)}`
}

function inline(partes) {
    return partes.map((parte) => {
        if (parte.tipo === 'rem') return c.red(c.strikethrough(visivel(parte.texto)))
        if (parte.tipo === 'add') return c.green(c.bold(visivel(parte.texto)))
        return encurtar(parte.texto)
    }).join('')
}

// No modo linha so o espaco do fim da linha fica marcado.
const marcarFinal = (linha) => linha.replace(/[ \t]+$/, (fim) => c.inverse(visivel(fim)))

function linha(item) {
    if (item.tipo === 'colapso') return c.cyan(`  ··· ${item.qtd} linhas iguais ···`)
    if (item.tipo === 'igual') return c.dim(`  ${item.texto}`)

    const cor = item.tipo === 'rem' ? c.red : c.green
    const prefixo = cor(item.tipo === 'rem' ? '- ' : '+ ')
    if (!item.partes) return cor(`${item.tipo === 'rem' ? '- ' : '+ '}${marcarFinal(item.texto)}`)

    // Linha pareada: so as palavras que mudaram ganham fundo.
    const fundo = item.tipo === 'rem' ? (t) => c.bgRed(c.white(t)) : (t) => c.bgGreen(c.black(t))
    return prefixo + item.partes.map((parte) => parte.mudou ? fundo(visivel(parte.texto)) : cor(parte.texto)).join('')
}

// Imprime o diff e devolve o resumo e o aviso, que cada modo mostra do seu jeito.
export function mostrar(a, b, modo) {
    const resultado = comparar(a, b, modo)
    const legenda = resultado.modo === 'linha'
        ? `${c.red('- so em A')}   ${c.green('+ so em B')}`
        : `${c.red(c.strikethrough('removido'))} so em A   ${c.green(c.bold('adicionado'))} so em B`

    console.log(`\n${c.dim(`modo ${resultado.modo} | `)}${legenda}\n`)
    console.log(resultado.linhas ? resultado.linhas.map(linha).join('\n') : inline(resultado.partes))
    console.log()

    return { texto: resultado.resumo.texto, aviso: resultado.aviso }
}
