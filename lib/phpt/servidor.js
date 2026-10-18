// Subir so o servidor, sem Vite.
import { subir } from './suporte/subir.js'

export default {
    id: 'serve',
    label: 'subir so o servidor',
    hint: 'em porta livre, abre o navegador',
    fw: ['laravel', 'yii'],
    executar: () => subir({ vite: false }),
}
