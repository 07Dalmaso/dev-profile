// Achar porta livre e esperar um servidor responder.
import { connect, createServer } from 'node:net'

// Ocupada se alguem responde nela ou se nao da para escutar nela.
function portaOcupada(porta) {
    return new Promise((resolve) => {
        const socket = connect({ port: porta, host: '127.0.0.1' })
        socket.setTimeout(300)
        socket.once('connect', () => { socket.destroy(); resolve(true) })
        const livre = () => {
            socket.destroy()
            const servidor = createServer()
            servidor.once('error', () => resolve(true))
            servidor.once('listening', () => servidor.close(() => resolve(false)))
            servidor.listen(porta, '127.0.0.1')
        }
        socket.once('error', livre)
        socket.once('timeout', livre)
    })
}

export async function portaLivre(inicio) {
    for (let porta = inicio; porta < inicio + 100; porta++) {
        if (!await portaOcupada(porta)) return porta
    }
    return null
}

// Espera o servidor responder em vez de um sleep fixo (ate 15s).
export async function esperarPorta(porta) {
    for (let i = 0; i < 30; i++) {
        if (await portaOcupada(porta)) return true
        await new Promise((resolve) => setTimeout(resolve, 500))
    }
    return false
}
