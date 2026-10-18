// Qual framework esta na pasta atual e como chamar o console dele.
import { existsSync } from 'node:fs'
import { executar } from '../../comum/processo.js'

export const FRAMEWORK = existsSync('artisan') ? 'laravel' : existsSync('yii') ? 'yii' : null
export const NOME = { laravel: 'Laravel', yii: 'Yii2' }

// php artisan ... no Laravel, php yii ... no Yii2.
const CONSOLE = { laravel: 'artisan', yii: 'yii' }
export const php = (...args) => executar('php', [CONSOLE[FRAMEWORK], ...args])
