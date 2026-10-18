// Qual projeto e a pasta atual: o vinculo salvo na config (raiz do git ->
// projeto) ou, sem vinculo, o nome da pasta se ja existir um projeto com ele.
// O vinculo e so local: nada vai para o GitHub.
import { execFileSync } from 'node:child_process'
import { basename } from 'node:path'
import { lerConfig, salvarConfig } from '../../comum/config.js'

// Raiz do repositorio git da pasta atual, ou null fora de um repositorio.
export function raizGit() {
    try {
        return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    } catch {
        return null
    }
}

// Mesmo formato dos nomes de projeto: minusculo, espacos viram hifen.
export const nomeDeProjeto = (texto) => texto.trim().toLowerCase().replace(/\s+/g, '-')

// No Windows, C:/Proj e c:/proj sao a mesma pasta.
const chave = (pasta) => pasta.replace(/\\/g, '/').toLowerCase()

export function projetoDaPasta(existentes) {
    const raiz = raizGit()
    if (!raiz) return null
    const vinculado = lerConfig().demandas?.pastas?.[chave(raiz)]
    if (vinculado) return vinculado
    const nome = nomeDeProjeto(basename(raiz))
    return existentes.includes(nome) ? nome : null
}

export function pastaVinculada() {
    const raiz = raizGit()
    return Boolean(raiz && lerConfig().demandas?.pastas?.[chave(raiz)])
}

export function vincularPasta(projeto) {
    const raiz = raizGit()
    const config = lerConfig()
    const pastas = { ...config.demandas?.pastas, [chave(raiz)]: projeto }
    salvarConfig({ ...config, demandas: { ...config.demandas, pastas } })
    return raiz
}
