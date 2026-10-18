// Texto: camelCase, snake_case, slug, sem acentos e contagem.
import * as p from '@clack/prompts'
import { escolherTexto } from '../comum/entrada.js'
import { escolherECopiar } from '../comum/saida.js'

function semAcentos(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// "nomeCompleto", "nome_completo", "Nome Completo" e "HTTPServer" viram listas
// de palavras: separa nas trocas de caixa e em qualquer coisa nao alfanumerica.
export function palavras(texto) {
    return semAcentos(texto)
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map((palavra) => palavra.toLowerCase())
}

const capitalizar = (palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1)

export default {
    id: 'texto',
    label: 'Texto',
    hint: 'camelCase, snake_case, slug, sem acentos, contagem',
    async executar() {
        const texto = await escolherTexto('o texto')
        const lista = palavras(texto)

        const plural = (n, palavra) => `${n} ${palavra}${n === 1 ? '' : 's'}`
        const linhas = texto.split(/\r?\n/).length
        const qtdPalavras = texto.trim() ? texto.trim().split(/\s+/).length : 0
        p.log.info([
            plural([...texto].length, 'caractere'),
            plural(qtdPalavras, 'palavra'),
            plural(linhas, 'linha'),
            `${Buffer.byteLength(texto)} bytes (UTF-8)`,
        ].join(', '))

        if (!lista.length) return p.log.warn('Sem letras ou numeros para converter.')

        await escolherECopiar([
            ['camelCase', lista[0] + lista.slice(1).map(capitalizar).join('')],
            ['PascalCase', lista.map(capitalizar).join('')],
            ['snake_case', lista.join('_')],
            ['CONSTANTE', lista.join('_').toUpperCase()],
            ['kebab / slug', lista.join('-')],
            ['Titulo', lista.map(capitalizar).join(' ')],
            ['minusculo', texto.toLowerCase()],
            ['MAIUSCULO', texto.toUpperCase()],
            ['sem acentos', semAcentos(texto)],
        ])
    },
}
