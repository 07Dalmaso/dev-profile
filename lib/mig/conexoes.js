// Conexoes de banco do projeto: le o config/database.php (sem executar PHP)
// e pergunta qual usar.
import { existsSync, readFileSync } from 'node:fs'
import * as p from '@clack/prompts'
import { ask } from '../comum/prompts.js'

// Valores sentinela: nao colidem com nenhum nome de conexao vindo do projeto.
const AUTO = Symbol('auto')
const OUTRA = Symbol('outra')

// Tokeniza o PHP so o suficiente para achar chaves de array: strings, '=>' e
// abre/fecha de [ ] e ( ). Comentarios sao pulados; o resto e ignorado.
function tokenizar(fonte) {
    const tokens = []
    let i = 0

    while (i < fonte.length) {
        const ch = fonte[i]
        const dois = fonte.slice(i, i + 2)

        if (dois === '//' || ch === '#') {
            const fim = fonte.indexOf('\n', i)
            i = fim === -1 ? fonte.length : fim
        } else if (dois === '/*') {
            const fim = fonte.indexOf('*/', i + 2)
            i = fim === -1 ? fonte.length : fim + 2
        } else if (ch === "'" || ch === '"') {
            let valor = ''
            i++
            while (i < fonte.length && fonte[i] !== ch) {
                if (fonte[i] === '\\') i++
                valor += fonte[i++] ?? ''
            }
            i++
            tokens.push({ tipo: 'str', valor })
        } else if (dois === '=>') {
            tokens.push({ tipo: '=>' })
            i += 2
        } else {
            if (ch === '[' || ch === '(') tokens.push({ tipo: 'abre' })
            else if (ch === ']' || ch === ')') tokens.push({ tipo: 'fecha' })
            i++
        }
    }

    return tokens
}

// Le as chaves de 'connections' no config/database.php do projeto, sem executar PHP.
export function lerConexoes(arquivo = 'config/database.php') {
    if (!existsSync(arquivo)) return []

    const t = tokenizar(readFileSync(arquivo, 'utf8'))
    const inicio = t.findIndex((tok, i) =>
        tok.tipo === 'str' && tok.valor === 'connections' &&
        t[i + 1]?.tipo === '=>' && t[i + 2]?.tipo === 'abre')
    if (inicio === -1) return []

    const nomes = []
    let nivel = 0

    for (let i = inicio + 2; i < t.length; i++) {
        const tok = t[i]
        if (tok.tipo === 'abre') nivel++
        else if (tok.tipo === 'fecha' && --nivel === 0) break
        else if (nivel === 1 && tok.tipo === 'str' && t[i + 1]?.tipo === '=>') nomes.push(tok.valor)
    }

    return nomes
}

// Retorna o nome da conexao, ou null para deixar o comando decidir.
export async function escolherBase() {
    const conexoes = lerConexoes()
    if (!conexoes.length) p.log.warn('Nenhuma conexao encontrada em config/database.php.')

    const base = ask(await p.select({
        message: 'Base',
        options: [
            { value: AUTO, label: 'automatica', hint: 'sem --database, o comando decide' },
            ...conexoes.map((nome) => ({ value: nome, label: nome })),
            { value: OUTRA, label: 'outra...', hint: 'digitar o nome da conexao' },
        ],
    }))

    if (base === AUTO) return null
    if (base !== OUTRA) return base

    return ask(await p.text({
        message: 'Nome da conexao',
        validate: (valor) => {
            if (!valor || !valor.trim()) return 'Nome nao pode ser vazio.'
        },
    })).trim()
}
