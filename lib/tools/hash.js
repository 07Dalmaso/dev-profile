// Hash no terminal: MD5, SHA-1, SHA-256 e SHA-512 de texto ou arquivo.
// A logica fica em motor/hash.js (a mesma do DalmasoDev).
import { escolherTexto } from '../comum/entrada.js'
import { escolherECopiar } from '../comum/saida.js'
import { processar } from './motor/hash.js'

export default {
    id: 'hash',
    label: 'Hash',
    hint: 'MD5, SHA-1, SHA-256, SHA-512 de texto ou arquivo',
    async executar() {
        // Arquivo vem em bytes: ler como texto mudaria o hash de binarios.
        await escolherECopiar(processar(await escolherTexto('o conteudo', { bruto: true })))
    },
}
