// Ativar e desativar comandos (por area) e os itens dos menus tools, phpt e
// demandas. Comando desativado nao e carregado no terminal (ver
// profile-carregar.ps1); item desativado some do menu dele. No config.json os
// ids sao "gs", "tools:json", "phpt:fila", "demandas:comecar".
import * as p from '@clack/prompts'
import { lerConfig, salvarConfig } from '../comum/config.js'
import { ask, caber } from '../comum/prompts.js'
import { ACOES as ACOES_DEMANDAS } from '../demandas/index.js'
import { ACOES as ACOES_PHPT } from '../phpt/index.js'
import { FERRAMENTAS } from '../tools/index.js'
import { nomeArea } from './comandos.js'

const PRONTO = Symbol('pronto')

function grupos(comandos) {
    const areas = [...new Set(comandos.map((cmd) => cmd.area))].map((area) => ({
        titulo: nomeArea(area),
        itens: comandos.filter((cmd) => cmd.area === area).map((cmd) => ({ id: cmd.nome, nome: cmd.nome, descricao: cmd.descricao })),
    }))
    return [
        ...areas,
        { titulo: 'tools: ferramentas', itens: FERRAMENTAS.map((f) => ({ id: `tools:${f.id}`, nome: f.id, descricao: f.label })) },
        { titulo: 'phpt: acoes', itens: ACOES_PHPT.map((acao) => ({ id: `phpt:${acao.id}`, nome: acao.id, descricao: acao.label })) },
        { titulo: 'demandas: acoes', itens: ACOES_DEMANDAS.map((acao) => ({ id: `demandas:${acao.id}`, nome: acao.id, descricao: acao.label })) },
    ]
}

// Uma lista por vez, com rolagem (maxItems) e texto cortado na largura do
// terminal: lista maior que a tela ou linha que quebra faz o clack duplicar
// linhas ao redesenhar. Devolve a lista de desativados ja atualizada.
async function configurarGrupo(grupo, desativados) {
    const ids = grupo.itens.map((item) => item.id)
    const largura = Math.max(...grupo.itens.map((item) => item.nome.length))

    const ativos = ask(await p.multiselect({
        message: `${grupo.titulo} (espaco marca/desmarca, a marca todos, Enter salva)`,
        maxItems: 10,
        required: false,
        // A descricao vai como hint: aparece so no item do cursor, e o resumo
        // depois do Enter fica so com os nomes.
        options: grupo.itens.map((item) => ({
            value: item.id,
            label: item.nome,
            hint: caber(item.descricao, largura + 12),
        })),
        initialValues: ids.filter((id) => !desativados.includes(id)),
    }))

    return [...desativados.filter((id) => !ids.includes(id)), ...ids.filter((id) => !ativos.includes(id))]
}

export async function configurar(comandos) {
    const lista = grupos(comandos)
    let ultimo

    while (true) {
        const config = lerConfig()
        const indice = ask(await p.select({
            message: 'O que configurar?',
            initialValue: ultimo,
            options: [
                ...lista.map((grupo, i) => {
                    const ativos = grupo.itens.filter((item) => !config.desativados.includes(item.id)).length
                    return { value: i, label: grupo.titulo, hint: `${ativos} de ${grupo.itens.length} ativos` }
                }),
                { value: PRONTO, label: 'pronto' },
            ],
        }))
        if (indice === PRONTO) break

        ultimo = indice
        salvarConfig({ ...config, desativados: await configurarGrupo(lista[indice], config.desativados) })
        p.log.success('Salvo.')
    }

    p.log.info('Comandos valem a partir do proximo terminal; tools e phpt, na proxima vez que abrir.')
}
