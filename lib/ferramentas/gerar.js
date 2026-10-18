import { randomBytes, randomInt, randomUUID } from 'node:crypto'
import * as p from '@clack/prompts'
import { ask, entregar } from '../ui.js'

// Sem caracteres que se confundem (0/O, 1/l/I) e sem aspas, que quebram .env.
const CLASSES = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnpqrstuvwxyz',
    '23456789',
    '!@#$%&*-_=+?',
]

// randomInt evita o vies de usar % sobre bytes aleatorios. Repete ate ter
// pelo menos um caractere de cada classe.
function senha(tamanho) {
    const todos = CLASSES.join('')
    while (true) {
        const valor = Array.from({ length: tamanho }, () => todos[randomInt(todos.length)]).join('')
        if (CLASSES.every((classe) => [...valor].some((ch) => classe.includes(ch)))) return valor
    }
}

export default {
    id: 'gerar',
    label: 'Gerar',
    hint: 'UUID, senha, token, APP_KEY do Laravel',
    async executar() {
        const tipo = ask(await p.select({
            message: 'Gerar',
            options: [
                { value: 'uuid', label: 'UUID v4' },
                { value: 'senha', label: 'senha forte' },
                { value: 'token', label: 'token hex', hint: '32 bytes, para API keys e segredos' },
                { value: 'appkey', label: 'APP_KEY do Laravel', hint: 'base64:..., igual ao key:generate' },
            ],
        }))

        if (tipo === 'appkey') return entregar(`base64:${randomBytes(32).toString('base64')}`)
        if (tipo === 'token') return entregar(randomBytes(32).toString('hex'))

        if (tipo === 'senha') {
            const tamanho = Number(ask(await p.text({
                message: 'Tamanho',
                initialValue: '20',
                validate: (valor) => {
                    if (!/^\d+$/.test(valor) || valor < 8 || valor > 128) return 'Use um numero entre 8 e 128.'
                },
            })))
            return entregar(senha(tamanho))
        }

        const quantidade = Number(ask(await p.text({
            message: 'Quantos?',
            initialValue: '1',
            validate: (valor) => {
                if (!/^\d+$/.test(valor) || valor < 1 || valor > 1000) return 'Use um numero entre 1 e 1000.'
            },
        })))
        entregar(Array.from({ length: quantidade }, () => randomUUID()).join('\n'))
    },
}
