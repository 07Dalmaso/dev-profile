// Configuracao do usuario (comandos desativados), fora do repositorio para
// git pull e install nao desfazerem. O profile-carregar.ps1 le o mesmo arquivo.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ARQUIVO = join(process.env.APPDATA, 'dev-profile', 'config.json')

export function lerConfig() {
    if (!existsSync(ARQUIVO)) return { desativados: [] }
    const config = JSON.parse(readFileSync(ARQUIVO, 'utf8').replace(/^﻿/, ''))
    return { ...config, desativados: config.desativados ?? [] }
}

export function salvarConfig(config) {
    mkdirSync(dirname(ARQUIVO), { recursive: true })
    writeFileSync(ARQUIVO, `${JSON.stringify(config, null, 2)}\n`)
}
