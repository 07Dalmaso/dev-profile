import * as p from '@clack/prompts'
import { ask, escolherECopiar, escolherTexto } from '../ui.js'

const UNIDADES = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
]

// "ha 3 dias", "em 2 horas": maior unidade que caiba.
export function relativo(data) {
    const segundos = Math.round((data.getTime() - Date.now()) / 1000)
    const [unidade, tamanho] = UNIDADES.find(([, t]) => Math.abs(segundos) >= t) ?? UNIDADES.at(-1)
    return new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(Math.round(segundos / tamanho), unidade)
}

const dois = (n) => String(n).padStart(2, '0')

// Formato do MySQL e do Laravel (created_at), no horario local.
function sql(data) {
    return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())} ` +
        `${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}`
}

// Numero com 9-10 digitos e segundos, 12-13 e milissegundos. Data brasileira
// (dd/mm/aaaa [hh:mm[:ss]]) e lida a mao: o Date entenderia como mm/dd.
function interpretar(texto) {
    const valor = texto.trim()

    if (/^\d{9,10}$/.test(valor)) return new Date(Number(valor) * 1000)
    if (/^\d{12,13}$/.test(valor)) return new Date(Number(valor))

    const br = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
    if (br) {
        const [, dia, mes, ano, hora = 0, minuto = 0, segundo = 0] = br
        return new Date(ano, mes - 1, dia, hora, minuto, segundo)
    }

    const data = new Date(valor)
    return Number.isNaN(data.getTime()) ? null : data
}

export default {
    id: 'data',
    label: 'Data / timestamp',
    hint: 'unix <-> data, formato MySQL, relativo',
    async executar() {
        const origem = ask(await p.select({
            message: 'Data',
            options: [
                { value: 'converter', label: 'converter um valor', hint: '1729267200, 18/10/2026 14:30, 2026-10-18T17:30:00Z' },
                { value: 'agora', label: 'agora' },
            ],
        }))

        const data = origem === 'agora' ? new Date() : interpretar(await escolherTexto('a data ou timestamp'))
        if (!data) return p.log.error('Nao reconheci essa data. Use timestamp, dd/mm/aaaa [hh:mm] ou ISO (aaaa-mm-dd).')

        p.log.info(`Relativo: ${relativo(data)}`)
        await escolherECopiar([
            ['unix (s)', String(Math.floor(data.getTime() / 1000))],
            ['unix (ms)', String(data.getTime())],
            ['mysql', sql(data)],
            ['iso (UTC)', data.toISOString()],
            ['local', data.toLocaleString('pt-BR')],
        ])
    },
}
