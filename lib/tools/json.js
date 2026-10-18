// JSON: formatar, minificar, ordenar chaves, validar, escapar.
import * as p from '@clack/prompts'
import c from 'picocolors'
import { escolherTexto } from '../comum/entrada.js'
import { ask } from '../comum/prompts.js'
import { entregar } from '../comum/saida.js'

// Mostra a linha do erro com um ^ embaixo; linha longa (JSON minificado)
// vira uma janela de 80 caracteres em volta do erro.
export function mostrarErro(texto, err) {
    const posicao = Number(err.message.match(/position (\d+)/)?.[1])
    if (Number.isNaN(posicao)) return p.log.error(`JSON invalido: ${err.message}`)

    const antes = texto.slice(0, posicao)
    const linha = antes.split('\n').length
    const coluna = posicao - antes.lastIndexOf('\n')
    const conteudo = texto.split('\n')[linha - 1].replace(/\r$/, '')
    const inicio = Math.max(0, coluna - 41)
    const trecho = conteudo.slice(inicio, coluna + 40)

    p.log.error([
        `JSON invalido na linha ${linha}, coluna ${coluna}`,
        c.dim(err.message),
        '',
        trecho,
        `${' '.repeat(coluna - 1 - inicio)}${c.red('^')}`,
    ].join('\n'))
}

// BOM e espaco em volta nao sao erro de verdade; JSON.parse recusaria o BOM.
export function lerJson(texto) {
    return JSON.parse(texto.replace(/^﻿/, '').trim())
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

export default {
    id: 'json',
    label: 'JSON',
    hint: 'formatar, minificar, validar, escapar',
    async executar() {
        const acao = ask(await p.select({
            message: 'JSON',
            options: [
                { value: 'formatar', label: 'formatar', hint: 'indentado com 2 espacos' },
                { value: 'minificar', label: 'minificar', hint: 'tudo em uma linha' },
                { value: 'ordenar', label: 'formatar com chaves em ordem', hint: 'bom antes de comparar dois JSONs' },
                { value: 'validar', label: 'so validar', hint: 'mostra linha e coluna do erro' },
                { value: 'escapar', label: 'escapar como string', hint: 'para colar dentro de codigo ou outro JSON' },
                { value: 'desescapar', label: 'desescapar string', hint: '"{\\"a\\":1}" vira {"a": 1}' },
            ],
        }))

        const texto = await escolherTexto('o JSON', { extensao: 'json' })
        if (acao === 'escapar') return entregar(JSON.stringify(texto))

        let valor
        try {
            valor = lerJson(texto)
        } catch (err) {
            return mostrarErro(texto, err)
        }

        switch (acao) {
            case 'formatar':
                return entregar(JSON.stringify(valor, null, 2))
            case 'minificar':
                return entregar(JSON.stringify(valor))
            case 'ordenar':
                return entregar(JSON.stringify(ordenarChaves(valor), null, 2))
            case 'validar':
                return p.log.success(`JSON valido: ${descrever(valor)}.`)
            case 'desescapar': {
                if (typeof valor !== 'string') return p.log.warn('Isso ja e um JSON, nao uma string escapada.')
                // Se o conteudo da string for JSON, ja entrega formatado.
                try {
                    return entregar(JSON.stringify(lerJson(valor), null, 2))
                } catch {
                    return entregar(valor)
                }
            }
        }
    },
}
