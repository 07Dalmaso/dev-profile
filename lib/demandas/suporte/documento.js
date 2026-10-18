// Monta o relatorio de concluidas em Markdown (para editar e colar) e em HTML
// (para abrir no navegador e salvar como PDF com Ctrl+P). Os dois saem dos
// mesmos dados, entao trazem o mesmo conteudo.
import { formatarData } from './periodo.js'

const DIA = 24 * 3600 * 1000
const SEM_PROJETO = 'sem projeto'

function duracao(issue) {
    const dias = Math.round((issue.concluida - issue.criada) / DIA)
    if (dias < 1) return 'mesmo dia'
    return `${dias} dia${dias > 1 ? 's' : ''}`
}

// Projetos em ordem alfabetica, "sem projeto" por ultimo.
function porProjeto(issues) {
    const grupos = new Map()
    for (const issue of issues) {
        const nome = issue.projeto ?? SEM_PROJETO
        if (!grupos.has(nome)) grupos.set(nome, [])
        grupos.get(nome).push(issue)
    }
    return [...grupos.entries()].sort(([a], [b]) => (a === SEM_PROJETO) - (b === SEM_PROJETO) || a.localeCompare(b))
}

function contagem(issues, chave, ordem) {
    const contas = {}
    for (const issue of issues) contas[issue[chave] ?? '-'] = (contas[issue[chave] ?? '-'] ?? 0) + 1
    const nomes = ordem ? ordem.filter((nome) => contas[nome]) : Object.keys(contas).sort()
    return nomes.map((nome) => [nome, contas[nome]])
}

// Comentario de conclusao numa linha so, para caber na tabela.
const observacao = (issue) => (issue.observacao ?? '').replace(/\s+/g, ' ').trim()

export function markdown({ titulo, periodo, projeto, issues }) {
    // | quebraria a tabela; < e > virariam tag HTML em quem renderiza o .md.
    const celula = (texto) => String(texto).replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const linhas = [
        `# ${titulo}`,
        '',
        `**Periodo:** ${formatarData(periodo.de)} a ${formatarData(periodo.ate)}  `,
        `**Projeto:** ${projeto ?? 'todos'}  `,
        `**Gerado em:** ${new Date().toLocaleString('pt-BR')}`,
        '',
        `## Resumo: ${issues.length} demanda${issues.length === 1 ? '' : 's'} concluida${issues.length === 1 ? '' : 's'}`,
        '',
    ]
    if (!projeto) linhas.push(`- Por projeto: ${porProjeto(issues).map(([nome, lista]) => `${nome} (${lista.length})`).join(', ')}`)
    linhas.push(`- Por prioridade: ${contagem(issues, 'prioridade', ['alta', 'media', 'baixa', '-']).map(([nome, qtd]) => `${nome === '-' ? 'sem prioridade' : nome} (${qtd})`).join(', ')}`, '')

    for (const [nome, lista] of porProjeto(issues)) {
        linhas.push(`## ${nome} (${lista.length})`, '',
            '| # | Demanda | Prioridade | Aberta | Concluida | Tempo | Observacao |',
            '| --- | --- | --- | --- | --- | --- | --- |')
        for (const issue of lista) {
            linhas.push(`| [#${issue.numero}](${issue.url}) | ${celula(issue.titulo)} | ${issue.prioridade ?? '-'} | ${formatarData(issue.criada)} | ${formatarData(issue.concluida)} | ${duracao(issue)} | ${celula(observacao(issue))} |`)
        }
        linhas.push('')
    }
    return linhas.join('\n')
}

const escapar = (texto) => String(texto).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch])

export function html({ titulo, periodo, projeto, issues }) {
    const resumoProjetos = projeto ? '' : porProjeto(issues)
        .map(([nome, lista]) => `<div class="cartao"><b>${lista.length}</b><span>${escapar(nome)}</span></div>`).join('')
    const secoes = porProjeto(issues).map(([nome, lista]) => `
  <h2>${escapar(nome)} <small>${lista.length}</small></h2>
  <table>
    <thead><tr><th>#</th><th>Demanda</th><th>Prioridade</th><th>Aberta</th><th>Concluida</th><th>Tempo</th><th>Observacao</th></tr></thead>
    <tbody>${lista.map((issue) => `
      <tr>
        <td><a href="${escapar(issue.url)}">#${issue.numero}</a></td>
        <td>${escapar(issue.titulo)}</td>
        <td>${issue.prioridade ? `<span class="prio ${issue.prioridade}">${issue.prioridade}</span>` : '-'}</td>
        <td>${formatarData(issue.criada)}</td>
        <td>${formatarData(issue.concluida)}</td>
        <td>${duracao(issue)}</td>
        <td class="obs">${escapar(observacao(issue))}</td>
      </tr>`).join('')}
    </tbody>
  </table>`).join('')

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapar(titulo)}</title>
<style>
  body { font-family: "Segoe UI", system-ui, sans-serif; color: #1f2328; background: #fff; margin: 32px auto; max-width: 1000px; padding: 0 16px; }
  h1 { margin-bottom: 4px; }
  .meta { color: #59636e; margin-bottom: 24px; }
  .cartoes { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
  .cartao { border: 1px solid #d1d9e0; border-radius: 8px; padding: 10px 16px; min-width: 90px; }
  .cartao b { display: block; font-size: 24px; }
  .cartao span { color: #59636e; font-size: 13px; }
  .cartao.total { background: #f6f8fa; }
  h2 { border-bottom: 1px solid #d1d9e0; padding-bottom: 4px; margin-top: 32px; }
  h2 small { color: #59636e; font-weight: normal; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eaeef2; vertical-align: top; }
  th { background: #f6f8fa; font-weight: 600; }
  td.obs { color: #59636e; }
  a { color: #0969da; text-decoration: none; }
  .prio { border-radius: 10px; padding: 1px 8px; font-size: 12px; color: #fff; }
  .prio.alta { background: #b60205; } .prio.media { background: #9a6700; } .prio.baixa { background: #1a7f37; }
  .dica { color: #59636e; font-size: 13px; margin-top: 32px; }
  @media print { body { margin: 0; } .dica { display: none; } a { color: inherit; } }
</style>
</head>
<body>
  <h1>${escapar(titulo)}</h1>
  <div class="meta">${formatarData(periodo.de)} a ${formatarData(periodo.ate)} - projeto: ${escapar(projeto ?? 'todos')} - gerado em ${new Date().toLocaleString('pt-BR')}</div>
  <div class="cartoes"><div class="cartao total"><b>${issues.length}</b><span>concluidas</span></div>${resumoProjetos}</div>
  ${secoes || '<p>Nenhuma demanda concluida no periodo.</p>'}
  <p class="dica">Para salvar em PDF: Ctrl+P e escolha "Salvar como PDF".</p>
</body>
</html>
`
}
