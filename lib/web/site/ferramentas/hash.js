// Hash: MD5, SHA-1, SHA-256 e SHA-512 de texto ou arquivo (bytes exatos).
import { caixaEntrada, depoisDe, el, listaCopiavel, mensagem } from '../comum.js'

export default {
    id: 'hash',
    titulo: 'Hash',
    descricao: 'Digite um texto ou arraste um arquivo. Para conferir um download, compare com o hash do site.',
    montar(raiz, { chamar }) {
        const resultado = el('div', { class: 'resultado' })
        const atualizar = depoisDe(300, async () => {
            if (entrada.vazio()) return resultado.replaceChildren()
            try {
                const r = await chamar(entrada.corpo())
                resultado.replaceChildren(listaCopiavel(r.hashes))
            } catch (err) {
                resultado.replaceChildren(mensagem('erro', err.message))
            }
        })
        const entrada = caixaEntrada({ rotulo: 'Conteudo', placeholder: 'texto ou arraste um arquivo', binario: true, linhas: 6, aoMudar: atualizar })
        raiz.append(entrada.elemento, resultado)
    },
}
