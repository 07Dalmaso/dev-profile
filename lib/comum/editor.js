// Abrir arquivos no VS Code (ou Bloco de Notas) e esperar o usuario colar.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import * as p from '@clack/prompts'
import { ask } from './prompts.js'

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
