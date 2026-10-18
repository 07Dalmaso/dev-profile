// Comparar textos: A e B lado a lado, resultado colorido enquanto digita.
// O calculo e o mesmo do terminal (lib/tools/motor/diff.js).
import { caixaEntrada, depoisDe, el, mensagem, seletor } from '../comum.js'

// Espaco, tab e invisiveis aparecem nos trechos alterados (igual ao terminal).
const visivel = (texto) => texto.replace(/\r\n|[ \t\r\n ​-‍﻿]/g, (ch) => ({
    ' ': '·', '\t': '→', '\r': '␍', '\n': '↵\n', '\r\n': '␍↵\n', ' ': '⍽',
})[ch] ?? '⌀')

const MODOS = [
    { value: 'auto', label: 'automatico' },
    { value: 'linha', label: 'por linha', hint: 'SQL, JSON, codigo' },
    { value: 'palavra', label: 'por palavra', hint: 'frases' },
    { value: 'char', label: 'por caractere', hint: 'tokens, hashes' },
]

function inline(partes) {
    return el('pre', { class: 'diff inline' }, partes.map((parte) => parte.tipo === 'igual'
        ? parte.texto
        : el('span', { class: parte.tipo }, visivel(parte.texto))))
}

function linhas(itens) {
    return el('div', { class: 'diff linhas' }, itens.map((item) => {
        if (item.tipo === 'colapso') return el('div', { class: 'linha colapso' }, `··· ${item.qtd} linhas iguais ···`)
        const sinal = { igual: ' ', rem: '-', add: '+' }[item.tipo]
        const conteudo = item.partes
            ? item.partes.map((parte) => parte.mudou ? el('mark', {}, visivel(parte.texto)) : parte.texto)
            : item.texto
        return el('div', { class: `linha ${item.tipo}` }, el('span', { class: 'sinal' }, sinal), el('span', { class: 'conteudo' }, conteudo))
    }))
}

export default {
    id: 'diff',
    titulo: 'Comparar textos',
    descricao: 'Cole ou arraste os dois textos; a diferenca aparece enquanto voce digita.',
    montar(raiz, { chamar }) {
        const resultado = el('div', { class: 'resultado' })
        const atualizar = depoisDe(300, async () => {
            if (!a.texto() || !b.texto()) return resultado.replaceChildren(el('p', { class: 'muted' }, 'Preencha os dois lados.'))
            try {
                const r = await chamar({ a: a.texto(), b: b.texto(), modo: modo.value })
                if (r.iguais) return resultado.replaceChildren(mensagem('ok', 'Textos identicos.'))
                // filter: replaceChildren escreveria "null" na tela sem aviso.
                resultado.replaceChildren(...[
                    el('div', { class: 'legenda' },
                        el('span', { class: 'muted' }, `modo ${r.modo} | `),
                        el('span', { class: 'rem' }, 'so em A'), ' ', el('span', { class: 'add' }, 'so em B'),
                        el('span', { class: 'muted' }, ` | ${r.resumo.texto}`)),
                    r.aviso && mensagem('aviso', r.aviso),
                    r.linhas ? linhas(r.linhas) : inline(r.partes),
                ].filter(Boolean))
            } catch (err) {
                resultado.replaceChildren(mensagem('erro', err.message))
            }
        })

        const a = caixaEntrada({ rotulo: 'Texto A', placeholder: 'cole ou arraste um arquivo', aoMudar: atualizar })
        const b = caixaEntrada({ rotulo: 'Texto B', placeholder: 'cole ou arraste um arquivo', aoMudar: atualizar })
        const modo = seletor(MODOS, atualizar)
        const trocar = () => {
            const textoA = a.texto()
            a.definir(b.texto())
            b.definir(textoA)
            atualizar()
        }

        raiz.append(
            el('div', { class: 'barra' }, modo, el('button', { type: 'button', onclick: trocar }, 'trocar A e B')),
            el('div', { class: 'duas' }, a.elemento, b.elemento),
            resultado)
        atualizar()
    },
}
