// Ler e gravar o clipboard do Windows pelo PowerShell.
import { execFileSync } from 'node:child_process'
import { sair } from './prompts.js'

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
