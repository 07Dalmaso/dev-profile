// route:list com filtro opcional por URI.
import * as p from '@clack/prompts'
import { ask } from '../comum/prompts.js'
import { php } from './suporte/framework.js'

export default {
    id: 'rotas',
    label: 'rotas',
    hint: 'route:list com filtro',
    fw: ['laravel'],
    async executar() {
        const filtro = ask(await p.text({
            message: 'Filtrar por URI (opcional)',
            placeholder: 'ex.: api/usuarios, deixe vazio para todas',
            defaultValue: '',
        })).trim()
        await php('route:list', ...(filtro ? [`--path=${filtro}`] : []))
    },
}
