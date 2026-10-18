// Lista das acoes do demandas, na ordem do menu. Acao nova: um arquivo nesta
// pasta com { id, label, hint, executar(repo) } e uma linha aqui.
import comecar from './comecar.js'
import concluir from './concluir.js'
import listar from './listar.js'
import navegador from './navegador.js'
import nova from './nova.js'
import painel from './painel.js'
import relatorio from './relatorio.js'

export const ACOES = [listar, nova, comecar, concluir, painel, relatorio, navegador]
