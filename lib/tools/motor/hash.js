// Motor de hash: MD5, SHA-1, SHA-256 e SHA-512 de texto ou bytes (arquivo).
import { createHash } from 'node:crypto'

const ALGORITMOS = ['md5', 'sha1', 'sha256', 'sha512']

// Arquivo vem em bytes (Buffer): ler como texto mudaria o hash de binarios.
// Devolve [[algoritmo, hex]].
export function processar(entrada) {
    return ALGORITMOS.map((algoritmo) => [algoritmo, createHash(algoritmo).update(entrada).digest('hex')])
}
