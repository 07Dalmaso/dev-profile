// php artisan storage:link
import { php } from './suporte/framework.js'

export default {
    id: 'storage',
    label: 'storage:link',
    fw: ['laravel'],
    executar: () => php('storage:link'),
}
