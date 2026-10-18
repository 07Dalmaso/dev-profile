// URL: analisar (host, caminho, parametros), codificar e decodificar.
import { botaoCopiar, caixaEntrada, caixaSaida, depoisDe, el, mensagem, seletor } from '../comum.js'

const ACOES = [
    { value: 'analisar', label: 'analisar URL', hint: 'host, caminho e parametros' },
    { value: 'decodificar', label: 'decodificar', hint: '%20 vira espaco' },
    { value: 'codificar', label: 'codificar', hint: 'para valor de parametro' },
]

export default {
    id: 'url',
    titulo: 'URL',
    descricao: 'Separe uma URL em partes (parametros ja decodificados) ou codifique/decodifique texto.',
    montar(raiz, { chamar }) {
        const resultado = el('div', { class: 'resultado' })
        const atualizar = depoisDe(250, async () => {
            if (!entrada.texto().trim()) return resultado.replaceChildren()
            try {
                const r = await chamar({ acao: acao.value, texto: entrada.texto() })
                if (r.erro) return resultado.replaceChildren(mensagem('erro', r.erro))
                if (acao.value !== 'analisar') {
                    const saida = caixaSaida('Resultado')
                    saida.mostrar(r.saida)
                    return resultado.replaceChildren(saida.elemento)
                }
                const params = r.params && JSON.stringify(r.params, null, 2)
                resultado.replaceChildren(
                    el('table', { class: 'tabela' }, r.partes.map(([rotulo, valor]) => el('tr', {}, el('th', {}, rotulo), el('td', {}, valor)))),
                    params
                        ? el('div', { class: 'caixa' },
                            el('div', { class: 'caixa-topo' }, el('label', {}, 'Parametros (ja decodificados)'), botaoCopiar(() => params)),
                            el('pre', { class: 'saida' }, params))
                        : el('p', { class: 'muted' }, 'Sem parametros na query string.'))
            } catch (err) {
                resultado.replaceChildren(mensagem('erro', err.message))
            }
        })
        const acao = seletor(ACOES, atualizar)
        const entrada = caixaEntrada({ rotulo: 'URL ou texto', placeholder: 'https://exemplo.com/caminho?a=1&b=2', linhas: 4, aoMudar: atualizar })
        raiz.append(el('div', { class: 'barra' }, acao), entrada.elemento, resultado)
    },
}
