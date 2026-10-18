// Pecas comuns das ferramentas: prompts, clipboard, leitura de arquivo e
// entrega do resultado.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import * as p from '@clack/prompts'
import c from 'picocolors'

// Aborta limpo quando o usuario da Ctrl+C em qualquer prompt.
export function ask(value) {
    if (p.isCancel(value)) {
        p.cancel('Operacao cancelada.')
        process.exit(0)
    }
    return value
}

export function sair(msg) {
    console.error(c.red(msg))
    process.exit(2)
}

// UTF-8 nos dois sentidos, senao o PowerShell 5.1 estraga os acentos.
function powershell(script, entrada) {
    const prefixo = '[Console]::InputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8; '
    return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', prefixo + script], {
        encoding: 'utf8',
        input: entrada,
    })
}

// Write em vez de saida normal para nao ganhar uma quebra de linha no fim.
export function lerClipboard() {
    try {
        return powershell('[Console]::Out.Write((Get-Clipboard -Raw))')
    } catch (err) {
        sair(`Nao foi possivel ler o clipboard: ${err.message}`)
    }
}

export function copiar(texto) {
    try {
        powershell('Set-Clipboard -Value ([Console]::In.ReadToEnd())', texto)
        return true
    } catch {
        return false
    }
}

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

let vsCode
export function temVsCode() {
    if (vsCode === undefined) {
        try {
            execFileSync('where.exe', ['code'], { stdio: 'ignore' })
            vsCode = true
        } catch {
            vsCode = false
        }
    }
    return vsCode
}

// `code` e um .cmd no Windows, e o Node so executa .cmd via shell; o comando
// vai como uma string so, porque o Node 24 avisa (DEP0190) quando recebe
// shell + lista de argumentos. Sem VS Code, cai no Bloco de Notas. Nao espera
// fechar: quem chama confirma no terminal.
export function abrirNoEditor(arquivos, args = []) {
    if (temVsCode()) {
        const comando = ['code', ...args, ...arquivos.map((arquivo) => `"${arquivo}"`)].join(' ')
        spawn(comando, { shell: true, stdio: 'ignore', detached: true }).unref()
    } else {
        for (const arquivo of arquivos) spawn('notepad.exe', [arquivo], { stdio: 'ignore', detached: true }).unref()
    }
}

// Sempre a mesma pasta e os mesmos nomes: nao acumula lixo no %TEMP%.
export function arquivoTemporario(nome, conteudo = '') {
    const pasta = join(tmpdir(), 'dev-profile')
    mkdirSync(pasta, { recursive: true })
    const caminho = join(pasta, nome)
    writeFileSync(caminho, conteudo)
    return caminho
}

// Espera o usuario colar e salvar. Arquivo ainda vazio quase sempre e Ctrl+S
// esquecido, entao pergunta de novo em vez de seguir com texto vazio.
export async function esperarArquivos(arquivos) {
    while (true) {
        const pronto = ask(await p.confirm({
            message: 'Cole o texto, salve (Ctrl+S) e confirme aqui',
            active: 'pronto',
            inactive: 'cancelar',
        }))
        if (!pronto) {
            p.cancel('Operacao cancelada.')
            process.exit(0)
        }

        const textos = arquivos.map((arquivo) => readFileSync(arquivo, 'utf8'))
        const vazios = arquivos.filter((_, i) => !textos[i])
        if (!vazios.length) return textos
        p.log.warn(`Ainda vazio: ${vazios.map((arquivo) => basename(arquivo)).join(', ')}. Salvou com Ctrl+S?`)
    }
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

function avisarCopia(texto) {
    if (copiar(texto)) p.log.success('Copiado para o clipboard.')
    else p.log.warn('Nao foi possivel copiar para o clipboard.')
}

// Resultado unico: mostra e ja copia.
export function entregar(texto) {
    console.log(`\n${texto}\n`)
    avisarCopia(texto)
}

const NAO_COPIAR = Symbol('nao copiar')

// Varios resultados ([rotulo, valor]): mostra todos e copia o escolhido.
export async function escolherECopiar(itens, message = 'Copiar qual?') {
    const largura = Math.max(...itens.map(([rotulo]) => rotulo.length))
    const curto = (valor) => valor.length > 70 ? `${valor.slice(0, 67)}...` : valor

    const valor = ask(await p.select({
        message,
        options: [
            ...itens.map(([rotulo, valor]) => ({ value: valor, label: `${rotulo.padEnd(largura)}  ${curto(valor)}` })),
            { value: NAO_COPIAR, label: c.dim('nao copiar') },
        ],
    }))

    if (valor !== NAO_COPIAR) avisarCopia(valor)
}
