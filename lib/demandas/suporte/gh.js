// Ponte com o GitHub CLI (gh). Instalar, fazer login e criar o repositorio
// ficam com o usuario: aqui so se verifica e se mostra o passo a passo.
import { execFile, execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

// Logo depois de instalar, o terminal (e o VS Code inteiro) ainda tem o PATH
// antigo, sem o gh. Entao, se ele nao estiver no PATH, usa o local onde o
// instalador do winget coloca.
const INSTALADO_EM = [
    join(process.env.ProgramFiles ?? 'C:\\Program Files', 'GitHub CLI', 'gh.exe'),
    join(process.env.LOCALAPPDATA ?? '', 'Programs', 'GitHub CLI', 'gh.exe'),
]

function noPath() {
    try {
        execFileSync('gh', ['--version'], { stdio: 'ignore' })
        return true
    } catch {
        return false
    }
}

// Resolvido no primeiro uso, nao no import: o dev importa a lista de acoes
// (para a configuracao) sem precisar do gh.
let caminho
function GH() {
    caminho ??= noPath() ? 'gh' : INSTALADO_EM.find((item) => existsSync(item)) ?? 'gh'
    return caminho
}

export function gh(args, { json = false } = {}) {
    const saida = execFileSync(GH(), args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return json ? JSON.parse(saida) : saida.trim()
}

// Versao assincrona, para o painel buscar varias coisas em paralelo sem travar.
export function ghAsync(args, { json = false } = {}) {
    return new Promise((resolve, reject) => {
        execFile(GH(), args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }, (err, saida, stderr) => {
            if (err) return reject(Object.assign(err, { stderr }))
            try {
                resolve(json ? JSON.parse(saida) : saida.trim())
            } catch (erro) {
                reject(erro)
            }
        })
    })
}

// Mensagem do gh (stderr) em vez do "Command failed" generico do Node.
export function erroGh(err) {
    return (err.stderr?.toString().trim() || err.message).split('\n')[0]
}

function funciona(args) {
    try {
        execFileSync(GH(), args, { stdio: 'ignore' })
        return true
    } catch {
        return false
    }
}

export const ghInstalado = () => funciona(['--version'])
export const ghLogado = () => funciona(['auth', 'status'])

export const PASSO_A_PASSO = [
    '1. Instale o GitHub CLI:      winget install --id GitHub.cli -e',
    '2. Abra um terminal novo e:   gh auth login',
    '3. Crie o repositorio:        gh repo create demandas --private',
    '   (ou pelo site: github.com/new, marcando Private)',
    '4. Rode demandas de novo e informe o repositorio (ex.: 07Dalmaso/demandas)',
].join('\n')
