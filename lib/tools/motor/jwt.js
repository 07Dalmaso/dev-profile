// Motor do JWT: decodificar o token, as datas e se esta expirado.
// A assinatura NAO e verificada: so le o conteudo.
import { decodificarBase64 } from './base64.js'
import { relativo } from './data.js'

// Claims de data do padrao JWT, em segundos desde 1970.
const DATAS = { iat: 'emitido em', nbf: 'valido a partir de', exp: 'expira em', auth_time: 'autenticado em' }

function parte(texto) {
    const bytes = decodificarBase64(texto)
    if (!bytes) throw new Error('trecho nao e Base64')
    return JSON.parse(bytes.toString('utf8'))
}

// { header, payload, datas: [{ chave, rotulo, local, relativo }], expirado, aindaNaoValido } | { erro }
export function processar(texto) {
    // "Bearer " vem junto quando o token e copiado de um header.
    const partes = texto.trim().replace(/^Bearer\s+/i, '').split('.')
    let header
    let payload
    try {
        if (partes.length < 2) throw new Error('um JWT tem 3 partes separadas por ponto')
        header = parte(partes[0])
        payload = parte(partes[1])
    } catch (err) {
        return { erro: `Token invalido: ${err.message}.` }
    }

    const agora = Date.now() / 1000
    const datas = Object.entries(DATAS)
        .filter(([chave]) => typeof payload[chave] === 'number')
        .map(([chave, rotulo]) => {
            const data = new Date(payload[chave] * 1000)
            return { chave, rotulo, local: data.toLocaleString('pt-BR'), relativo: relativo(data) }
        })

    return {
        header,
        payload,
        datas,
        expirado: typeof payload.exp === 'number' ? payload.exp < agora : null,
        aindaNaoValido: typeof payload.nbf === 'number' && payload.nbf > agora,
    }
}
