// Data / timestamp: Unix <-> data, formato MySQL, ISO e relativo.
import { depoisDe, el, listaCopiavel, mensagem } from '../comum.js'

export default {
    id: 'data',
    titulo: 'Data / timestamp',
    descricao: 'Aceita timestamp (segundos ou ms), dd/mm/aaaa hh:mm ou ISO. Vazio = agora.',
    montar(raiz, { chamar }) {
        const resultado = el('div', { class: 'resultado' })
        const atualizar = depoisDe(250, async () => {
            try {
                const r = await chamar({ texto: entrada.value })
                if (r.erro) return resultado.replaceChildren(mensagem('erro', r.erro))
                resultado.replaceChildren(el('p', { class: 'destaque' }, r.relativo), listaCopiavel(r.formatos))
            } catch (err) {
                resultado.replaceChildren(mensagem('erro', err.message))
            }
        })
        const entrada = el('input', { type: 'text', class: 'grande', placeholder: '1729267200, 18/10/2026 14:30, 2026-10-18T17:30:00Z', oninput: atualizar })
        const agora = el('button', { type: 'button', onclick: () => { entrada.value = ''; atualizar() } }, 'agora')
        raiz.append(el('div', { class: 'barra' }, entrada, agora), resultado)
        atualizar()
    },
}
