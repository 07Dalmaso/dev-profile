// Rodar outro programa no mesmo terminal.
import { spawn } from 'node:child_process'
import c from 'picocolors'

// Repassa o terminal para o comando. Ctrl+C encerra so o comando: o menu
// ignora o sinal enquanto ele roda e volta depois. Comando .cmd/.bat (npm,
// composer) vai como string unica com shell (ver abrirNoEditor).
export function executar(comando, args = [], opcoes = {}) {
    return new Promise((resolve) => {
        const ignorar = () => {}
        process.on('SIGINT', ignorar)
        const fim = (codigo) => {
            process.off('SIGINT', ignorar)
            resolve(codigo)
        }

        const filho = spawn(comando, args, { stdio: 'inherit', ...opcoes })
        filho.on('error', (err) => {
            console.error(c.red(`Falha ao executar ${comando}: ${err.message}`))
            fim(1)
        })
        filho.on('exit', (codigo) => fim(codigo ?? 1))
    })
}
