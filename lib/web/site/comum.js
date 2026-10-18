// Pecas comuns do site DalmasoDev. Todo dado entra na pagina como texto
// (textContent), nunca como HTML: um titulo ou texto colado malicioso nao
// executa nada. Links so para github.com.

// --- sessao e API -----------------------------------------------------------

// A chave chega no #k=... do link que o terminal abre. Fica so nesta aba
// (sessionStorage) e sai da barra de endereco.
export function lerSessao() {
    const params = new URLSearchParams(location.hash.slice(1))
    const doLink = params.get('k')
    let chave = doLink
    try {
        if (doLink) sessionStorage.setItem('dalmasodev-chave', doLink)
        else chave = sessionStorage.getItem('dalmasodev-chave')
    } catch {
        // Sem sessionStorage: vale so o que veio no link.
    }
    if (doLink) history.replaceState(null, '', `${location.pathname}#${params.get('aba') ?? ''}`)
    return chave
}

let CHAVE = null
export const definirChave = (chave) => { CHAVE = chave }

async function pedir(caminho, opcoes = {}) {
    const resposta = await fetch(caminho, { ...opcoes, headers: { 'X-Chave': CHAVE ?? '', ...opcoes.headers } })
    const dados = await resposta.json().catch(() => ({}))
    if (!resposta.ok) throw new Error(dados.erro ?? `Erro ${resposta.status}`)
    return dados
}

export const api = (caminho) => pedir(caminho)
export const enviar = (caminho, corpo) => pedir(caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
})

// --- elementos --------------------------------------------------------------

export const $ = (id) => document.getElementById(id)

// el('li', { class: 'item', onclick }, 'texto', outroElemento)
export function el(tag, props = {}, ...filhos) {
    const no = document.createElement(tag)
    for (const [nome, valor] of Object.entries(props)) {
        if (valor === undefined || valor === null || valor === false) continue
        if (nome === 'class') no.className = valor
        else if (nome.startsWith('on')) no.addEventListener(nome.slice(2), valor)
        else no.setAttribute(nome, valor === true ? '' : valor)
    }
    for (const filho of filhos.flat()) {
        if (filho === null || filho === undefined || filho === false) continue
        no.append(filho instanceof Node ? filho : document.createTextNode(String(filho)))
    }
    return no
}

const SVG = 'http://www.w3.org/2000/svg'
export function svg(tag, atributos = {}, texto) {
    const no = document.createElementNS(SVG, tag)
    for (const [nome, valor] of Object.entries(atributos)) no.setAttribute(nome, valor)
    if (texto !== undefined) no.textContent = texto
    return no
}

export function link(url, texto) {
    if (!/^https:\/\/github\.com\//.test(url ?? '')) return el('span', {}, texto)
    return el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, texto)
}

// --- datas ------------------------------------------------------------------

export const DIA = 24 * 3600 * 1000
export const dataCurta = (iso) => new Date(iso).toLocaleDateString('pt-BR')
export const diaMes = (data) => data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
export const isoLocal = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`

export function relativo(iso) {
    const segundos = Math.round((new Date(iso) - Date.now()) / 1000)
    const unidades = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]]
    const [unidade, tamanho] = unidades.find(([, t]) => Math.abs(segundos) >= t) ?? ['minute', 60]
    return new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(Math.round(segundos / tamanho), unidade)
}

// Segunda-feira 00:00 da semana da data.
export function inicioDaSemana(data) {
    const dia = new Date(data.getFullYear(), data.getMonth(), data.getDate())
    return new Date(dia.getTime() - ((dia.getDay() + 6) % 7) * DIA)
}

// --- tooltip ------------------------------------------------------------------

export function mostrarDica(evento, texto) {
    const dica = $('dica')
    dica.textContent = texto
    dica.hidden = false
    dica.style.left = `${evento.clientX + 12}px`
    dica.style.top = `${evento.clientY - 32}px`
}
export const esconderDica = () => { $('dica').hidden = true }

// --- componentes das ferramentas -----------------------------------------------

export function depoisDe(ms, fn) {
    let espera
    return (...args) => {
        clearTimeout(espera)
        espera = setTimeout(() => fn(...args), ms)
    }
}

async function copiarTexto(texto, botao) {
    try {
        await navigator.clipboard.writeText(texto)
        const original = botao.textContent
        botao.textContent = 'copiado'
        setTimeout(() => { botao.textContent = original }, 1200)
    } catch {
        botao.textContent = 'nao foi possivel copiar'
    }
}

export const botaoCopiar = (pegarTexto) => {
    const botao = el('button', { type: 'button', class: 'copiar' }, 'copiar')
    botao.addEventListener('click', () => copiarTexto(pegarTexto(), botao))
    return botao
}

// Caixa de entrada: textarea que aceita arquivo arrastado ou escolhido. Com
// `binario`, o arquivo vai em bytes (base64) para o servidor, sem virar texto.
export function caixaEntrada({ rotulo, placeholder = '', binario = false, linhas = 10, aoMudar }) {
    let arquivo = null
    const nomeArquivo = el('span', { class: 'muted arquivo' })
    const area = el('textarea', { rows: linhas, placeholder, spellcheck: 'false' })
    const seletor = el('input', { type: 'file', hidden: true })

    function limparArquivo() {
        arquivo = null
        nomeArquivo.textContent = ''
        area.disabled = false
    }

    function carregar(file) {
        if (!file) return
        const leitor = new FileReader()
        leitor.onload = () => {
            if (binario) {
                arquivo = { nome: file.name, base64: String(leitor.result).split(',')[1] ?? '' }
                area.value = ''
                area.disabled = true
                nomeArquivo.textContent = `arquivo: ${file.name} (${file.size} bytes)`
            } else {
                limparArquivo()
                area.value = String(leitor.result)
            }
            aoMudar?.()
        }
        if (binario) leitor.readAsDataURL(file)
        else leitor.readAsText(file)
    }

    area.addEventListener('input', () => aoMudar?.())
    area.addEventListener('dragover', (ev) => { ev.preventDefault(); area.classList.add('arrastando') })
    area.addEventListener('dragleave', () => area.classList.remove('arrastando'))
    area.addEventListener('drop', (ev) => {
        ev.preventDefault()
        area.classList.remove('arrastando')
        carregar(ev.dataTransfer.files[0])
    })
    seletor.addEventListener('change', () => carregar(seletor.files[0]))

    const elemento = el('div', { class: 'caixa' },
        el('div', { class: 'caixa-topo' },
            el('label', {}, rotulo),
            el('span', { class: 'acoes' },
                nomeArquivo,
                el('button', { type: 'button', onclick: () => seletor.click() }, 'abrir arquivo'),
                el('button', { type: 'button', onclick: () => { limparArquivo(); area.value = ''; aoMudar?.() } }, 'limpar'))),
        area,
        seletor)

    return {
        elemento,
        texto: () => area.value,
        definir: (valor) => { limparArquivo(); area.value = valor },
        // Corpo para o servidor: { arquivo } (bytes) ou { texto }.
        corpo: () => arquivo ? { arquivo: arquivo.base64 } : { texto: area.value },
        vazio: () => !arquivo && !area.value,
    }
}

// Caixa de saida (somente leitura) com "copiar".
export function caixaSaida(rotulo) {
    const pre = el('pre', { class: 'saida' })
    const elemento = el('div', { class: 'caixa' },
        el('div', { class: 'caixa-topo' }, el('label', {}, rotulo), botaoCopiar(() => pre.textContent)),
        pre)
    return { elemento, mostrar: (texto) => { pre.textContent = texto ?? '' } }
}

// Lista de [rotulo, valor] com "copiar" em cada linha.
export function listaCopiavel(itens) {
    return el('div', { class: 'copiaveis' }, itens.map(([rotulo, valor]) => el('div', { class: 'copiavel' },
        el('span', { class: 'rotulo' }, rotulo),
        el('code', {}, valor),
        botaoCopiar(() => valor))))
}

// Mensagem de status: tipo = erro | aviso | ok | info
export const mensagem = (tipo, ...conteudo) => el('div', { class: `msg ${tipo}` }, ...conteudo)

export function seletor(opcoes, aoMudar, valorInicial) {
    const select = el('select', { onchange: () => aoMudar?.() },
        opcoes.map((opcao) => el('option', { value: opcao.value }, opcao.hint ? `${opcao.label} - ${opcao.hint}` : opcao.label)))
    if (valorInicial) select.value = valorInicial
    return select
}
