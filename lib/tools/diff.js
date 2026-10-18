// Comparar textos: menu para escolher os textos e o modo (o calculo fica em motor/diff.js).
import * as p from '@clack/prompts'
import c from 'picocolors'
import { abrirNoEditor, arquivoTemporario, esperarArquivos, temVsCode } from '../comum/editor.js'
import { escolherTexto, previa } from '../comum/entrada.js'
import { ask } from '../comum/prompts.js'
import { modoAuto, mostrar } from './suporte/diff-terminal.js'

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
