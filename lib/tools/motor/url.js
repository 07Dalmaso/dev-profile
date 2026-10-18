// Motor de URL: encode, decode e separar host, caminho e parametros.

export const ACOES = [
    { value: 'analisar', label: 'analisar URL', hint: 'host, caminho e parametros' },
    { value: 'decodificar', label: 'decodificar', hint: '%20 vira espaco' },
    { value: 'codificar', label: 'codificar', hint: 'para usar como valor de parametro' },
]

function analisar(texto) {
    let url
    try {
        url = new URL(texto.trim())
    } catch {
        return { erro: 'URL invalida. Ela precisa ter o protocolo (https://...).' }
    }

    const partes = [
        ['protocolo', url.protocol.replace(/:$/, '')],
        ['host', url.hostname],
        ['porta', url.port],
        ['caminho', decodeURIComponent(url.pathname)],
        ['ancora', url.hash.replace(/^#/, '')],
    ].filter(([, valor]) => valor)

    // Chave repetida (filtro[]=a&filtro[]=b) vira lista.
    const params = {}
    for (const [chave, valor] of url.searchParams) {
        if (chave in params) params[chave] = [].concat(params[chave], valor)
        else params[chave] = valor
    }
    return { partes, params: Object.keys(params).length ? params : null }
}

// analisar: { partes, params } | codificar/decodificar: { saida } | { erro }
export function processar(acao, texto) {
    if (acao === 'analisar') return analisar(texto)
    if (acao === 'codificar') return { saida: encodeURIComponent(texto) }
    try {
        return { saida: decodeURIComponent(texto) }
    } catch {
        return { erro: 'Texto com % invalido (ex.: um % sem dois digitos depois).' }
    }
}
