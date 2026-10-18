// Lista das ferramentas do tools, na ordem do menu. Ferramenta nova: um arquivo
// nesta pasta com { id, label, hint, executar } e uma linha aqui.
import base64 from './base64.js'
import data from './data.js'
import diff from './diff.js'
import documento from './documento.js'
import gerar from './gerar.js'
import hash from './hash.js'
import json from './json.js'
import jwt from './jwt.js'
import texto from './texto.js'
import url from './url.js'

export const FERRAMENTAS = [diff, json, base64, jwt, url, data, hash, gerar, texto, documento]
