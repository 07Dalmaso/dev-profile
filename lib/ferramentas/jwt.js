import * as p from '@clack/prompts'
import c from 'picocolors'
import { entregar, escolherTexto } from '../ui.js'
import { decodificarBase64 } from './base64.js'
import { relativo } from './data.js'

// Claims de data do padrao JWT, em segundos desde 1970.
const DATAS = { iat: 'emitido em', nbf: 'valido a partir de', exp: 'expira em', auth_time: 'autenticado em' }

function parte(texto) {
    const bytes = decodificarBase64(texto)
    if (!bytes) throw new Error('trecho nao e Base64')
    return JSON.parse(bytes.toString('utf8'))
}

export default {
    id: 'jwt',
    label: 'JWT',
    hint: 'decodificar token, ver expiracao',
    async executar() {
        // "Bearer " vem junto quando o token e copiado de um header.
        const token = (await escolherTexto('o token')).trim().replace(/^Bearer\s+/i, '')
        const partes = token.split('.')

        let header
        let payload
        try {
            if (partes.length < 2) throw new Error('um JWT tem 3 partes separadas por ponto')
            header = parte(partes[0])
            payload = parte(partes[1])
        } catch (err) {
            return p.log.error(`Token invalido: ${err.message}.`)
        }

        p.note(JSON.stringify(header, null, 2), 'Header')

        const datas = Object.entries(DATAS)
            .filter(([chave]) => typeof payload[chave] === 'number')
            .map(([chave, rotulo]) => {
                const data = new Date(payload[chave] * 1000)
                return `${rotulo.padEnd(18)} ${data.toLocaleString('pt-BR')} ${c.dim(`(${relativo(data)})`)}`
            })
        if (datas.length) p.note(datas.join('\n'), 'Datas')

        const agora = Date.now() / 1000
        if (typeof payload.exp === 'number') {
            if (payload.exp < agora) p.log.error('Token EXPIRADO.')
            else p.log.success('Token dentro da validade.')
        }
        if (typeof payload.nbf === 'number' && payload.nbf > agora) p.log.warn('Token ainda nao e valido (nbf no futuro).')

        p.log.warn(c.dim('A assinatura nao e verificada: isso so le o conteudo.'))
        p.log.step('Payload')
        entregar(JSON.stringify(payload, null, 2))
    },
}
