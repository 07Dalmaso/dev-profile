// Qual repositorio guarda as demandas. Fica na config do usuario (fora do
// dev-profile), porque a lista e pessoal.
import * as p from '@clack/prompts'
import { lerConfig, salvarConfig } from '../../comum/config.js'
import { ask } from '../../comum/prompts.js'
import { erroGh, gh } from './gh.js'

export const repoSalvo = () => lerConfig().demandas?.repo ?? null

// Pergunta o repositorio e confere que ele existe. So le do GitHub: nao cria nada.
export async function configurarRepo() {
    const repo = ask(await p.text({
        message: 'Repositorio das demandas (dono/nome)',
        placeholder: '07Dalmaso/demandas',
        initialValue: repoSalvo() ?? '',
        validate: (valor) => {
            if (!/^[\w.-]+\/[\w.-]+$/.test(valor?.trim() ?? '')) return 'Use o formato dono/nome.'
        },
    })).trim()

    let info
    try {
        info = gh(['repo', 'view', repo, '--json', 'visibility'], { json: true })
    } catch (err) {
        p.log.error(`Nao achei ${repo}: ${erroGh(err)}`)
        return null
    }
    if (info.visibility !== 'PRIVATE') p.log.warn(`${repo} nao e privado: qualquer pessoa ve suas demandas.`)

    const config = lerConfig()
    salvarConfig({ ...config, demandas: { ...config.demandas, repo } })
    p.log.success(`Demandas em ${repo}.`)
    return repo
}
