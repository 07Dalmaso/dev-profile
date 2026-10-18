// Motor do JSON: formatar, minificar, ordenar chaves, validar, escapar.

// BOM e espaco em volta nao sao erro de verdade; JSON.parse recusaria o BOM.
export function lerJson(texto) {
    return JSON.parse(texto.replace(/^﻿/, '').trim())
}

// Posicao do primeiro erro de sintaxe, para quando a mensagem do JSON.parse
// nao traz "position N" (ex.: virgula sobrando em [1, 2,]). Le o JSON do
// jeito estrito e para no primeiro caractere que nao cabe.
function posicaoDoErro(t) {
    let i = 0
    const espacos = () => { while (i < t.length && ' \t\n\r'.includes(t[i])) i++ }
    const falhar = () => { throw i }

    function texto() {
        i++
        while (i < t.length) {
            if (t[i] === '"') return i++
            if (t[i] === '\\') i++
            else if (t[i] < ' ') falhar()
            i++
        }
        falhar()
    }

    function valor() {
        espacos()
        if (t[i] === '{' || t[i] === '[') {
            const fim = t[i] === '{' ? '}' : ']'
            i++
            espacos()
            if (t[i] === fim) return i++
            while (true) {
                if (fim === '}') {
                    espacos()
                    if (t[i] !== '"') falhar()
                    texto()
                    espacos()
                    if (t[i] !== ':') falhar()
                    i++
                }
                valor()
                espacos()
                if (t[i] === ',') { i++; continue }
                if (t[i] === fim) return i++
                falhar()
            }
        }
        if (t[i] === '"') return texto()
        const literal = /^(-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?|true|false|null)/.exec(t.slice(i, i + 400))
        if (!literal) falhar()
        i += literal[0].length
    }

    try {
        valor()
        espacos()
        return i < t.length ? i : null
    } catch (posicao) {
        if (typeof posicao === 'number') return posicao
        throw posicao
    }
}

// Onde esta o erro: linha, coluna e um trecho de ate 80 caracteres em volta
// (JSON minificado e uma linha so, enorme).
function localizarErro(texto, err) {
    const limpo = texto.replace(/^﻿/, '').trim()
    const informada = Number(err.message.match(/position (\d+)/)?.[1])
    const posicao = Number.isNaN(informada) ? posicaoDoErro(limpo) : informada
    if (posicao === null) return { mensagem: `JSON invalido: ${err.message}`, detalhe: err.message }

    const antes = limpo.slice(0, posicao)
    const linha = antes.split('\n').length
    const coluna = posicao - antes.lastIndexOf('\n')
    const conteudo = limpo.split('\n')[linha - 1].replace(/\r$/, '')
    const inicio = Math.max(0, coluna - 41)
    return {
        mensagem: `JSON invalido na linha ${linha}, coluna ${coluna}`,
        detalhe: err.message,
        linha,
        coluna,
        trecho: conteudo.slice(inicio, coluna + 40),
        seta: coluna - 1 - inicio,
    }
}

function ordenarChaves(valor) {
    if (Array.isArray(valor)) return valor.map(ordenarChaves)
    if (valor && typeof valor === 'object') {
        return Object.fromEntries(Object.keys(valor).sort().map((chave) => [chave, ordenarChaves(valor[chave])]))
    }
    return valor
}

function descrever(valor) {
    if (Array.isArray(valor)) return `array com ${valor.length} ite${valor.length === 1 ? 'm' : 'ns'}`
    if (valor && typeof valor === 'object') return `objeto com ${Object.keys(valor).length} chave(s)`
    return typeof valor
}

export const ACOES = [
    { value: 'formatar', label: 'formatar', hint: 'indentado com 2 espacos' },
    { value: 'minificar', label: 'minificar', hint: 'tudo em uma linha' },
    { value: 'ordenar', label: 'formatar com chaves em ordem', hint: 'bom antes de comparar dois JSONs' },
    { value: 'validar', label: 'so validar', hint: 'mostra linha e coluna do erro' },
    { value: 'escapar', label: 'escapar como string', hint: 'para colar dentro de codigo ou outro JSON' },
    { value: 'desescapar', label: 'desescapar string', hint: '"{\\"a\\":1}" vira {"a": 1}' },
]

// { saida } | { valido } | { aviso } | { erro: { mensagem, linha?, coluna?, trecho?, seta? } }
export function processar(acao, texto) {
    if (acao === 'escapar') return { saida: JSON.stringify(texto) }

    let valor
    try {
        valor = lerJson(texto)
    } catch (err) {
        return { erro: localizarErro(texto, err) }
    }

    switch (acao) {
        case 'formatar': return { saida: JSON.stringify(valor, null, 2) }
        case 'minificar': return { saida: JSON.stringify(valor) }
        case 'ordenar': return { saida: JSON.stringify(ordenarChaves(valor), null, 2) }
        case 'validar': return { valido: `JSON valido: ${descrever(valor)}.` }
        case 'desescapar': {
            if (typeof valor !== 'string') return { aviso: 'Isso ja e um JSON, nao uma string escapada.' }
            // Se o conteudo da string for JSON, ja entrega formatado.
            try {
                return { saida: JSON.stringify(lerJson(valor), null, 2) }
            } catch {
                return { saida: valor }
            }
        }
        default: return { erro: { mensagem: `Acao desconhecida: ${acao}` } }
    }
}
