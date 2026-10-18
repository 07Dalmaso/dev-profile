#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import * as p from '@clack/prompts'
import c from 'picocolors'

// Aborta limpo quando o usuario da Ctrl+C em qualquer prompt.
function ask(value) {
    if (p.isCancel(value)) {
        p.cancel('Operacao cancelada.')
        process.exit(0)
    }
    return value
}

const ACOES = [
    { value: 'alter', label: 'alter' },
    { value: 'create', label: 'create' },
    { value: 'update', label: 'update' },
    { value: 'insert', label: 'insert' },
    { value: 'delete', label: 'delete' },
    { value: 'drop', label: 'drop' },
]

const TIPOS = [
    { value: 'procedure', label: 'procedure' },
    { value: 'view', label: 'view' },
    { value: 'function', label: 'function' },
    { value: 'table', label: 'table' },
]

// Convencao de nome dos objetos do banco; table fica livre.
const PREFIXOS = { procedure: 'sp_', function: 'fn_', view: 'vw_' }

// Valores sentinela: nao colidem com nenhum nome de conexao vindo do projeto.
const AUTO = Symbol('auto')
const OUTRA = Symbol('outra')

function escolherAcao() {
    return p.select({ message: 'Acao', options: ACOES })
}

function escolherTipo() {
    return p.select({ message: 'Tipo', options: TIPOS })
}

// Tokeniza o PHP so o suficiente para achar chaves de array: strings, '=>' e
// abre/fecha de [ ] e ( ). Comentarios sao pulados; o resto e ignorado.
function tokenizar(fonte) {
    const tokens = []
    let i = 0

    while (i < fonte.length) {
        const ch = fonte[i]
        const dois = fonte.slice(i, i + 2)

        if (dois === '//' || ch === '#') {
            const fim = fonte.indexOf('\n', i)
            i = fim === -1 ? fonte.length : fim
        } else if (dois === '/*') {
            const fim = fonte.indexOf('*/', i + 2)
            i = fim === -1 ? fonte.length : fim + 2
        } else if (ch === "'" || ch === '"') {
            let valor = ''
            i++
            while (i < fonte.length && fonte[i] !== ch) {
                if (fonte[i] === '\\') i++
                valor += fonte[i++] ?? ''
            }
            i++
            tokens.push({ tipo: 'str', valor })
        } else if (dois === '=>') {
            tokens.push({ tipo: '=>' })
            i += 2
        } else {
            if (ch === '[' || ch === '(') tokens.push({ tipo: 'abre' })
            else if (ch === ']' || ch === ')') tokens.push({ tipo: 'fecha' })
            i++
        }
    }

    return tokens
}

// Le as chaves de 'connections' no config/database.php do projeto, sem executar PHP.
function lerConexoes(arquivo = 'config/database.php') {
    if (!existsSync(arquivo)) return []

    const t = tokenizar(readFileSync(arquivo, 'utf8'))
    const inicio = t.findIndex((tok, i) =>
        tok.tipo === 'str' && tok.valor === 'connections' &&
        t[i + 1]?.tipo === '=>' && t[i + 2]?.tipo === 'abre')
    if (inicio === -1) return []

    const nomes = []
    let nivel = 0

    for (let i = inicio + 2; i < t.length; i++) {
        const tok = t[i]
        if (tok.tipo === 'abre') nivel++
        else if (tok.tipo === 'fecha' && --nivel === 0) break
        else if (nivel === 1 && tok.tipo === 'str' && t[i + 1]?.tipo === '=>') nomes.push(tok.valor)
    }

    return nomes
}

// Retorna o nome da conexao, ou null para deixar o comando decidir.
async function escolherBase() {
    const conexoes = lerConexoes()
    if (!conexoes.length) p.log.warn('Nenhuma conexao encontrada em config/database.php.')

    const base = ask(await p.select({
        message: 'Base',
        options: [
            { value: AUTO, label: 'automatica', hint: 'sem --database, o comando decide' },
            ...conexoes.map((nome) => ({ value: nome, label: nome })),
            { value: OUTRA, label: 'outra...', hint: 'digitar o nome da conexao' },
        ],
    }))

    if (base === AUTO) return null
    if (base !== OUTRA) return base

    return ask(await p.text({
        message: 'Nome da conexao',
        validate: (valor) => {
            if (!valor || !valor.trim()) return 'Nome nao pode ser vazio.'
        },
    })).trim()
}

// Mesma normalizacao do script original: minusculo, espacos viram underscore.
function normalizar(nome) {
    return nome.toLowerCase().trim().replace(/\s+/g, '_')
}

// Objetos do banco mantem a caixa original; so os espacos viram underscore.
function normalizarObjeto(nome) {
    return nome.trim().replace(/\s+/g, '_')
}

function validarNome(valor) {
    if (!valor || !valor.trim()) return 'Nome nao pode ser vazio.'
    if (!/^[A-Za-z0-9_\s]+$/.test(valor)) return 'Use apenas letras, numeros, underscore e espaco.'
}

function listarMigrations(dir) {
    return existsSync(dir) ? readdirSync(dir).filter((arquivo) => arquivo.endsWith('.php')) : []
}

function executar(comando, args, opcoes = {}) {
    return new Promise((resolve) => {
        const filho = spawn(comando, args, { stdio: 'inherit', ...opcoes })
        filho.on('error', (err) => {
            console.error(c.red(`Falha ao executar ${comando}: ${err.message}`))
            resolve(1)
        })
        filho.on('exit', (code) => resolve(code ?? 1))
    })
}

// `code` e um .cmd no Windows, e o Node so executa .cmd via shell.
function abrirNoEditor(arquivo) {
    return executar('code', ['-g', `"${arquivo}"`], { shell: true, stdio: 'ignore' })
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
await abrirNoEditor(arquivo)

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
