// JSON: formatar, minificar, ordenar, validar, escapar. Erro com linha e coluna.
import { caixaEntrada, caixaSaida, depoisDe, el, mensagem, seletor } from '../comum.js'

const ACOES = [
    { value: 'formatar', label: 'formatar' },
    { value: 'minificar', label: 'minificar' },
    { value: 'ordenar', label: 'formatar com chaves em ordem' },
    { value: 'validar', label: 'so validar' },
    { value: 'escapar', label: 'escapar como string' },
    { value: 'desescapar', label: 'desescapar string' },
]

export default {
    id: 'json',
    titulo: 'JSON',
    descricao: 'Cole o JSON; o resultado sai ao lado. Erros mostram a linha e a coluna.',
    montar(raiz, { chamar }) {
        const status = el('div')
        const saida = caixaSaida('Resultado')
        const atualizar = depoisDe(250, async () => {
            saida.mostrar('')
            if (!entrada.texto().trim()) return status.replaceChildren()
            try {
                const r = await chamar({ acao: acao.value, texto: entrada.texto() })
                if (r.erro) {
                    const e = r.erro
                    return status.replaceChildren(mensagem('erro', e.mensagem,
                        e.trecho !== undefined && el('pre', { class: 'trecho' }, `${e.trecho}\n${' '.repeat(e.seta)}^`)))
                }
                if (r.aviso) return status.replaceChildren(mensagem('aviso', r.aviso))
                if (r.valido) return status.replaceChildren(mensagem('ok', r.valido))
                status.replaceChildren()
                saida.mostrar(r.saida)
            } catch (err) {
                status.replaceChildren(mensagem('erro', err.message))
            }
        })
        const acao = seletor(ACOES, atualizar)
        const entrada = caixaEntrada({ rotulo: 'JSON', placeholder: '{"cole": "aqui"}', linhas: 18, aoMudar: atualizar })

        raiz.append(el('div', { class: 'barra' }, acao), status, el('div', { class: 'duas' }, entrada.elemento, saida.elemento))
    },
}
