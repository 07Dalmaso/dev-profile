# Carrega os comandos de comandos\<area>\<nome>.ps1, menos os desativados no
# `dev` (configurar). Fica na raiz com nome profile-*.ps1 porque e isso que o
# bloco gerado pelo install.ps1 no profile.ps1 carrega.
# Variaveis com prefixo dev: este arquivo roda no escopo do terminal.

$devConfig = Join-Path $env:APPDATA 'dev-profile\config.json'
$devDesativados = @()
if (Test-Path $devConfig) {
    $devDesativados = @((Get-Content $devConfig -Raw -Encoding UTF8 | ConvertFrom-Json).desativados)
}

foreach ($devArquivo in Get-ChildItem (Join-Path $PSScriptRoot 'comandos') -Filter '*.ps1' -Recurse) {
    if ($devDesativados -notcontains $devArquivo.BaseName) { . $devArquivo.FullName }
}

# Comando Node desativado: o atalho do npm continua existindo, entao uma funcao
# com o mesmo nome (que tem prioridade) avisa em vez de rodar.
foreach ($devNome in $devDesativados) {
    # "tools:json" e "phpt:fila" sao itens de menu, nao comandos.
    if ($devNome -notmatch ':' -and (Get-ChildItem (Join-Path $PSScriptRoot 'comandos') -Filter "$devNome.js" -Recurse)) {
        Set-Item "Function:\global:$devNome" ([scriptblock]::Create(
            "Write-Host '$devNome esta desativado. Para ativar: dev > configurar.' -ForegroundColor Yellow"))
    }
}

Remove-Variable devConfig, devDesativados, devArquivo, devNome -ErrorAction SilentlyContinue
