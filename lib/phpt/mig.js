// Abrir o mig (menu de migrations) a partir do phpt.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { executar } from '../comum/processo.js'

const MIG = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'comandos', 'php', 'mig.js')

export default {
    id: 'mig',
    label: 'migrations',
    hint: 'abre o mig',
    fw: ['laravel'],
    executar: () => executar(process.execPath, [MIG]),
}
