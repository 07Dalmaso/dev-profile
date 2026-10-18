// Limpar cache: os 4 *:clear no Laravel, cache/flush-all no Yii2.
import * as p from '@clack/prompts'
import { FRAMEWORK, php } from './suporte/framework.js'

export default {
    id: 'cache',
    label: 'limpar cache',
    fw: ['laravel', 'yii'],
    async executar() {
        if (FRAMEWORK === 'yii') return php('cache/flush-all')
        for (const comando of ['cache:clear', 'config:clear', 'route:clear', 'view:clear']) {
            if (await php(comando) !== 0) return
        }
        p.log.success('Cache do Laravel limpo.')
    },
}
