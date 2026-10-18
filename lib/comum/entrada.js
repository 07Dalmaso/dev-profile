// Pedir um texto ao usuario: clipboard, arquivo novo no editor, arquivo
// existente ou digitado.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename } from 'node:path'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { lerClipboard } from './clipboard.js'
import { abrirNoEditor, arquivoTemporario, esperarArquivos } from './editor.js'
import { ask, sair } from './prompts.js'

export function lerArquivo(arquivo, bruto = false) {
    try {
        return readFileSync(arquivo, bruto ? undefined : 'utf8')
    } catch (err) {
        sair(`Nao foi possivel ler ${arquivo}: ${err.code ?? err.message}`)
    }
}

// Arrastar um arquivo para o terminal cola o caminho entre aspas (e as vezes
// com `& ` na frente, no PowerShell).
export function limparCaminho(valor) {
    return valor.trim().replace(/^&\s*/, '').replace(/^(['"])(.*)\1$/, '$2').trim()
}

function validarArquivo(valor) {
    const caminho = limparCaminho(valor ?? '')
    if (!caminho) return 'Informe o caminho do arquivo.'
    if (!existsSync(caminho) || !statSync(caminho).isFile()) return 'Arquivo nao encontrado.'
}

export function previa(texto) {
    if (Buffer.isBuffer(texto)) return c.dim(`(${texto.length} bytes)`)
    const linhas = texto.split('\n').length
    const inicio = texto.length > 50 ? `${texto.slice(0, 50)}...` : texto
    return `${c.dim(JSON.stringify(inicio))} ${c.dim(`(${texto.length} caracteres, ${linhas} linha${linhas > 1 ? 's' : ''})`)}`
}

const ORIGENS = [
    { value: 'clipboard', label: 'clipboard', hint: 'copie antes de escolher' },
    { value: 'editor', label: 'colar num arquivo novo', hint: 'abre um arquivo em branco no editor' },
    { value: 'arquivo', label: 'arquivo existente', hint: 'caminho, ou arraste o arquivo para o terminal' },
    { value: 'digitar', label: 'digitar', hint: 'uma linha' },
]

// "o texto A" vira "texto-a": nome do arquivo temporario.
const nomeArquivo = (rotulo) => rotulo.replace(/^(o|a)\s+/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')

// `rotulo` completa a pergunta ("o JSON", "o texto A"). `anterior` e o outro
// texto de uma comparacao: se o clipboard ainda tiver ele, o usuario esqueceu
// de copiar o novo. `bruto` devolve arquivo como Buffer (para hash).
// `extensao` do arquivo novo, para o editor colorir (json, sql...).
export async function escolherTexto(rotulo, { anterior, bruto = false, extensao = 'txt' } = {}) {
    const origem = ask(await p.select({ message: `De onde vem ${rotulo}?`, options: ORIGENS }))
    let texto

    if (origem === 'clipboard') {
        texto = lerClipboard()
        if (!texto) {
            p.log.warn('Clipboard vazio. Copie e escolha de novo.')
            return escolherTexto(rotulo, { anterior, bruto, extensao })
        }
        if (texto === anterior) {
            p.log.warn(`O clipboard ainda tem o texto anterior. Copie ${rotulo} e escolha de novo.`)
            return escolherTexto(rotulo, { anterior, bruto, extensao })
        }
    } else if (origem === 'editor') {
        const arquivo = arquivoTemporario(`${nomeArquivo(rotulo)}.${extensao}`)
        abrirNoEditor([arquivo])
        p.log.info(`Abri ${basename(arquivo)} no editor.`)
        ;[texto] = await esperarArquivos([arquivo])
    } else if (origem === 'arquivo') {
        const caminho = limparCaminho(ask(await p.text({
            message: 'Arquivo',
            placeholder: 'C:\\pasta\\arquivo.txt',
            validate: validarArquivo,
        })))
        texto = lerArquivo(caminho, bruto)
    } else {
        texto = ask(await p.text({
            message: 'Texto',
            validate: (valor) => {
                if (!valor) return 'Texto nao pode ser vazio.'
            },
        }))
    }

    p.log.info(`Entrada: ${previa(texto)}`)
    return texto
}
