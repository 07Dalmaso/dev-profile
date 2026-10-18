// Motor do diff: calcula a diferenca entre dois textos numa estrutura neutra.
// O terminal (suporte/diff-terminal.js) e o site (DalmasoDev) desenham a
// partir dela, cada um do seu jeito.
import { diffChars, diffLines, diffWordsWithSpace } from 'diff'

// Linhas de contexto mantidas em volta de cada mudanca no modo linha.
const CONTEXTO = 3

export function modoAuto(a, b) {
    if (/\n/.test(a + b)) return 'linha'
    if (/\s/.test(a + b)) return 'palavra'
    return 'char'
}

// Espaco, tab, quebra e caracteres invisiveis ficam visiveis nos trechos
// alterados; sem isso, uma diferenca so de espaco nao aparece na tela.
export function visivel(texto) {
    return texto.replace(/\r\n|[ \t\r\n ​-‍﻿]/g, (ch) => ({
        ' ': '·', '\t': '→', '\r': '␍', '\n': '↵\n', '\r\n': '␍↵\n', ' ': '⍽',
    })[ch] ?? '⌀')
}

const tipo = (parte) => parte.added ? 'add' : parte.removed ? 'rem' : 'igual'

// Sem o \r: em arquivo CRLF ele marcaria toda linha; CRLF x LF sai no aviso.
function separarLinhas(valor) {
    const lista = valor.split(/\r?\n/)
    if (lista.at(-1) === '') lista.pop()
    return lista
}

function caracteresIguais(partes) {
    return partes.reduce((soma, parte) => soma + (parte.added || parte.removed ? 0 : parte.value.length), 0)
}

// Metade ou mais dos caracteres em comum: vale destacar so o que mudou.
function parecidas(a, b) {
    return 2 * caracteresIguais(diffChars(a, b)) / (a.length + b.length || 1) >= 0.5
}

// Linha alterada vs nova: as palavras que mudaram dentro de cada uma.
function par(antes, depois) {
    const partes = diffWordsWithSpace(antes, depois)
    return [
        { tipo: 'rem', texto: antes, partes: partes.filter((p) => !p.added).map((p) => ({ mudou: Boolean(p.removed), texto: p.value })) },
        { tipo: 'add', texto: depois, partes: partes.filter((p) => !p.removed).map((p) => ({ mudou: Boolean(p.added), texto: p.value })) },
    ]
}

// Modo linha: lista de { tipo: igual|rem|add, texto, partes? } e
// { tipo: 'colapso', qtd } no lugar de trechos iguais longos.
function linhasDoDiff(partes) {
    const saida = []

    for (let i = 0; i < partes.length; i++) {
        const parte = partes[i]
        const atuais = separarLinhas(parte.value)

        if (!parte.added && !parte.removed) {
            const iguais = atuais.map((texto) => ({ tipo: 'igual', texto }))
            const cabeca = i === 0 ? 0 : CONTEXTO
            const cauda = i === partes.length - 1 ? 0 : CONTEXTO
            if (iguais.length <= cabeca + cauda + 1) {
                saida.push(...iguais)
            } else {
                saida.push(...iguais.slice(0, cabeca), { tipo: 'colapso', qtd: iguais.length - cabeca - cauda }, ...iguais.slice(iguais.length - cauda))
            }
        } else if (parte.removed && partes[i + 1]?.added) {
            // Removido seguido de adicionado: cada linha removida pareia, em
            // ordem, com a proxima linha nova parecida; o resto sai inteiro.
            const novas = separarLinhas(partes[++i].value)
            const menos = atuais.map((texto) => ({ tipo: 'rem', texto }))
            const mais = novas.map((texto) => ({ tipo: 'add', texto }))
            let k = 0
            atuais.forEach((linha, j) => {
                const indice = novas.findIndex((nova, n) => n >= k && parecidas(linha, nova))
                if (indice === -1) return
                ;[menos[j], mais[indice]] = par(linha, novas[indice])
                k = indice + 1
            })
            saida.push(...menos, ...mais)
        } else {
            saida.push(...atuais.map((texto) => ({ tipo: tipo(parte), texto })))
        }
    }
    return saida
}

// Removido seguido de adicionado conta como uma diferenca so (uma troca).
function resumo(partes, a, b) {
    const diferencas = partes.filter((parte, i) =>
        (parte.added || parte.removed) && !(parte.added && partes[i - 1]?.removed)).length

    // No modo linha, uma linha com um caractere trocado contaria como toda
    // diferente; refaz por caractere se o texto nao for grande demais.
    const base = partes.length && a.length + b.length < 200_000 ? diffChars(a, b) : partes

    // floor: nunca mostra 100% para textos que sao diferentes.
    const similaridade = Math.floor((2 * caracteresIguais(base) / ((a.length + b.length) || 1)) * 100)
    return { diferencas, similaridade, texto: `${diferencas} diferenca${diferencas === 1 ? '' : 's'}, ${similaridade}% iguais` }
}

// Diferencas que enganam porque os textos parecem iguais na tela.
function aviso(a, b) {
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
    return null
}

// { iguais, modo, partes | linhas, resumo, aviso }. `partes` (modos char e
// palavra): [{ tipo: igual|rem|add, texto }]; `linhas` (modo linha): ver acima.
export function comparar(a, b, modo = 'auto') {
    if (a === b) return { iguais: true, modo: modo === 'auto' ? modoAuto(a, b) : modo }
    const escolhido = modo === 'auto' ? modoAuto(a, b) : modo
    const partes = escolhido === 'linha' ? diffLines(a, b)
        : escolhido === 'palavra' ? diffWordsWithSpace(a, b)
        : diffChars(a, b)

    return {
        iguais: false,
        modo: escolhido,
        ...(escolhido === 'linha'
            ? { linhas: linhasDoDiff(partes) }
            : { partes: partes.map((parte) => ({ tipo: tipo(parte), texto: parte.value })) }),
        resumo: resumo(partes, a, b),
        aviso: aviso(a, b),
    }
}
