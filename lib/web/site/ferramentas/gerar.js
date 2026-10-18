// Gerar: UUID, senha forte, token hex e APP_KEY do Laravel.
import { caixaSaida, el, mensagem, seletor } from '../comum.js'

const TIPOS = [
    { value: 'uuid', label: 'UUID v4' },
    { value: 'senha', label: 'senha forte' },
    { value: 'token', label: 'token hex', hint: '32 bytes' },
    { value: 'appkey', label: 'APP_KEY do Laravel' },
]

export default {
    id: 'gerar',
    titulo: 'Gerar',
    descricao: 'Valores gerados com aleatoriedade criptografica, aqui no seu computador.',
    montar(raiz, { chamar }) {
        const status = el('div')
        const saida = caixaSaida('Resultado')
        const tamanho = el('input', { type: 'number', min: 8, max: 128, value: 20, 'aria-label': 'Tamanho' })
        const quantidade = el('input', { type: 'number', min: 1, max: 1000, value: 1, 'aria-label': 'Quantidade' })
        const rotuloTamanho = el('label', {}, 'tamanho ', tamanho)
        const rotuloQuantidade = el('label', {}, 'quantos ', quantidade)

        async function gerar() {
            try {
                const r = await chamar({ tipo: tipo.value, tamanho: Number(tamanho.value), quantidade: Number(quantidade.value) })
                if (r.erro) return status.replaceChildren(mensagem('erro', r.erro))
                status.replaceChildren()
                saida.mostrar(r.saida)
            } catch (err) {
                status.replaceChildren(mensagem('erro', err.message))
            }
        }
        const mostrarOpcoes = () => {
            rotuloTamanho.hidden = tipo.value !== 'senha'
            rotuloQuantidade.hidden = tipo.value !== 'uuid'
            gerar()
        }
        const tipo = seletor(TIPOS, mostrarOpcoes)

        raiz.append(
            el('div', { class: 'barra' }, tipo, rotuloTamanho, rotuloQuantidade, el('button', { type: 'button', class: 'principal', onclick: gerar }, 'gerar de novo')),
            status, saida.elemento)
        mostrarOpcoes()
    },
}
