// php artisan queue:work; Ctrl+C volta ao menu.
import { php } from './suporte/framework.js'

export default {
    id: 'fila',
    label: 'processar fila',
    hint: 'queue:work, Ctrl+C para voltar',
    fw: ['laravel'],
    executar: () => php('queue:work'),
}
