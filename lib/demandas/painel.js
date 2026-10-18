// Painel no navegador: graficos, lista com filtros, linha do tempo do codigo
// de cada demanda e relatorio. Roda so neste computador (127.0.0.1) enquanto
// o terminal estiver aberto; Ctrl+C fecha e volta ao menu.
import * as p from '@clack/prompts'
import c from 'picocolors'
import { abrirUrl } from './navegador.js'
import { iniciarPainel } from './painel/servidor.js'

export default {
    id: 'painel',
    label: 'painel no navegador',
    hint: 'graficos, filtros e o codigo ligado a cada demanda',
    async executar(repo) {
        let painel
        try {
            painel = await iniciarPainel(repo)
        } catch (err) {
            return p.log.error(`Nao foi possivel abrir o painel: ${err.message}`)
        }

        abrirUrl(painel.url)
        p.log.success(`Painel aberto no navegador ${c.dim('(so neste computador)')}.`)
        p.log.info(`Se a aba nao abriu, use este link (vale so enquanto o terminal estiver aberto):\n${c.dim(painel.url)}`)
        p.log.step('Ctrl+C para fechar o painel e voltar ao menu.')

        await new Promise((resolve) => {
            const parar = () => {
                process.off('SIGINT', parar)
                resolve()
            }
            process.on('SIGINT', parar)
        })
        await painel.fechar()
        p.log.info('Painel fechado.')
    },
}
