// Aba Demandas do DalmasoDev: numeros, graficos, lista com filtros, linha do
// tempo do codigo de cada demanda e relatorio de concluidas. So leitura.
import {
    $, api, dataCurta, DIA, diaMes, el, esconderDica, inicioDaSemana, isoLocal, link, mostrarDica, relativo, svg,
} from './comum.js'

const PESO = { alta: 0, media: 1, baixa: 2 }
const ordem = (a, b) => (b.andamento - a.andamento) || ((PESO[a.prioridade] ?? 3) - (PESO[b.prioridade] ?? 3)) || (new Date(a.criada) - new Date(b.criada))

function etiquetas(issue) {
    return el('span', { class: 'meta' },
        issue.prioridade && el('span', { class: `etiqueta ${issue.prioridade}` }, issue.prioridade),
        issue.projeto && el('span', { class: 'etiqueta' }, issue.projeto),
        issue.andamento && el('span', { class: 'etiqueta andamento' }, 'em andamento'))
}

// --- graficos ---------------------------------------------------------------

// Coluna com o topo arredondado (4px) e a base reta, apoiada no eixo.
function barraVertical(x, y, largura, altura) {
    const r = Math.min(4, largura / 2, altura)
    return `M${x},${y + altura} V${y + r} Q${x},${y} ${x + r},${y} H${x + largura - r} Q${x + largura},${y} ${x + largura},${y + r} V${y + altura} Z`
}

// Barra deitada com a ponta direita arredondada.
function barraDeitada(x, y, largura, altura) {
    const r = Math.min(4, altura / 2, largura)
    return `M${x},${y} H${x + largura - r} Q${x + largura},${y} ${x + largura},${y + r} V${y + altura - r} Q${x + largura},${y + altura} ${x + largura - r},${y + altura} H${x} Z`
}

function graficoSemanas(concluidas) {
    const alvo = $('grafico-semanas')
    const tabela = $('tabela-semanas')
    alvo.replaceChildren()
    tabela.replaceChildren(el('tr', {}, el('th', {}, 'semana de'), el('th', {}, 'concluidas')))

    const atual = inicioDaSemana(new Date())
    const semanas = Array.from({ length: 12 }, (_, i) => ({ inicio: new Date(atual.getTime() - (11 - i) * 7 * DIA), total: 0 }))
    for (const issue of concluidas) {
        const semana = semanas.find((s) => s.inicio.getTime() === inicioDaSemana(new Date(issue.concluida)).getTime())
        if (semana) semana.total++
    }
    for (const s of semanas) tabela.append(el('tr', {}, el('td', {}, diaMes(s.inicio)), el('td', {}, s.total)))

    if (!semanas.some((s) => s.total)) {
        alvo.append(el('p', { class: 'vazio' }, 'Nenhuma demanda concluida nas ultimas 12 semanas.'))
        return
    }

    const L = 600, A = 220, esq = 28, base = 196, topo = 16
    const maximo = Math.max(...semanas.map((s) => s.total))
    const escala = Math.max(2, maximo % 2 ? maximo + 1 : maximo)
    const banda = (L - esq) / semanas.length
    const larg = Math.min(28, banda * 0.6)
    const y = (valor) => base - (valor / escala) * (base - topo)
    const grafico = svg('svg', { viewBox: `0 0 ${L} ${A}`, role: 'img', 'aria-label': 'Concluidas por semana' })

    for (const valor of [0, escala / 2, escala]) {
        grafico.append(svg('line', { class: 'grade', x1: esq, x2: L, y1: y(valor), y2: y(valor) }))
        grafico.append(svg('text', { class: 'eixo', x: esq - 6, y: y(valor) + 4, 'text-anchor': 'end' }, valor))
    }

    // Rotulo direto so no pico e na semana atual, para nao poluir.
    const pico = semanas.findIndex((s) => s.total === maximo)
    semanas.forEach((s, i) => {
        const x = esq + i * banda + (banda - larg) / 2
        const grupo = svg('g')
        const barra = s.total ? svg('path', { class: 'barra', d: barraVertical(x, y(s.total), larg, base - y(s.total)) }) : null
        const area = svg('rect', { class: 'alvo', x: esq + i * banda, y: topo, width: banda, height: base - topo + 20 })
        area.addEventListener('mousemove', (ev) => {
            mostrarDica(ev, `Semana de ${diaMes(s.inicio)}: ${s.total} concluida${s.total === 1 ? '' : 's'}`)
            barra?.classList.add('ativa')
        })
        area.addEventListener('mouseleave', () => { esconderDica(); barra?.classList.remove('ativa') })
        grupo.append(area)
        if (barra) grupo.append(barra)
        if (s.total && (i === pico || i === semanas.length - 1)) {
            grupo.append(svg('text', { class: 'valor', x: x + larg / 2, y: y(s.total) - 6, 'text-anchor': 'middle' }, s.total))
        }
        grupo.append(svg('text', { class: 'eixo', x: esq + i * banda + banda / 2, y: base + 16, 'text-anchor': 'middle' }, diaMes(s.inicio)))
        grafico.append(grupo)
    })
    alvo.append(grafico)
}

function graficoProjetos(abertas) {
    const alvo = $('grafico-projetos')
    alvo.replaceChildren()
    const contas = new Map()
    for (const issue of abertas) {
        const nome = issue.projeto ?? 'sem projeto'
        contas.set(nome, (contas.get(nome) ?? 0) + 1)
    }
    const linhas = [...contas.entries()].sort((a, b) => b[1] - a[1])
    if (!linhas.length) {
        alvo.append(el('p', { class: 'vazio' }, 'Nenhuma demanda aberta.'))
        return
    }

    const L = 600, alturaLinha = 30, esq = 130, dir = 40
    const A = linhas.length * alturaLinha
    const maximo = Math.max(...linhas.map(([, qtd]) => qtd))
    const grafico = svg('svg', { viewBox: `0 0 ${L} ${A}`, role: 'img', 'aria-label': 'Abertas por projeto' })

    linhas.forEach(([nome, qtd], i) => {
        const yLinha = i * alturaLinha
        const largura = Math.max(4, (qtd / maximo) * (L - esq - dir))
        const nomeCurto = nome.length > 18 ? `${nome.slice(0, 17)}...` : nome
        const area = svg('rect', { class: 'alvo', x: 0, y: yLinha, width: L, height: alturaLinha })
        const barra = svg('path', { class: 'barra', d: barraDeitada(esq, yLinha + 7, largura, alturaLinha - 14) })
        area.addEventListener('mousemove', (ev) => { mostrarDica(ev, `${nome}: ${qtd} aberta${qtd === 1 ? '' : 's'}`); barra.classList.add('ativa') })
        area.addEventListener('mouseleave', () => { esconderDica(); barra.classList.remove('ativa') })
        grafico.append(
            area,
            barra,
            svg('text', { class: 'eixo', x: esq - 8, y: yLinha + alturaLinha / 2 + 4, 'text-anchor': 'end' }, nomeCurto),
            svg('text', { class: 'valor', x: esq + largura + 6, y: yLinha + alturaLinha / 2 + 4 }, qtd),
        )
    })
    alvo.append(grafico)
}

// --- painel -----------------------------------------------------------------

let dados = null

function cartoes() {
    const semana = Date.now() - 7 * DIA
    const valores = [
        [dados.abertas.length, 'abertas'],
        [dados.abertas.filter((i) => i.andamento).length, 'em andamento'],
        [dados.abertas.filter((i) => i.prioridade === 'alta').length, 'alta prioridade'],
        [dados.concluidas.filter((i) => new Date(i.concluida) >= semana).length, 'concluidas nos ultimos 7 dias'],
    ]
    $('cartoes').replaceChildren(...valores.map(([valor, rotulo]) => el('div', { class: 'cartao' }, el('b', {}, valor), el('span', {}, rotulo))))
}

// --- lista e detalhe ----------------------------------------------------------

function opcoesDeProjeto(select, primeira) {
    const atual = select.value
    const nomes = [...new Set([...dados.abertas, ...dados.concluidas].map((i) => i.projeto).filter(Boolean))].sort()
    select.replaceChildren(
        el('option', { value: '' }, primeira),
        ...nomes.map((nome) => el('option', { value: nome }, nome === dados.projetoDaPasta ? `${nome} (esta pasta)` : nome)),
        el('option', { value: '-' }, 'sem projeto'),
    )
    select.value = atual && [...select.options].some((o) => o.value === atual) ? atual : ''
}

const doProjeto = (filtro) => (issue) => !filtro || (filtro === '-' ? !issue.projeto : issue.projeto === filtro)

function renderizarLista() {
    const projeto = $('f-projeto').value
    const prioridade = $('f-prioridade').value
    const status = $('f-status').value
    const busca = $('f-busca').value.trim().toLowerCase()

    const itens = dados.abertas
        .filter(doProjeto(projeto))
        .filter((i) => !prioridade || i.prioridade === prioridade)
        .filter((i) => !status || (status === 'andamento' ? i.andamento : !i.andamento))
        .filter((i) => !busca || i.titulo.toLowerCase().includes(busca) || String(i.numero) === busca.replace('#', ''))
        .sort(ordem)

    $('lista').replaceChildren(...(itens.length ? itens.map((issue) => el('li', {
        class: 'item',
        tabindex: '0',
        'data-numero': issue.numero,
        onclick: () => abrirDetalhe(issue.numero),
        onkeydown: (ev) => { if (ev.key === 'Enter') abrirDetalhe(issue.numero) },
    }, el('span', { class: 'num' }, `#${issue.numero}`), el('span', { class: 'titulo' }, issue.titulo), etiquetas(issue)))
        : [el('li', { class: 'vazio' }, 'Nenhuma demanda com esses filtros.')]))
}

const TIPOS = {
    commit: 'Commit',
    pr: 'Pull request',
    issue: 'Citada em',
    comecou: 'Comecou',
    fechada: 'Concluida',
    reaberta: 'Reaberta',
}

function itemDaLinhaDoTempo(ev) {
    let conteudo
    if (ev.tipo === 'commit') {
        conteudo = [link(ev.url, ev.sha.slice(0, 7)), ev.mensagem ? ` ${ev.mensagem}` : '']
    } else if (ev.tipo === 'pr' || ev.tipo === 'issue') {
        conteudo = [link(ev.url, `${ev.repo}#${ev.numero}`), ` ${ev.titulo}`, ev.tipo === 'pr' ? ` (${ev.estado})` : '']
    } else {
        conteudo = []
    }
    return el('li', { class: ev.tipo },
        el('span', { class: 'tipo' }, TIPOS[ev.tipo]), ' ', ...conteudo,
        el('div', { class: 'quando' }, ev.data ? `${dataCurta(ev.data)} (${relativo(ev.data)})` : ''))
}

async function abrirDetalhe(numero) {
    const painelDetalhe = $('detalhe')
    for (const item of document.querySelectorAll('.item')) item.classList.toggle('selecionado', item.dataset.numero === String(numero))
    $('aba-lista').querySelector('.lista-detalhe').classList.add('aberto')
    painelDetalhe.hidden = false
    painelDetalhe.replaceChildren(el('p', { class: 'muted' }, `Carregando #${numero}...`))

    let d
    try {
        d = await api(`/api/demandas/${numero}`)
    } catch (err) {
        painelDetalhe.replaceChildren(el('p', { class: 'erro' }, err.message))
        return
    }

    const tempo = [...d.linhaDoTempo].sort((a, b) => new Date(a.data ?? 0) - new Date(b.data ?? 0))
    painelDetalhe.replaceChildren(
        el('button', { type: 'button', class: 'fechar', onclick: fecharDetalhe }, 'fechar'),
        el('h2', {}, `#${d.numero} ${d.titulo}`),
        etiquetas(d),
        el('p', { class: 'muted' }, `aberta ${relativo(d.criada)} - `, link(d.url, 'abrir no GitHub')),
        el('div', { class: 'corpo' }, d.corpo || 'Sem descricao.'),
        el('h3', {}, 'Codigo e historico'),
        tempo.length
            ? el('ul', { class: 'tempo' }, tempo.map(itemDaLinhaDoTempo))
            : el('p', { class: 'muted' }, 'Nada ligado ainda. Commits feitos com o gcom numa branch criada pelo "comecar" aparecem aqui.'),
        el('h3', {}, `Comentarios (${d.comentarios.length})`),
        ...d.comentarios.map((c) => el('div', { class: 'comentario' },
            el('div', { class: 'quando' }, `${c.autor} - ${dataCurta(c.data)}`),
            el('div', { class: 'corpo' }, c.texto))),
    )
}

function fecharDetalhe() {
    $('detalhe').hidden = true
    $('aba-lista').querySelector('.lista-detalhe').classList.remove('aberto')
    for (const item of document.querySelectorAll('.item.selecionado')) item.classList.remove('selecionado')
}

// --- concluidas -----------------------------------------------------------------

function periodoDoAtalho(atalho) {
    const hoje = new Date()
    const semana = inicioDaSemana(hoje)
    switch (atalho) {
        case 'semana': return [semana, new Date(semana.getTime() + 6 * DIA)]
        case 'semana-passada': return [new Date(semana.getTime() - 7 * DIA), new Date(semana.getTime() - DIA)]
        case 'mes-passado': return [new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1), new Date(hoje.getFullYear(), hoje.getMonth(), 0)]
        case '30': return [new Date(hoje.getTime() - 29 * DIA), hoje]
        default: return [new Date(hoje.getFullYear(), hoje.getMonth(), 1), new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)]
    }
}

function aplicarAtalho() {
    const [de, ate] = periodoDoAtalho($('c-periodo').value)
    $('c-de').value = isoLocal(de)
    $('c-ate').value = isoLocal(ate)
    renderizarConcluidas()
}

// Previa com o que ja foi carregado (ultimas 12 semanas); o documento busca o
// periodo inteiro no GitHub.
function renderizarConcluidas() {
    const de = new Date(`${$('c-de').value}T00:00:00`)
    const ate = new Date(`${$('c-ate').value}T23:59:59`)
    const itens = dados.concluidas
        .filter(doProjeto($('c-projeto').value))
        .filter((i) => new Date(i.concluida) >= de && new Date(i.concluida) <= ate)
        .sort((a, b) => new Date(a.concluida) - new Date(b.concluida))
    $('c-lista').replaceChildren(...(itens.length ? itens.map((issue) => el('li', { class: 'item' },
        el('span', { class: 'num' }, `#${issue.numero}`),
        el('span', { class: 'titulo' }, issue.titulo),
        el('span', { class: 'muted' }, dataCurta(issue.concluida)),
        etiquetas(issue)))
        : [el('li', { class: 'vazio' }, 'Nenhuma concluida nesse periodo (a previa cobre as ultimas 12 semanas).')]))
}

async function abrirDocumento() {
    try {
        const { bilhete } = await api('/api/demandas/bilhete')
        const parametros = new URLSearchParams({ b: bilhete, de: $('c-de').value, ate: $('c-ate').value })
        const projeto = $('c-projeto').value
        if (projeto && projeto !== '-') parametros.set('projeto', projeto)
        window.open(`/relatorio?${parametros}`, '_blank', 'noopener')
    } catch (err) {
        mostrarErro(err.message)
    }
}

// --- geral -----------------------------------------------------------------------

function mostrarErro(texto) {
    $('d-erro').textContent = texto
    $('d-erro').hidden = !texto
}

function trocarAba(nome) {
    for (const botao of document.querySelectorAll('.subabas button')) botao.setAttribute('aria-selected', String(botao.dataset.aba === nome))
    for (const aba of document.querySelectorAll('.subaba')) aba.hidden = aba.id !== `aba-${nome}`
}

async function carregar() {
    mostrarErro('')
    $('d-sub').textContent = 'carregando...'
    try {
        dados = await api('/api/demandas/painel')
    } catch (err) {
        $('d-sub').textContent = ''
        mostrarErro(err.message)
        return
    }
    $('d-sub').textContent = `${dados.repo} - atualizado as ${new Date(dados.atualizado).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    cartoes()
    graficoSemanas(dados.concluidas)
    graficoProjetos(dados.abertas)
    const primeiraVez = !$('f-projeto').options.length
    opcoesDeProjeto($('f-projeto'), 'todos os projetos')
    opcoesDeProjeto($('c-projeto'), 'todos os projetos')
    // Na primeira carga, a lista ja abre no projeto da pasta de onde o painel foi aberto.
    if (primeiraVez && dados.projetoDaPasta) $('f-projeto').value = dados.projetoDaPasta
    renderizarLista()
    if (!$('c-de').value) aplicarAtalho()
    else renderizarConcluidas()
}

// Chamado pelo app.js na primeira vez que a aba Demandas abre.
export function iniciar() {
    for (const botao of document.querySelectorAll('.subabas button')) botao.addEventListener('click', () => trocarAba(botao.dataset.aba))
    for (const id of ['f-projeto', 'f-prioridade', 'f-status']) $(id).addEventListener('change', renderizarLista)
    $('f-busca').addEventListener('input', renderizarLista)
    $('c-periodo').addEventListener('change', aplicarAtalho)
    for (const id of ['c-de', 'c-ate', 'c-projeto']) $(id).addEventListener('change', renderizarConcluidas)
    $('c-gerar').addEventListener('click', abrirDocumento)
    $('atualizar').addEventListener('click', carregar)
    carregar()
}
