// php artisan tinker; Ctrl+C ou exit volta ao menu.
import { php } from './suporte/framework.js'

export default {
    id: 'tinker',
    label: 'tinker',
    hint: 'Ctrl+C ou exit para voltar',
    fw: ['laravel'],
    executar: () => php('tinker'),
}
