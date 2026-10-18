// php artisan optimize: cache de config, rotas e views.
import { php } from './suporte/framework.js'

export default {
    id: 'optimize',
    label: 'optimize',
    hint: 'cache de config, rotas e views',
    fw: ['laravel'],
    executar: () => php('optimize'),
}
