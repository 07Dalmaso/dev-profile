// Base64: codificar (texto ou arquivo) e decodificar; JSON sai formatado.
import { caixaEntrada, caixaSaida, depoisDe, el, mensagem, seletor } from '../comum.js'

const ACOES = [
    { value: 'decodificar', label: 'decodificar' },
    { value: 'codificar', label: 'codificar' },
    { value: 'url', label: 'codificar para URL', hint: 'sem + / =' },
]

export default {
    id: 'base64',
    titulo: 'Base64',
    descricao: 'Codifique texto ou um arquivo (arraste), ou decodifique. Se o conteudo for JSON, sai formatado.',
    montar(raiz, { chamar }) {
        const status = el('div')
        const saida = caixaSaida('Resultado')
        const atualizar = depoisDe(250, async () => {
            saida.mostrar('')
            if (entrada.vazio()) return status.replaceChildren()
            try {
                const r = await chamar({ acao: acao.value, ...entrada.corpo() })
                if (r.erro) return status.replaceChildren(mensagem('erro', r.erro))
                if (r.binario) {
                    status.replaceChildren(mensagem('aviso', `O conteudo e binario (${r.binario.bytes} bytes), nao texto. Primeiros bytes em hex:`))
                    return saida.mostrar(r.binario.hex)
                }
                status.replaceChildren(r.json ? mensagem('info', 'O conteudo e JSON e saiu formatado.') : '')
                saida.mostrar(r.saida)
            } catch (err) {
                status.replaceChildren(mensagem('erro', err.message))
            }
        })
        const acao = seletor(ACOES, atualizar)
        const entrada = caixaEntrada({ rotulo: 'Entrada', placeholder: 'texto, Base64 ou arraste um arquivo', binario: true, linhas: 14, aoMudar: atualizar })

        raiz.append(el('div', { class: 'barra' }, acao), status, el('div', { class: 'duas' }, entrada.elemento, saida.elemento))
    },
}
