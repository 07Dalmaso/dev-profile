// JWT: header, payload, datas e se esta expirado. A assinatura nao e verificada.
import { botaoCopiar, caixaEntrada, depoisDe, el, mensagem } from '../comum.js'

const bloco = (titulo, objeto) => {
    const texto = JSON.stringify(objeto, null, 2)
    return el('div', { class: 'caixa' },
        el('div', { class: 'caixa-topo' }, el('label', {}, titulo), botaoCopiar(() => texto)),
        el('pre', { class: 'saida' }, texto))
}

export default {
    id: 'jwt',
    titulo: 'JWT',
    descricao: 'Cole o token (pode vir com "Bearer "). O token nao sai do seu computador.',
    montar(raiz, { chamar }) {
        const resultado = el('div', { class: 'resultado' })
        const atualizar = depoisDe(250, async () => {
            if (!entrada.texto().trim()) return resultado.replaceChildren()
            try {
                const r = await chamar({ texto: entrada.texto() })
                if (r.erro) return resultado.replaceChildren(mensagem('erro', r.erro))
                // filter: replaceChildren escreveria "false" na tela.
                resultado.replaceChildren(...[
                    r.expirado === true && mensagem('erro', 'Token EXPIRADO.'),
                    r.expirado === false && mensagem('ok', 'Token dentro da validade.'),
                    r.aindaNaoValido && mensagem('aviso', 'Token ainda nao e valido (nbf no futuro).'),
                    r.datas.length > 0 && el('table', { class: 'tabela' }, r.datas.map((d) =>
                        el('tr', {}, el('th', {}, d.rotulo), el('td', {}, d.local), el('td', { class: 'muted' }, d.relativo)))),
                    el('div', { class: 'duas' }, bloco('Payload', r.payload), bloco('Header', r.header)),
                    el('p', { class: 'muted' }, 'A assinatura nao e verificada: isso so le o conteudo.'),
                ].filter(Boolean))
            } catch (err) {
                resultado.replaceChildren(mensagem('erro', err.message))
            }
        })
        const entrada = caixaEntrada({ rotulo: 'Token', placeholder: 'eyJhbGciOi...', linhas: 5, aoMudar: atualizar })
        raiz.append(entrada.elemento, resultado)
    },
}
