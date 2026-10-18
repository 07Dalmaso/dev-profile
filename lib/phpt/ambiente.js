// Subir o ambiente completo: servidor + navegador + Vite.
import { subir } from './suporte/subir.js'

export default {
    id: 'dev',
    label: 'subir ambiente',
    hint: 'servidor + navegador + Vite',
    fw: ['laravel'],
    executar: () => subir({ vite: true }),
}
