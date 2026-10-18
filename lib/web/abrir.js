// Sobe o DalmasoDev, abre o navegador e espera o Ctrl+C para fechar. Usado
// pelo comando dalmasodev e pelo "painel" do demandas.
import { execFileSync } from 'node:child_process'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { iniciarServidor } from './servidor.js'

const abrirUrl = (url) => execFileSync('rundll32.exe', ['url.dll,FileProtocolHandler', url])

// `aba`: 'demandas', 'json', 'diff'... (vazio = a primeira).
export async function abrirDalmasoDev(aba = '') {
    let servidor
    try {
        servidor = await iniciarServidor()
    } catch (err) {
        return p.log.error(`Nao foi possivel abrir o DalmasoDev: ${err.message}`)
    }

    const url = servidor.url(aba)
    abrirUrl(url)
    p.log.success(`DalmasoDev aberto no navegador ${c.dim('(so neste computador)')}.`)
    p.log.info(`Se a aba nao abriu, use este link (vale enquanto este terminal estiver aberto):\n${c.dim(url)}`)
    p.log.step('Ctrl+C aqui fecha o DalmasoDev.')

    await new Promise((resolve) => {
        const parar = () => {
            process.off('SIGINT', parar)
            resolve()
        }
        process.on('SIGINT', parar)
    })
    await servidor.fechar()
    p.log.info('DalmasoDev fechado.')
}
