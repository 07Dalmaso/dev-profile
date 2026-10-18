// Painel no navegador: abre o DalmasoDev ja na aba Demandas (graficos,
// filtros, codigo ligado a cada demanda e relatorio). Ctrl+C volta ao menu.
import { abrirDalmasoDev } from '../web/abrir.js'

export default {
    id: 'painel',
    label: 'painel no navegador',
    hint: 'abre o DalmasoDev na aba Demandas',
    executar: () => abrirDalmasoDev('demandas'),
}
