// Nova demanda: titulo, prioridade, projeto e descricao. Mostra o resumo e so
// cria no GitHub depois da confirmacao.
import { basename } from 'node:path'
import * as p from '@clack/prompts'
import { abrirNoEditor, arquivoTemporario, esperarArquivos } from '../comum/editor.js'
import { ask } from '../comum/prompts.js'
import { erroGh, gh } from './suporte/gh.js'
import { garantirLabels, PRIORIDADES, projetos } from './suporte/issues.js'
import { nomeDeProjeto, pastaVinculada, projetoDaPasta, raizGit, vincularPasta } from './suporte/projeto-atual.js'

const NENHUM = Symbol('nenhum')
const NOVO = Symbol('novo')

// O projeto da pasta atual ja vem selecionado.
async function escolherProjeto(repo) {
    const existentes = projetos(repo)
    const atual = projetoDaPasta(existentes)
    const projeto = ask(await p.select({
        message: 'Projeto',
        initialValue: atual ?? undefined,
        maxItems: 12,
        options: [
            ...existentes.map((nome) => ({ value: nome, label: nome, hint: nome === atual ? 'esta pasta' : undefined })),
            { value: NOVO, label: 'novo projeto...' },
            { value: NENHUM, label: 'nenhum' },
        ],
    }))
    if (projeto === NENHUM) return null
    if (projeto !== NOVO) return projeto

    return nomeDeProjeto(ask(await p.text({
        message: 'Nome do projeto',
        placeholder: 'ex.: loja',
        validate: (valor) => {
            if (!valor?.trim()) return 'Nome nao pode ser vazio.'
        },
    })))
}

// Pasta de um repositorio git sem projeto vinculado: oferece vincular, para as
// proximas demandas (e o listar) ja virem com esse projeto aqui. So local.
async function oferecerVinculo(projeto) {
    const raiz = raizGit()
    if (!projeto || !raiz || pastaVinculada() || projetoDaPasta([projeto]) === projeto) return

    const ok = ask(await p.confirm({
        message: `Vincular a pasta ${basename(raiz)} ao projeto ${projeto}?`,
        active: 'sim',
        inactive: 'nao',
    }))
    if (ok) p.log.success(`${vincularPasta(projeto)} = projeto ${projeto} (salvo so na sua config).`)
}

// Descricao longa (passos, links, prints) e mais facil no editor.
async function escreverDescricao() {
    const como = ask(await p.select({
        message: 'Descricao',
        options: [
            { value: 'nenhuma', label: 'sem descricao' },
            { value: 'linha', label: 'uma linha' },
            { value: 'editor', label: 'escrever no editor', hint: 'abre um arquivo .md em branco' },
        ],
    }))
    if (como === 'nenhuma') return ''
    if (como === 'linha') return ask(await p.text({ message: 'Descricao', defaultValue: '' })).trim()

    const arquivo = arquivoTemporario('demanda.md')
    abrirNoEditor([arquivo])
    const [texto] = await esperarArquivos([arquivo])
    return texto.trim()
}

export default {
    id: 'nova',
    label: 'nova',
    hint: 'titulo, prioridade, projeto',
    async executar(repo) {
        const titulo = ask(await p.text({
            message: 'Titulo',
            placeholder: 'ex.: Ajustar validacao do login',
            validate: (valor) => {
                if (!valor?.trim()) return 'Titulo nao pode ser vazio.'
            },
        })).trim()
        const prioridade = ask(await p.select({
            message: 'Prioridade',
            initialValue: 'media',
            options: PRIORIDADES.map((pr) => ({ value: pr, label: pr })),
        }))
        const projeto = await escolherProjeto(repo)
        const descricao = await escreverDescricao()

        const labels = [`prioridade:${prioridade}`, ...(projeto ? [`projeto:${projeto}`] : [])]
        p.note([
            `titulo      ${titulo}`,
            `prioridade  ${prioridade}`,
            `projeto     ${projeto ?? '-'}`,
            `descricao   ${descricao ? `${descricao.split('\n').length} linha(s)` : '-'}`,
            `repositorio ${repo}`,
        ].join('\n'), 'Nova demanda')

        const ok = ask(await p.confirm({ message: 'Criar no GitHub?', active: 'sim', inactive: 'nao' }))
        if (!ok) return

        try {
            garantirLabels(repo, labels)
            const url = gh(['issue', 'create', '-R', repo, '--title', titulo, '--body', descricao,
                ...labels.flatMap((label) => ['--label', label])])
            p.log.success(`Criada: ${url}`)
        } catch (err) {
            return p.log.error(`Nao foi possivel criar: ${erroGh(err)}`)
        }
        await oferecerVinculo(projeto)
    },
}
