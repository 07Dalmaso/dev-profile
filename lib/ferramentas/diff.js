import * as p from '@clack/prompts'
import c from 'picocolors'
import { diffChars, diffLines, diffWordsWithSpace } from 'diff'
import { abrirNoEditor, arquivoTemporario, ask, escolherTexto, esperarArquivos, previa, temVsCode } from '../ui.js'

// Linhas de contexto mantidas em volta de cada mudanca no modo linha.
const CONTEXTO = 3

export function modoAuto(a, b) {
    if (/\n/.test(a + b)) return 'linha'
    if (/\s/.test(a + b)) return 'palavra'
    return 'char'
}

// Espaco, tab, quebra e caracteres invisiveis ficam visiveis nos trechos
// alterados; sem isso, uma diferenca so de espaco nao aparece na tela.
function visivel(texto) {
    return texto.replace(/\r\n|[ \t\r\n ​-‍﻿]/g, (ch) => ({
        ' ': '·', '\t': '→', '\r': '␍', '\n': '↵\n', '\r\n': '␍↵\n', ' ': '⍽',
    })[ch] ?? '⌀')
}

// Trecho igual muito longo vira inicio...fim, para a diferenca nao se perder.
function encurtar(texto, limite = 120) {
    if (texto.length <= limite) return texto
    return `${texto.slice(0, 40)}${c.dim(` ...(${texto.length - 80} iguais)... `)}${texto.slice(-40)}`
}

function renderInline(partes) {
    return partes.map((parte) => {
        if (parte.removed) return c.red(c.strikethrough(visivel(parte.value)))
        if (parte.added) return c.green(c.bold(visivel(parte.value)))
        return encurtar(parte.value)
    }).join('')
}

// Sem o \r: em arquivo CRLF ele marcaria toda linha; CRLF x LF sai na dica.
function linhas(valor) {
    const lista = valor.split(/\r?\n/)
    if (lista.at(-1) === '') lista.pop()
    return lista
}

// No modo linha so o espaco do fim da linha fica marcado.
function marcarFinal(linha) {
    return linha.replace(/[ \t]+$/, (fim) => c.inverse(visivel(fim)))
}

// Linha alterada vs nova: destaca so as palavras que mudaram dentro dela.
function renderPar(antes, depois) {
    const partes = diffWordsWithSpace(antes, depois)
    const menos = partes.filter((parte) => !parte.added)
        .map((parte) => parte.removed ? c.bgRed(c.white(visivel(parte.value))) : c.red(parte.value)).join('')
    const mais = partes.filter((parte) => !parte.removed)
        .map((parte) => parte.added ? c.bgGreen(c.black(visivel(parte.value))) : c.green(parte.value)).join('')
    return [c.red('- ') + menos, c.green('+ ') + mais]
}

function caracteresIguais(partes) {
    return partes.reduce((soma, parte) => soma + (parte.added || parte.removed ? 0 : parte.value.length), 0)
}

// Metade ou mais dos caracteres em comum: vale destacar so o que mudou.
function parecidas(a, b) {
    return 2 * caracteresIguais(diffChars(a, b)) / (a.length + b.length || 1) >= 0.5
}

function renderLinhas(partes) {
    const saida = []

    for (let i = 0; i < partes.length; i++) {
        const parte = partes[i]
        const atuais = linhas(parte.value)

        if (!parte.added && !parte.removed) {
            const iguais = atuais.map((linha) => c.dim(`  ${linha}`))
            const cabeca = i === 0 ? 0 : CONTEXTO
            const cauda = i === partes.length - 1 ? 0 : CONTEXTO

            if (iguais.length <= cabeca + cauda + 1) {
                saida.push(...iguais)
            } else {
                saida.push(...iguais.slice(0, cabeca))
                saida.push(c.cyan(`  ··· ${iguais.length - cabeca - cauda} linhas iguais ···`))
                saida.push(...iguais.slice(iguais.length - cauda))
            }
        } else if (parte.removed && partes[i + 1]?.added) {
            // Removido seguido de adicionado: cada linha removida pareia, em
            // ordem, com a proxima linha nova parecida; o resto sai inteiro.
            const novas = linhas(partes[++i].value)
            const menos = atuais.map((linha) => c.red(`- ${marcarFinal(linha)}`))
            const mais = novas.map((linha) => c.green(`+ ${marcarFinal(linha)}`))
            let k = 0

            atuais.forEach((linha, j) => {
                const par = novas.findIndex((nova, n) => n >= k && parecidas(linha, nova))
                if (par === -1) return
                [menos[j], mais[par]] = renderPar(linha, novas[par])
                k = par + 1
            })
            saida.push(...menos, ...mais)
        } else if (parte.removed) {
            saida.push(...atuais.map((linha) => c.red(`- ${marcarFinal(linha)}`)))
        } else {
            saida.push(...atuais.map((linha) => c.green(`+ ${marcarFinal(linha)}`)))
        }
    }

    return saida.join('\n')
}

// Removido seguido de adicionado conta como uma diferenca so (uma troca).
function resumo(partes, a, b) {
    const diferencas = partes.filter((parte, i) =>
        (parte.added || parte.removed) && !(parte.added && partes[i - 1]?.removed)).length

    // No modo linha, uma linha com um caractere trocado contaria como toda
    // diferente; refaz por caractere se o texto nao for grande demais.
    const base = partes.length && a.length + b.length < 200_000 ? diffChars(a, b) : partes

    // floor: nunca mostra 100% para textos que sao diferentes.
    const similaridade = Math.floor((2 * caracteresIguais(base) / (a.length + b.length)) * 100)
    return `${diferencas} diferenca${diferencas > 1 ? 's' : ''}, ${similaridade}% iguais`
}

// Diferencas que enganam porque os textos parecem iguais na tela.
function dica(a, b) {
    const etapas = [
        ['quebra de linha (CRLF x LF)', (t) => t.replace(/\r\n/g, '\n')],
        ['caracteres invisiveis', (t) => t.replace(/[​-‍﻿]/g, '')],
        ['espacos em branco', (t) => t.replace(/\s+/g, ' ').trim()],
        ['maiusculas/minusculas', (t) => t.toLowerCase()],
    ]
    const motivos = []

    for (const [nome, normalizar] of etapas) {
        const [x, y] = [normalizar(a), normalizar(b)]
        if (x !== a || y !== b) motivos.push(nome)
        a = x
        b = y
        if (a === b) return `So diferem em: ${motivos.join(', ')}`
    }
}

// Imprime o diff e devolve o resumo e a dica, que cada modo mostra do seu jeito.
export function mostrar(a, b, modo) {
    const partes = modo === 'linha' ? diffLines(a, b)
        : modo === 'palavra' ? diffWordsWithSpace(a, b)
        : diffChars(a, b)

    const legenda = modo === 'linha'
        ? `${c.red('- so em A')}   ${c.green('+ so em B')}`
        : `${c.red(c.strikethrough('removido'))} so em A   ${c.green(c.bold('adicionado'))} so em B`

    console.log(`\n${c.dim(`modo ${modo} | `)}${legenda}\n`)
    console.log(modo === 'linha' ? renderLinhas(partes) : renderInline(partes))
    console.log()

    return { texto: resumo(partes, a, b), aviso: dica(a, b) }
}

async function escolherModo(a, b) {
    const sugerido = modoAuto(a, b)
    const hint = (modo, texto) => modo === sugerido ? `${texto} (recomendado)` : texto

    return ask(await p.select({
        message: 'Comparar por',
        initialValue: sugerido,
        options: [
            { value: 'linha', label: 'linha', hint: hint('linha', 'SQL, JSON, codigo, configs') },
            { value: 'palavra', label: 'palavra', hint: hint('palavra', 'frases e textos') },
            { value: 'char', label: 'caractere', hint: hint('char', 'tokens, hashes, URLs') },
        ],
    }))
}

const NOMES = ['texto-A.txt', 'texto-B.txt']

// Abre texto-A e texto-B em branco no editor e espera o usuario colar os dois.
async function colarDois() {
    const arquivos = NOMES.map((nome) => arquivoTemporario(nome))
    abrirNoEditor(arquivos)
    p.log.info(`Abri ${NOMES.join(' e ')} no editor.`)
    const [a, b] = await esperarArquivos(arquivos)
    return { a, b, arquivos }
}

async function escolherTextos() {
    const como = ask(await p.select({
        message: 'Como quer informar os textos?',
        options: [
            { value: 'colar', label: 'colar em dois arquivos novos', hint: 'abre texto-A e texto-B no editor' },
            { value: 'cada', label: 'escolher a origem de cada um', hint: 'clipboard, arquivo existente, digitar' },
        ],
    }))
    if (como === 'colar') return colarDois()

    const a = await escolherTexto('o texto A')
    return { a, b: await escolherTexto('o texto B', { anterior: a }), arquivos: null }
}

// Escolhe os textos e o modo, mostra o diff e deixa trocar o modo ou um dos
// textos sem comecar de novo. `a` ja vem preenchido no `diff-str -c`.
export async function comparar({ a, modo = null, sair = 'sair' } = {}) {
    let b
    // [A, B] quando os textos foram colados em arquivos novos: da para editar
    // e comparar de novo.
    let arquivos = null

    if (a) {
        p.log.info(`A (clipboard): ${previa(a)}`)
        b = await escolherTexto('o texto B', { anterior: a })
    } else {
        ({ a, b, arquivos } = await escolherTextos())
    }

    let escolhido = modo
    let exibir = true

    while (true) {
        const iguais = a === b
        if (!exibir) {
            exibir = true
        } else if (iguais) {
            p.log.success('Textos identicos.')
        } else {
            escolhido ??= await escolherModo(a, b)
            const { texto, aviso } = mostrar(a, b, escolhido)
            if (aviso) p.log.warn(aviso)
            p.log.message(texto)
        }

        const proxima = ask(await p.select({
            message: 'E agora?',
            options: [
                ...(arquivos ? [{ value: 'editar', label: 'editar os textos e comparar de novo', hint: NOMES.join(' e ') }] : []),
                ...(iguais ? [] : [{ value: 'modo', label: 'comparar por outro modo' }]),
                ...(temVsCode() ? [{ value: 'vscode', label: 'abrir no diff do VS Code', hint: 'lado a lado' }] : []),
                { value: 'b', label: 'trocar o texto B', hint: 'mesmo A, nova versao' },
                { value: 'nova', label: 'nova comparacao' },
                { value: 'sair', label: sair },
            ],
        }))

        switch (proxima) {
            case 'sair':
                return
            case 'editar':
                abrirNoEditor(arquivos)
                ;[a, b] = await esperarArquivos(arquivos)
                break
            case 'modo':
                escolhido = await escolherModo(a, b)
                break
            case 'vscode':
                // Textos que nao vieram de arquivo vao para os temporarios.
                abrirNoEditor(arquivos ?? NOMES.map((nome, i) => arquivoTemporario(nome, [a, b][i])), ['--diff'])
                exibir = false
                break
            case 'b':
                b = await escolherTexto('o texto B', { anterior: a })
                arquivos = null
                escolhido = modo
                break
            case 'nova':
                ({ a, b, arquivos } = await escolherTextos())
                escolhido = modo
                break
        }
    }
}

export default {
    id: 'diff',
    label: 'Comparar textos',
    hint: 'diferenca entre dois textos ou arquivos',
    executar: () => comparar({ sair: 'voltar ao menu' }),
}
