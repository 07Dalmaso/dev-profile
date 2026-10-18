// Parar o servidor e o Vite DESTE projeto, sem derrubar outros php/node.
import { execFileSync } from 'node:child_process'
import * as p from '@clack/prompts'
import { ask } from '../comum/prompts.js'

// Processos php/node cuja linha de comando cita a pasta do projeto: o
// `php -S` que o serve cria e o Vite (node_modules\...\vite.js). O
// `php artisan serve` pai nao cita a pasta, entao entra pelo filho.
function processosDoProjeto() {
    const script = `
        $dir = $env:PHPT_DIR.ToLower()
        $todos = Get-CimInstance Win32_Process -Filter "Name='php.exe' OR Name='node.exe'"
        $alvo = @($todos | Where-Object { $_.CommandLine -and $_.CommandLine.ToLower().Contains($dir) })
        $pais = @($alvo | ForEach-Object { $pai = $_.ParentProcessId; $todos | Where-Object { $_.ProcessId -eq $pai -and $_.CommandLine -match '(artisan|yii)\\s+serve' } })
        @($alvo) + @($pais) | Sort-Object ProcessId -Unique | ForEach-Object { "$($_.ProcessId)\`t$($_.Name)\`t$($_.CommandLine)" }`
    const saida = execFileSync('powershell.exe', ['-NoProfile', '-Command', script], {
        encoding: 'utf8',
        env: { ...process.env, PHPT_DIR: process.cwd() },
    })
    return saida.split(/\r?\n/).filter(Boolean).map((linha) => {
        const [pid, nome, comando] = linha.split('\t')
        return { pid: Number(pid), nome, comando }
    })
}

export default {
    id: 'parar',
    label: 'parar servidor e Vite deste projeto',
    hint: 'nao mexe em outros php/node',
    fw: ['laravel', 'yii'],
    async executar() {
        const processos = processosDoProjeto()
        if (!processos.length) return p.log.info('Nenhum servidor ou Vite deste projeto rodando.')

        const curto = (texto) => texto.length > 90 ? `${texto.slice(0, 87)}...` : texto
        p.note(processos.map((proc) => `${String(proc.pid).padEnd(7)} ${curto(proc.comando)}`).join('\n'), 'Processos deste projeto')

        const ok = ask(await p.confirm({ message: `Encerrar ${processos.length} processo(s)?`, active: 'sim', inactive: 'nao' }))
        if (!ok) return

        for (const { pid } of processos) {
            try {
                process.kill(pid)
            } catch {
                // Ja tinha saido junto com o pai.
            }
        }
        p.log.success('Servidor e Vite deste projeto encerrados.')
    },
}
