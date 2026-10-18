// composer dump-autoload (funciona em qualquer pasta com composer.json).
import { executar } from '../comum/processo.js'

export default {
    id: 'autoload',
    label: 'composer dump-autoload',
    hint: 'classe nova nao encontrada',
    // composer e um .bat: vai como string unica com shell.
    executar: () => executar('composer dump-autoload', [], { shell: true }),
}
