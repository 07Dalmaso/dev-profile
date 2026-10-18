// DalmasoDev: monta as abas (Demandas + ferramentas) e troca entre elas pelo
// #endereco, para o F5 voltar na mesma aba. A lista de ferramentas vem do
// servidor (a mesma do tools no terminal); cada uma tem a tela em ferramentas/.
import { $, api, definirChave, el, enviar, lerSessao } from './comum.js'
import { iniciar as iniciarDemandas } from './demandas.js'

function mostrarErro(texto) {
    $('erro').textContent = texto
    $('erro').hidden = !texto
}

const chave = lerSessao()
definirChave(chave)

// O que foi desativado no dev > configurar some daqui tambem.
let desativados = []
let FERRAMENTAS = []
if (chave) {
    try {
        ({ desativados, ferramentas: FERRAMENTAS } = await api('/api/config'))
    } catch (err) {
        mostrarErro(err.message)
    }
}

// Ferramenta sem tela no site ainda fica so no terminal.
const modulos = Object.fromEntries((await Promise.all(FERRAMENTAS.map(async (id) => {
    try {
        return [id, (await import(`./ferramentas/${id}.js`)).default]
    } catch {
        return null
    }
}))).filter(Boolean))

const abas = [
    ...(desativados.includes('demandas') ? [] : [{ id: 'demandas', titulo: 'Demandas' }]),
    ...FERRAMENTAS.filter((id) => modulos[id] && !desativados.includes(`tools:${id}`)).map((id) => ({ id, titulo: modulos[id].titulo })),
]

const montadas = new Set()

function abrir(id) {
    const aba = abas.find((item) => item.id === id) ?? abas[0]
    if (!aba) return

    for (const botao of $('abas').children) botao.setAttribute('aria-selected', String(botao.dataset.aba === aba.id))
    $('pagina-demandas').hidden = aba.id !== 'demandas'
    for (const pagina of $('paginas-ferramentas').children) pagina.hidden = pagina.dataset.aba !== aba.id

    // Cada aba e montada so na primeira visita; depois so aparece de novo,
    // com o que estava digitado.
    if (!montadas.has(aba.id)) {
        montadas.add(aba.id)
        if (aba.id === 'demandas') {
            iniciarDemandas()
        } else {
            const modulo = modulos[aba.id]
            const conteudo = el('div', { class: 'ferramenta' })
            $('paginas-ferramentas').append(el('section', { class: 'pagina', 'data-aba': aba.id },
                el('div', { class: 'cabecalho' }, el('div', {}, el('h1', {}, modulo.titulo), el('p', { class: 'sub' }, modulo.descricao))),
                conteudo))
            modulo.montar(conteudo, { chamar: (corpo) => enviar(`/api/ferramentas/${aba.id}`, corpo) })
        }
    }
    document.title = `${aba.titulo} - DalmasoDev`
}

$('abas').replaceChildren(...abas.map((aba) => el('button', {
    type: 'button',
    role: 'tab',
    'data-aba': aba.id,
    onclick: () => { location.hash = aba.id },
}, aba.titulo)))

window.addEventListener('hashchange', () => abrir(location.hash.slice(1)))

if (!chave) mostrarErro('Abra o DalmasoDev pelo terminal: dalmasodev (ou dev > Navegador).')
else abrir(location.hash.slice(1))
