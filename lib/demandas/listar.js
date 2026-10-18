// Listar as demandas abertas (todas ou de um projeto) e agir sobre uma delas.
import * as p from '@clack/prompts'
import { lerConfig } from '../comum/config.js'
import { ask } from '../comum/prompts.js'
import { comecar } from './comecar.js'
import { concluir } from './concluir.js'
import { abrirUrl } from './navegador.js'
import { mostrarDetalhes } from './suporte/detalhes.js'
import { abertas, escolherIssue, projetos } from './suporte/issues.js'
import { projetoDaPasta } from './suporte/projeto-atual.js'

const TODAS = Symbol('todas')
const SEM_PROJETO = Symbol('sem projeto')

// Quais demandas mostrar: um projeto, todas ou as sem projeto, com a contagem
// de cada. O projeto da pasta atual vem primeiro e ja selecionado.
async function escolherFiltro(repo) {
    const lista = abertas(repo)
    const nomes = projetos(repo)
    if (!nomes.length) return () => true

    const atual = projetoDaPasta(nomes)
    const contar = (filtro) => {
        const qtd = lista.filter(filtro).length
        return `${qtd} aberta${qtd === 1 ? '' : 's'}`
    }
    const ordem = atual ? [atual, ...nomes.filter((nome) => nome !== atual)] : nomes

    const escolha = ask(await p.select({
        message: 'Quais demandas?',
        initialValue: atual ?? TODAS,
        maxItems: 12,
        options: [
            ...(atual ? [{ value: atual, label: `${atual} (esta pasta)`, hint: contar((issue) => issue.projeto === atual) }] : []),
            { value: TODAS, label: 'todas', hint: contar(() => true) },
            ...ordem.filter((nome) => nome !== atual).map((nome) => ({ value: nome, label: nome, hint: contar((issue) => issue.projeto === nome) })),
            { value: SEM_PROJETO, label: 'sem projeto', hint: contar((issue) => !issue.projeto) },
        ],
    }))

    if (escolha === TODAS) return () => true
    if (escolha === SEM_PROJETO) return (issue) => !issue.projeto
    return (issue) => issue.projeto === escolha
}

export default {
    id: 'listar',
    label: 'listar',
    hint: 'por projeto; ver, comecar ou concluir',
    async executar(repo) {
        const filtro = await escolherFiltro(repo)

        // Volta para a lista (ja atualizada) depois de cada acao.
        while (true) {
            const issue = await escolherIssue(repo, 'Demandas abertas', filtro)
            if (!issue) return

            // comecar, concluir e navegador somem aqui tambem se desativados.
            const { desativados } = lerConfig()
            const acao = ask(await p.select({
                message: `#${issue.numero} ${issue.titulo}`,
                options: [
                    { value: 'ver', label: 'ver detalhes' },
                    { value: 'comecar', label: 'comecar', hint: 'cria a branch' },
                    { value: 'concluir', label: 'concluir', hint: 'fecha a demanda' },
                    { value: 'navegador', label: 'abrir no navegador' },
                    { value: 'voltar', label: 'voltar a lista' },
                ].filter((opcao) => !desativados.includes(`demandas:${opcao.value}`)),
            }))

            if (acao === 'ver') mostrarDetalhes(repo, issue)
            if (acao === 'comecar') await comecar(repo, issue)
            if (acao === 'concluir') await concluir(repo, issue)
            if (acao === 'navegador') abrirUrl(issue.url)
        }
    },
}
