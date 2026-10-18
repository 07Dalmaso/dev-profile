// Subir o servidor do framework (e o Vite, se pedido). Usado pelas acoes
// ambiente e servidor.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import * as p from '@clack/prompts'
import { executar } from '../../comum/processo.js'
import { FRAMEWORK } from './framework.js'
import { esperarPorta, portaLivre } from './porta.js'

// Janela propria para o servidor, como no laraveldev: os logs dele nao se
// misturam com o Vite, e fechar a janela derruba o servidor.
function abrirServidor(porta) {
    const comando = FRAMEWORK === 'laravel' ? `php artisan serve --port=${porta}` : `php yii serve localhost:${porta}`
    execFileSync('powershell.exe', ['-NoProfile', '-Command',
        `Start-Process powershell -ArgumentList '-NoExit', '-Command', '${comando}'`])
}

const abrirNavegador = (url) => execFileSync('rundll32.exe', ['url.dll,FileProtocolHandler', url])

function temScriptDev() {
    try {
        return Boolean(JSON.parse(readFileSync('package.json', 'utf8')).scripts?.dev)
    } catch {
        return false
    }
}

export async function subir({ vite }) {
    const inicial = FRAMEWORK === 'laravel' ? 8000 : 8080
    const porta = await portaLivre(inicial)
    if (!porta) return p.log.error(`Nenhuma porta livre entre ${inicial} e ${inicial + 99}.`)
    if (porta !== inicial) p.log.warn(`Porta ${inicial} ocupada, usando ${porta}.`)

    abrirServidor(porta)
    const spinner = p.spinner()
    spinner.start(`Subindo o servidor na porta ${porta}`)
    const subiu = await esperarPorta(porta)
    spinner.stop(subiu ? `Servidor em http://127.0.0.1:${porta}` : 'O servidor nao respondeu; veja a janela dele.')
    if (subiu) abrirNavegador(`http://127.0.0.1:${porta}`)

    if (!vite) return
    if (!temScriptDev()) return p.log.warn('Sem script "dev" no package.json: Vite nao iniciado.')
    p.log.step('Iniciando o Vite (Ctrl+C para parar e voltar ao menu)')
    await executar('npm.cmd run dev', [], { shell: true })
}
