// Abrir as demandas (ou uma delas) no navegador.
import { execFileSync } from 'node:child_process'

export const abrirUrl = (url) => execFileSync('rundll32.exe', ['url.dll,FileProtocolHandler', url])

export default {
    id: 'navegador',
    label: 'abrir no navegador',
    executar: (repo) => abrirUrl(`https://github.com/${repo}/issues`),
}
