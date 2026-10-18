// Lista das acoes do phpt, na ordem do menu. Acao nova: um arquivo nesta pasta
// com { id, label, hint, fw, executar } e uma linha aqui. `fw` limita a um
// framework; sem `fw`, aparece em qualquer pasta.
import ambiente from './ambiente.js'
import autoload from './autoload.js'
import cache from './cache.js'
import fila from './fila.js'
import log from './log.js'
import mig from './mig.js'
import optimize from './optimize.js'
import parar from './parar.js'
import rotas from './rotas.js'
import servidor from './servidor.js'
import storage from './storage.js'
import tinker from './tinker.js'
import versoes from './versoes.js'

export const ACOES = [cache, ambiente, servidor, parar, log, mig, rotas, tinker, fila, optimize, storage, autoload, versoes]
