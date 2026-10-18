// Escolher o periodo do relatorio: atalhos (semana, mes) ou datas digitadas.
import * as p from '@clack/prompts'
import { ask } from '../../comum/prompts.js'

const DIA = 24 * 3600 * 1000
const inicioDoDia = (data) => new Date(data.getFullYear(), data.getMonth(), data.getDate())
const fimDoDia = (data) => new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59)

// Semana de segunda a domingo.
function semana(deslocamento) {
    const hoje = inicioDoDia(new Date())
    const segunda = new Date(hoje.getTime() - ((hoje.getDay() + 6) % 7) * DIA + deslocamento * 7 * DIA)
    return { de: segunda, ate: fimDoDia(new Date(segunda.getTime() + 6 * DIA)) }
}

function mes(deslocamento) {
    const hoje = new Date()
    const de = new Date(hoje.getFullYear(), hoje.getMonth() + deslocamento, 1)
    return { de, ate: fimDoDia(new Date(de.getFullYear(), de.getMonth() + 1, 0)) }
}

const MESES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

// dd/mm/aaaa (o Date entenderia como mm/dd).
function lerData(texto) {
    const m = texto?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!m) return null
    const data = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
    return data.getDate() === Number(m[1]) ? data : null
}

async function pedirData(message, inicial) {
    return lerData(ask(await p.text({
        message,
        placeholder: 'dd/mm/aaaa',
        initialValue: inicial,
        validate: (valor) => {
            if (!lerData(valor)) return 'Use dd/mm/aaaa.'
        },
    })))
}

export const formatarData = (data) => data.toLocaleDateString('pt-BR')

// Devolve { de, ate, nome }: `nome` vai no titulo e no nome do arquivo.
export async function escolherPeriodo() {
    const hoje = new Date()
    const opcao = ask(await p.select({
        message: 'Periodo',
        initialValue: 'mes',
        options: [
            { value: 'semana', label: 'esta semana' },
            { value: 'semana-passada', label: 'semana passada' },
            { value: 'mes', label: 'este mes' },
            { value: 'mes-passado', label: 'mes passado' },
            { value: '30', label: 'ultimos 30 dias' },
            { value: 'datas', label: 'escolher as datas' },
        ],
    }))

    switch (opcao) {
        case 'semana': return { ...semana(0), nome: 'semana' }
        case 'semana-passada': return { ...semana(-1), nome: 'semana-passada' }
        case 'mes':
        case 'mes-passado': {
            const periodo = mes(opcao === 'mes' ? 0 : -1)
            return { ...periodo, nome: `${MESES[periodo.de.getMonth()]}-${periodo.de.getFullYear()}` }
        }
        case '30': return { de: inicioDoDia(new Date(hoje.getTime() - 29 * DIA)), ate: fimDoDia(hoje), nome: 'ultimos-30-dias' }
    }

    const de = await pedirData('De', formatarData(mes(0).de))
    const ate = fimDoDia(await pedirData('Ate', formatarData(hoje)))
    const iso = (data) => data.toISOString().slice(0, 10)
    return { de, ate, nome: `${iso(de)}_a_${iso(ate)}` }
}
