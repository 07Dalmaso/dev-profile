// Motor de geracao: UUID, senha forte, token hex e APP_KEY do Laravel.
import { randomBytes, randomInt, randomUUID } from 'node:crypto'

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

export const TIPOS = [
    { value: 'uuid', label: 'UUID v4' },
    { value: 'senha', label: 'senha forte' },
    { value: 'token', label: 'token hex', hint: '32 bytes, para API keys e segredos' },
    { value: 'appkey', label: 'APP_KEY do Laravel', hint: 'base64:..., igual ao key:generate' },
]

export const limitesValidos = { tamanho: [8, 128], quantidade: [1, 1000] }

const dentro = (valor, [min, max]) => Number.isInteger(valor) && valor >= min && valor <= max

// { saida } | { erro }
export function processar(tipo, { tamanho = 20, quantidade = 1 } = {}) {
    if (tipo === 'appkey') return { saida: `base64:${randomBytes(32).toString('base64')}` }
    if (tipo === 'token') return { saida: randomBytes(32).toString('hex') }
    if (tipo === 'senha') {
        if (!dentro(tamanho, limitesValidos.tamanho)) return { erro: 'Use um tamanho entre 8 e 128.' }
        return { saida: senha(tamanho) }
    }
    if (tipo === 'uuid') {
        if (!dentro(quantidade, limitesValidos.quantidade)) return { erro: 'Use uma quantidade entre 1 e 1000.' }
        return { saida: Array.from({ length: quantidade }, () => randomUUID()).join('\n') }
    }
    return { erro: `Tipo desconhecido: ${tipo}` }
}
