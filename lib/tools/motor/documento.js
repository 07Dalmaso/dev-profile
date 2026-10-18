// Motor de CPF / CNPJ: gerar para teste e validar (inclusive CNPJ alfanumerico).
import { randomInt } from 'node:crypto'

// Digito verificador modulo 11 (mesma conta para CPF e CNPJ). O valor de cada
// caractere e o codigo ASCII - 48: da o proprio digito para 0-9 e cobre o
// CNPJ alfanumerico (letras) que a Receita usa desde julho de 2026.
function digito(base, pesos) {
    const soma = [...base].reduce((total, ch, i) => total + (ch.charCodeAt(0) - 48) * pesos[i], 0)
    const resto = soma % 11
    return resto < 2 ? '0' : String(11 - resto)
}

const PESOS_CPF = (n) => Array.from({ length: n }, (_, i) => n + 1 - i)
const PESOS_CNPJ = (n) => Array.from({ length: n }, (_, i) => ((n - 1 - i) % 8) + 2)

function completarCpf(base) {
    const d1 = digito(base, PESOS_CPF(9))
    return base + d1 + digito(base + d1, PESOS_CPF(10))
}

function completarCnpj(base) {
    const d1 = digito(base, PESOS_CNPJ(12))
    return base + d1 + digito(base + d1, PESOS_CNPJ(13))
}

const mascaraCpf = (v) => v.replace(/^(.{3})(.{3})(.{3})(.{2})$/, '$1.$2.$3-$4')
const mascaraCnpj = (v) => v.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, '$1.$2.$3/$4-$5')

const aleatorios = (n) => Array.from({ length: n }, () => randomInt(10)).join('')

// Gerado: valido so na conta, para testes. { mascarado, numeros }
export function gerar(tipo) {
    const numeros = tipo === 'cpf' ? completarCpf(aleatorios(9)) : completarCnpj(`${aleatorios(8)}0001`)
    return { mascarado: tipo === 'cpf' ? mascaraCpf(numeros) : mascaraCnpj(numeros), numeros }
}

// Todos os digitos iguais passam na conta, mas nao sao documentos validos.
// { tipo, ok, formatado } | { erro }
export function validar(texto) {
    const valor = (texto ?? '').toUpperCase().replace(/[.\-/\s]/g, '')

    if (/^\d{11}$/.test(valor)) {
        const ok = !/^(\d)\1+$/.test(valor) && completarCpf(valor.slice(0, 9)) === valor
        return { tipo: 'CPF', ok, formatado: mascaraCpf(valor) }
    }
    if (/^[0-9A-Z]{12}\d{2}$/.test(valor)) {
        const ok = !/^(\d)\1+$/.test(valor) && completarCnpj(valor.slice(0, 12)) === valor
        return { tipo: 'CNPJ', ok, formatado: mascaraCnpj(valor) }
    }
    return { erro: 'Formato nao reconhecido: CPF tem 11 digitos e CNPJ 14 caracteres.' }
}
