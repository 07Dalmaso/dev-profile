// Descobre os comandos lendo a pasta comandos/: a subpasta e a area, o nome do
// arquivo e o comando e o primeiro comentario e a descricao. Comando novo
// aparece sem registrar em lugar nenhum.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PASTA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'comandos')

// O proprio dev fica fora da lista e da config: desativado, nao daria para reativar.
export const FIXOS = ['dev']

const AREAS = { git: 'Git', php: 'PHP', ferramentas: 'Ferramentas', demandas: 'Demandas', navegador: 'Navegador' }
export const nomeArea = (area) => AREAS[area] ?? area.charAt(0).toUpperCase() + area.slice(1)

// Primeira linha `# ...` ou `// ...`, pulando o `#!/usr/bin/env node`.
function descricaoDe(arquivo) {
    const linhas = readFileSync(arquivo, 'utf8').replace(/^﻿/, '').split(/\r?\n/)
    const comentario = linhas.find((linha) => /^(#(?!!)|\/\/)/.test(linha))
    return comentario?.replace(/^(#|\/\/)\s*/, '').trim() ?? ''
}

export function lerComandos() {
    return readdirSync(PASTA, { withFileTypes: true })
        .filter((item) => item.isDirectory())
        .flatMap((area) => readdirSync(join(PASTA, area.name))
            .filter((arquivo) => /\.(ps1|js)$/.test(arquivo))
            .map((arquivo) => ({
                nome: arquivo.replace(/\.(ps1|js)$/, ''),
                area: area.name,
                powershell: arquivo.endsWith('.ps1'),
                descricao: descricaoDe(join(PASTA, area.name, arquivo)),
            })))
        .filter((cmd) => !FIXOS.includes(cmd.nome))
}
