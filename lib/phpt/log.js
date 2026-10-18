// Ultimo erro do log do framework, com navegacao e abertura no editor.
import { closeSync, createReadStream, existsSync, fstatSync, openSync, readdirSync, readSync, statSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { abrirNoEditor, temVsCode } from '../comum/editor.js'
import { ask } from '../comum/prompts.js'
import { relativo } from '../tools/data.js'
import { FRAMEWORK } from './suporte/framework.js'

const PASTAS_LOG = {
    laravel: ['storage/logs'],
    yii: ['runtime/logs', 'frontend/runtime/logs', 'backend/runtime/logs', 'console/runtime/logs', 'api/runtime/logs'],
}

// Inicio de cada entrada e o nivel dela. Laravel: "[2026-10-18 10:00:00] local.ERROR: ...".
// Yii: "2026-10-18 10:00:00 [ip][user][sessao][error][categoria] ...".
const ENTRADA = {
    laravel: /^\[(\d{4}-\d{2}-\d{2}[ T][\d:]{8})[^\]]*\] \w+\.(\w+):/,
    yii: /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[[^\]]*\]\[[^\]]*\]\[[^\]]*\]\[(\w+)\]/,
}
const NIVEIS_ERRO = new Set(['error', 'critical', 'alert', 'emergency'])

// Log diario (laravel-2026-10-18.log) ou unico: pega o modificado por ultimo.
function arquivoDeLog() {
    const arquivos = PASTAS_LOG[FRAMEWORK]
        .filter((pasta) => existsSync(pasta))
        .flatMap((pasta) => readdirSync(pasta).filter((nome) => nome.endsWith('.log')).map((nome) => join(pasta, nome)))
    return arquivos.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]
}

// Log de producao passa de centenas de MB: le so o final.
function lerFinal(arquivo, limite = 4 * 1024 * 1024) {
    const fd = openSync(arquivo, 'r')
    try {
        const tamanho = fstatSync(fd).size
        const inicio = Math.max(0, tamanho - limite)
        const buffer = Buffer.alloc(tamanho - inicio)
        readSync(fd, buffer, 0, buffer.length, inicio)
        return { texto: buffer.toString('utf8'), inicio }
    } finally {
        closeSync(fd)
    }
}

// Linha absoluta de um byte do arquivo, contando as quebras antes dele. So roda
// quando o usuario pede para abrir no editor.
function contarLinhas(arquivo, ate) {
    return new Promise((resolve) => {
        let linhas = 0
        createReadStream(arquivo, { end: Math.max(0, ate - 1) })
            .on('data', (bloco) => { for (const byte of bloco) if (byte === 10) linhas++ })
            .on('end', () => resolve(linhas))
            .on('error', () => resolve(0))
    })
}

function errosDoLog(texto) {
    const erros = []
    let atual = null
    let bytes = 0

    for (const linha of texto.split('\n')) {
        const m = linha.match(ENTRADA[FRAMEWORK])
        if (m) {
            atual = NIVEIS_ERRO.has(m[2].toLowerCase())
                ? { data: m[1], nivel: m[2].toUpperCase(), linhas: [], byte: bytes }
                : null
            if (atual) erros.push(atual)
        }
        if (atual) atual.linhas.push(linha.replace(/\r$/, ''))
        bytes += Buffer.byteLength(linha) + 1
    }
    return erros
}

export default {
    id: 'log',
    label: 'ultimo erro do log',
    fw: ['laravel', 'yii'],
    async executar() {
        const arquivo = arquivoDeLog()
        if (!arquivo) return p.log.info(`Nenhum log encontrado em ${PASTAS_LOG[FRAMEWORK].join(', ')}.`)

        const { texto, inicio } = lerFinal(arquivo)
        const erros = errosDoLog(texto)
        if (!erros.length) return p.log.success(`Nenhum erro no final de ${arquivo}.`)

        let indice = erros.length - 1
        while (true) {
            const erro = erros[indice]
            const data = new Date(erro.data.replace(' ', 'T'))
            const corpo = erro.linhas.slice(0, 25)
            const resto = erro.linhas.length - corpo.length

            p.log.error(`${erro.nivel} ${c.dim(`${erro.data} (${relativo(data)}) - ${indice + 1} de ${erros.length} no final de ${arquivo}`)}`)
            console.log(`\n${corpo.join('\n')}${resto > 0 ? c.dim(`\n... mais ${resto} linhas`) : ''}\n`)

            const proxima = ask(await p.select({
                message: 'E agora?',
                options: [
                    { value: 'abrir', label: 'abrir no editor nessa linha' },
                    ...(indice > 0 ? [{ value: 'anterior', label: 'ver o erro anterior' }] : []),
                    ...(indice < erros.length - 1 ? [{ value: 'proximo', label: 'ver o erro seguinte' }] : []),
                    { value: 'voltar', label: 'voltar ao menu' },
                ],
            }))

            if (proxima === 'voltar') return
            if (proxima === 'anterior') indice--
            if (proxima === 'proximo') indice++
            if (proxima === 'abrir') {
                // So o VS Code entende arquivo:linha; o Bloco de Notas abre no inicio.
                if (!temVsCode()) return abrirNoEditor([arquivo])
                const linha = await contarLinhas(arquivo, inicio + erro.byte) + 1
                return abrirNoEditor([`${arquivo}:${linha}`], ['-g'])
            }
        }
    },
}
