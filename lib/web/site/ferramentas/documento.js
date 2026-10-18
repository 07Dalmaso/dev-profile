// CPF / CNPJ: gerar para teste e validar (inclusive CNPJ alfanumerico).
import { depoisDe, el, listaCopiavel, mensagem } from '../comum.js'

export default {
    id: 'documento',
    titulo: 'CPF / CNPJ',
    descricao: 'Documentos gerados sao validos so na conta, para testes: nao pertencem a ninguem.',
    montar(raiz, { chamar }) {
        const gerados = el('div', { class: 'resultado' })
        const validacao = el('div', { class: 'resultado' })

        async function gerar(tipo) {
            try {
                const r = await chamar({ acao: tipo })
                gerados.replaceChildren(listaCopiavel([[`${tipo.toUpperCase()} com mascara`, r.mascarado], ['so numeros', r.numeros]]))
            } catch (err) {
                gerados.replaceChildren(mensagem('erro', err.message))
            }
        }

        const validar = depoisDe(250, async () => {
            if (!entrada.value.trim()) return validacao.replaceChildren()
            try {
                const r = await chamar({ acao: 'validar', texto: entrada.value })
                if (r.erro) return validacao.replaceChildren(mensagem('aviso', r.erro))
                validacao.replaceChildren(r.ok
                    ? mensagem('ok', `${r.tipo} valido: ${r.formatado}`)
                    : mensagem('erro', `${r.tipo} INVALIDO: ${r.formatado}`))
            } catch (err) {
                validacao.replaceChildren(mensagem('erro', err.message))
            }
        })
        const entrada = el('input', { type: 'text', class: 'grande', placeholder: 'CPF ou CNPJ, com ou sem mascara', oninput: validar })

        raiz.append(
            el('h3', {}, 'Gerar para teste'),
            el('div', { class: 'barra' },
                el('button', { type: 'button', class: 'principal', onclick: () => gerar('cpf') }, 'gerar CPF'),
                el('button', { type: 'button', class: 'principal', onclick: () => gerar('cnpj') }, 'gerar CNPJ')),
            gerados,
            el('h3', {}, 'Validar'),
            el('div', { class: 'barra' }, entrada),
            validacao)
    },
}
