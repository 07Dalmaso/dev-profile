#!/usr/bin/env node
// menu interativo de migrations do Laravel
import { existsSync, readdirSync } from 'node:fs'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { abrirNoEditor } from '../../lib/comum/editor.js'
import { executar } from '../../lib/comum/processo.js'
import { ask } from '../../lib/comum/prompts.js'
import { escolherBase } from '../../lib/mig/conexoes.js'
import { ACOES, normalizar, normalizarObjeto, PREFIXOS, TIPOS, validarNome } from '../../lib/mig/nomes.js'

function escolherAcao() {
    return p.select({ message: 'Acao', options: ACOES })
}

function escolherTipo() {
    return p.select({ message: 'Tipo', options: TIPOS })
}

function listarMigrations(dir) {
    return existsSync(dir) ? readdirSync(dir).filter((arquivo) => arquivo.endsWith('.php')) : []
}


if (!existsSync('artisan')) {
    p.log.error('Este diretorio nao parece ser um projeto Laravel (artisan nao encontrado).')
    process.exit(1)
}

const agora = new Date()
const ano = String(agora.getFullYear())
const mes = String(agora.getMonth() + 1).padStart(2, '0')
const caminho = `database/migrations/${ano}/${mes}`

p.intro(c.bgCyan(c.black(' migrations ')))
p.log.info(`Path: ${c.dim(caminho)}`)

const opcao = ask(await p.select({
    message: 'Comando de migracao',
    options: [
        { value: 'migrate', label: 'migrate', hint: 'roda as migrations pendentes' },
        { value: 'rollback', label: 'migrate:rollback', hint: 'desfaz o ultimo batch' },
        { value: 'refresh', label: 'migrate:refresh', hint: 'desfaz tudo e roda de novo' },
        { value: 'ddl', label: 'make:migration-ddl', hint: 'com objeto (sp, view, function)' },
        { value: 'basico', label: 'make:migration', hint: 'basico' },
        { value: 'acesso', label: 'make:migration-controle-acesso' },
    ],
}))

let args = null
let nomeMigration = null
let objeto = null
let tipo = null
let base = null

switch (opcao) {
    case 'migrate':
        args = ['artisan', 'migrate', `--path=${caminho}`]
        break

    case 'rollback':
        args = ['artisan', 'migrate:rollback', `--path=${caminho}`]
        break

    case 'refresh':
        args = ['artisan', 'migrate:refresh', `--path=${caminho}`]
        break

    // DDL COMPLETO
    case 'ddl': {
        const acao = ask(await escolherAcao())
        tipo = ask(await escolherTipo())
        const prefixo = PREFIXOS[tipo]

        objeto = normalizarObjeto(ask(await p.text({
            message: 'Nome do objeto',
            placeholder: `${prefixo ?? ''}xxx`,
            validate: (valor) => {
                const erro = validarNome(valor)
                if (erro) return erro
                if (prefixo && !normalizarObjeto(valor).toLowerCase().startsWith(prefixo)) {
                    return `${tipo}s devem iniciar com '${prefixo}'.`
                }
            },
        })))

        base = await escolherBase()

        nomeMigration = `${acao}_${objeto}_${tipo}`
        args = ['artisan', 'make:migration-ddl', nomeMigration, objeto]
        if (base) args.push(`--database=${base}`)
        args.push(`--path=${caminho}`)
        break
    }

    // BASICO
    case 'basico': {
        const acao = ask(await escolherAcao())
        tipo = ask(await escolherTipo())

        const nome = normalizar(ask(await p.text({
            message: 'Nome base',
            placeholder: 'tabela ou descricao',
            validate: validarNome,
        })))

        nomeMigration = `${acao}_${nome}_${tipo}`
        args = ['artisan', 'make:migration', nomeMigration, `--path=${caminho}`]
        break
    }

    // CONTROLE DE ACESSO
    case 'acesso': {
        const acao = ask(await escolherAcao())

        const nome = normalizar(ask(await p.text({
            message: 'Nome base',
            placeholder: 'usuario_permissao',
            validate: validarNome,
        })))

        const tabela = ask(await p.text({
            message: 'Nome da tabela (opcional)',
            placeholder: 'deixe vazio para pular',
            defaultValue: '',
        })).trim()

        tipo = 'table'
        nomeMigration = `${acao}_${nome}_${tipo}`

        args = ['artisan', 'make:migration-controle-acesso', nomeMigration, `--path=${caminho}`]
        if (tabela) args.splice(3, 0, `--table=${tabela}`)
        break
    }
}

const linha = `php ${args.join(' ')}`

// Rollback e refresh mexem em dados que ja estao no banco: confirma antes.
if (opcao === 'rollback' || opcao === 'refresh') {
    const ok = ask(await p.confirm({
        message: `${c.yellow(linha)}\n  Isso altera dados no banco. Continuar?`,
        initialValue: false,
    }))

    if (!ok) {
        p.cancel('Operacao cancelada.')
        process.exit(0)
    }
}

if (nomeMigration) {
    const resumo = [
        ['Path', caminho],
        ['Migration', nomeMigration],
        ['Objeto', objeto],
        ['Tipo', tipo],
        ['Base', base],
    ].filter(([, valor]) => valor).map(([rotulo, valor]) => `${rotulo.padEnd(10)} ${valor}`)

    p.note(resumo.join('\n'), 'Resumo da migration')
}

p.outro(`Executando: ${c.yellow(linha)}`)

// Compara a pasta antes e depois para achar o arquivo que o make:* criou.
const antes = listarMigrations(caminho)
const codigo = await executar('php', args)

if (codigo !== 0 || !nomeMigration) process.exit(codigo)

const criado = listarMigrations(caminho).find((arquivo) => !antes.includes(arquivo))
if (!criado) process.exit(0)

const arquivo = `${caminho}/${criado}`
abrirNoEditor([arquivo])

if (opcao === 'ddl') {
    const proxima = ask(await p.select({
        message: 'Proxima acao',
        options: [
            { value: 'nada', label: 'nao fazer nada' },
            { value: 'esta', label: 'executar somente esta migration', hint: criado },
            { value: 'mes', label: 'executar todas as migrations do mes' },
        ],
    }))

    if (proxima !== 'nada') {
        const alvo = proxima === 'esta' ? arquivo : caminho
        process.exit(await executar('php', ['artisan', 'migrate', `--path=${alvo}`]))
    }
}

process.exit(0)
