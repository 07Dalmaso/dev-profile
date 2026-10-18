// Opcoes do menu de migrations e as regras de nome.

export const ACOES = [
    { value: 'alter', label: 'alter' },
    { value: 'create', label: 'create' },
    { value: 'update', label: 'update' },
    { value: 'insert', label: 'insert' },
    { value: 'delete', label: 'delete' },
    { value: 'drop', label: 'drop' },
]

export const TIPOS = [
    { value: 'procedure', label: 'procedure' },
    { value: 'view', label: 'view' },
    { value: 'function', label: 'function' },
    { value: 'table', label: 'table' },
]

// Convencao de nome dos objetos do banco; table fica livre.
export const PREFIXOS = { procedure: 'sp_', function: 'fn_', view: 'vw_' }

// Mesma normalizacao do script original: minusculo, espacos viram underscore.
export function normalizar(nome) {
    return nome.toLowerCase().trim().replace(/\s+/g, '_')
}

// Objetos do banco mantem a caixa original; so os espacos viram underscore.
export function normalizarObjeto(nome) {
    return nome.trim().replace(/\s+/g, '_')
}

export function validarNome(valor) {
    if (!valor || !valor.trim()) return 'Nome nao pode ser vazio.'
    if (!/^[A-Za-z0-9_\s]+$/.test(valor)) return 'Use apenas letras, numeros, underscore e espaco.'
}
