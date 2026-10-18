// Versoes de PHP, Composer, Node e do framework (do composer.lock).
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import * as p from '@clack/prompts'
import c from 'picocolors'
import { FRAMEWORK } from './suporte/framework.js'

function versaoNoLock(pacote) {
    try {
        const lock = JSON.parse(readFileSync('composer.lock', 'utf8'))
        return lock.packages.find((item) => item.name === pacote)?.version
    } catch {
        return null
    }
}

// Primeira linha da saida; composer e um .bat e precisa de shell.
function saidaDe(comando, args, shell = false) {
    try {
        const saida = shell
            ? execFileSync(`${comando} ${args.join(' ')}`, { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] })
            : execFileSync(comando, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        return saida.split('\n')[0].trim()
    } catch {
        return c.dim('nao encontrado')
    }
}

const PACOTE = { laravel: ['Laravel', 'laravel/framework'], yii: ['Yii2', 'yiisoft/yii2'] }

export default {
    id: 'versoes',
    label: 'versoes',
    hint: 'PHP, Composer, Node e framework',
    executar() {
        const linhas = [
            ['PHP', saidaDe('php', ['-v'])],
            ['Composer', saidaDe('composer', ['-V', '--no-ansi'], true)],
            ['Node', saidaDe('node', ['-v'])],
        ]
        if (FRAMEWORK) {
            const [nome, pacote] = PACOTE[FRAMEWORK]
            linhas.push([nome, versaoNoLock(pacote) ?? c.dim('sem composer.lock')])
        }
        p.note(linhas.map(([rotulo, valor]) => `${rotulo.padEnd(9)} ${valor}`).join('\n'), 'Versoes')
    },
}
