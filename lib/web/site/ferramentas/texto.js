// Texto: camelCase, snake_case, slug, sem acentos e contagem.
import { caixaEntrada, depoisDe, el, listaCopiavel, mensagem } from '../comum.js'

export default {
    id: 'texto',
    titulo: 'Texto',
    descricao: 'Digite um nome ou frase e copie o formato que precisar.',
    montar(raiz, { chamar }) {
        const resultado = el('div', { class: 'resultado' })
        const atualizar = depoisDe(200, async () => {
            if (!entrada.texto()) return resultado.replaceChildren()
            try {
                const r = await chamar({ texto: entrada.texto() })
                resultado.replaceChildren(
                    el('p', { class: 'muted' }, r.contagem),
                    r.formatos.length ? listaCopiavel(r.formatos) : mensagem('aviso', 'Sem letras ou numeros para converter.'))
            } catch (err) {
                resultado.replaceChildren(mensagem('erro', err.message))
            }
        })
        const entrada = caixaEntrada({ rotulo: 'Texto', placeholder: 'nome completo do usuario', linhas: 3, aoMudar: atualizar })
        raiz.append(entrada.elemento, resultado)
    },
}
