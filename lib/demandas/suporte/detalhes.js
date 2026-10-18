// Ver uma demanda: descricao, labels, idade e comentarios.
import * as p from '@clack/prompts'
import c from 'picocolors'
import { relativo } from '../../tools/data.js'
import { gh } from './gh.js'

export function mostrarDetalhes(repo, issue) {
    const dados = gh(['issue', 'view', String(issue.numero), '-R', repo, '--json', 'body,comments,createdAt'], { json: true })
    const corpo = (dados.body || c.dim('(sem descricao)')).split(/\r?\n/)
    const visiveis = corpo.slice(0, 30)

    p.note([
        ...visiveis,
        ...(corpo.length > visiveis.length ? [c.dim(`... mais ${corpo.length - visiveis.length} linhas (abra no navegador)`)] : []),
        '',
        c.dim(`criada ${relativo(new Date(dados.createdAt))} - ${dados.comments.length} comentario(s)`),
    ].join('\n'), `#${issue.numero} ${issue.titulo}`)

    const ultimo = dados.comments.at(-1)
    if (ultimo) p.log.message(`${c.dim(`ultimo comentario (${ultimo.author.login}):`)} ${ultimo.body.split(/\r?\n/)[0]}`)
}
