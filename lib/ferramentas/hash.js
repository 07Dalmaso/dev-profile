import { createHash } from 'node:crypto'
import { escolherECopiar, escolherTexto } from '../ui.js'

const ALGORITMOS = ['md5', 'sha1', 'sha256', 'sha512']

export default {
    id: 'hash',
    label: 'Hash',
    hint: 'MD5, SHA-1, SHA-256, SHA-512 de texto ou arquivo',
    async executar() {
        // Arquivo vem em bytes: ler como texto mudaria o hash de binarios.
        const entrada = await escolherTexto('o conteudo', { bruto: true })

        await escolherECopiar(ALGORITMOS.map((algoritmo) =>
            [algoritmo, createHash(algoritmo).update(entrada).digest('hex')]))
    },
}
