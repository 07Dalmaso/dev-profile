// Concluir uma demanda: fecha a issue, com um comentario opcional. Pede
// confirmacao antes de enviar.
import * as p from '@clack/prompts'
import { ask } from '../comum/prompts.js'
import { erroGh, gh } from './suporte/gh.js'
import { escolherIssue } from './suporte/issues.js'

export async function concluir(repo, issue) {
    const comentario = ask(await p.text({
        message: 'Comentario de conclusao (opcional)',
        placeholder: 'ex.: entregue na versao 2.3',
        defaultValue: '',
    })).trim()

    const ok = ask(await p.confirm({
        message: `Fechar #${issue.numero} "${issue.titulo}" no GitHub?`,
        active: 'sim',
        inactive: 'nao',
    }))
    if (!ok) return

    try {
        gh(['issue', 'close', String(issue.numero), '-R', repo, ...(comentario ? ['--comment', comentario] : [])])
        p.log.success(`#${issue.numero} concluida.`)
    } catch (err) {
        p.log.error(`Nao foi possivel fechar: ${erroGh(err)}`)
    }
}

export default {
    id: 'concluir',
    label: 'concluir',
    hint: 'fecha a demanda',
    async executar(repo) {
        const issue = await escolherIssue(repo, 'Concluir qual demanda?')
        if (issue) await concluir(repo, issue)
    },
}
