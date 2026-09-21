<#
    Instala o dev-profile: comando `mig` global e atalhos carregados em todo
    PowerShell que abrir. Pode rodar de novo quando quiser: atualiza sem duplicar.

    Sem clonar:  irm https://api.github.com/repos/07Dalmaso/dev-profile/contents/scripts/install.ps1 -Headers @{Accept='application/vnd.github.raw'} | iex
                 (API, e nao raw.githubusercontent.com: o Zscaler bloqueia o raw)
    Ja clonado:  duplo clique em install.cmd

    Fica em scripts/ de proposito: a raiz so tem os profile-*.ps1, que sao
    carregados em todo terminal.
#>

# Tudo dentro de uma funcao: via `irm | iex` o script roda na sessao de quem
# chamou, entao nada de variavel vazando nem `exit` fechando o terminal.
function Install-DevProfile {
    $repo = 'https://github.com/07Dalmaso/dev-profile.git'

    # Bloco fixo, igual em toda maquina: o caminho do projeto fica na variavel
    # de usuario DEV_PROFILE_DIR, entao mover a pasta nao exige mexer no profile.
    $marca = '# >>> dev-profile >>>'
    $bloco = @'
# >>> dev-profile >>> (gerado pelo install.ps1)
$devProfile = [Environment]::GetEnvironmentVariable('DEV_PROFILE_DIR', 'User')
if ($devProfile) { Get-ChildItem $devProfile -Filter 'profile-*.ps1' -ErrorAction SilentlyContinue | ForEach-Object { . $_.FullName } }
Remove-Variable devProfile
# <<< dev-profile <<<
'@ -replace "`r?`n", "`r`n"

    function Passo([string]$msg) { Write-Host "`n> $msg" -ForegroundColor Cyan }
    function Ok([string]$msg) { Write-Host "  $msg" -ForegroundColor Green }
    function Aviso([string]$msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }

    function RecarregarPath {
        $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                    [Environment]::GetEnvironmentVariable('Path', 'User')
    }

    # Instala via winget o que faltar e recarrega o PATH desta sessao.
    function Garantir([string]$comando, [string]$pacote) {
        if (Get-Command $comando -ErrorAction SilentlyContinue) { return }
        if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
            throw "$comando nao encontrado e o winget nao esta disponivel. Instale $pacote e rode de novo."
        }
        Write-Host "  Instalando $pacote via winget..."
        winget install --id $pacote -e --silent --accept-source-agreements --accept-package-agreements
        RecarregarPath
        if (-not (Get-Command $comando -ErrorAction SilentlyContinue)) {
            throw "Nao foi possivel instalar $pacote. Instale manualmente e rode de novo."
        }
    }

    # 1. Pasta do projeto: a do proprio script ou, via irm | iex, clona/atualiza.
    Passo 'Projeto'
    $raiz = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent }
    if ($raiz -and (Test-Path (Join-Path $raiz 'package.json'))) {
        $dir = $raiz
    } else {
        $dir = @(
            $env:DEV_PROFILE_DIR
            [Environment]::GetEnvironmentVariable('DEV_PROFILE_DIR', 'User')
            Join-Path $HOME 'dev-profile'
        ) | Where-Object { $_ } | Select-Object -First 1

        Garantir 'git' 'Git.Git'
        if (Test-Path (Join-Path $dir '.git')) {
            git -C $dir pull --ff-only
        } else {
            git clone $repo $dir
        }
        if ($LASTEXITCODE -ne 0) { throw "Falha ao baixar o projeto em $dir." }
    }
    [Environment]::SetEnvironmentVariable('DEV_PROFILE_DIR', $dir, 'User')
    Ok $dir

    # 2. Node roda o mig; PHP e so aviso, os atalhos funcionam sem ele.
    Passo 'Dependencias'
    Garantir 'node' 'OpenJS.NodeJS.LTS'
    $versao = [int](node -p 'parseInt(process.versions.node)')
    if ($versao -lt 18) { throw "Node $versao encontrado; o mig precisa do 18 ou mais novo." }
    Ok "node $(node --version)"
    if (Get-Command php -ErrorAction SilentlyContinue) {
        Ok 'php encontrado'
    } else {
        Aviso 'PHP nao encontrado no PATH: o mig so executa as migrations com ele.'
    }

    # 3. O Node ignora os certificados do Windows. Com o Zscaler interceptando o
    #    TLS, o npm falha; exporta o CA dele e aponta o Node para o arquivo.
    if (-not $env:NODE_EXTRA_CA_CERTS) {
        $ca = Get-ChildItem Cert:\CurrentUser\Root, Cert:\LocalMachine\Root |
            Where-Object Subject -Match 'Zscaler' | Select-Object -First 1
        if ($ca) {
            Passo 'Certificado do Zscaler'
            $pem = Join-Path $HOME '.certs\zscaler-root.pem'
            if (-not (Test-Path $pem)) {
                New-Item -ItemType Directory -Force (Split-Path $pem) | Out-Null
                $b64 = [Convert]::ToBase64String($ca.RawData) -replace '(.{64})', "`$1`n"
                Set-Content -Path $pem -Encoding Ascii -Value "-----BEGIN CERTIFICATE-----`n$($b64.Trim())`n-----END CERTIFICATE-----"
            }
            [Environment]::SetEnvironmentVariable('NODE_EXTRA_CA_CERTS', $pem, 'User')
            $env:NODE_EXTRA_CA_CERTS = $pem
            Ok $pem
        }
    }

    # 4. mig: dependencias e comando global (npm link aponta para esta pasta,
    #    entao editar bin/mig.js vale na hora). npm.cmd evita o npm.ps1, que a
    #    politica de execucao pode bloquear.
    Passo 'Comando mig'
    Push-Location $dir
    try {
        npm.cmd install --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'npm install falhou.' }
        npm.cmd link
        if ($LASTEXITCODE -ne 0) { throw 'npm link falhou.' }
    } finally {
        Pop-Location
    }
    $global = (npm.cmd prefix -g | Out-String).Trim().TrimEnd('\')
    if (($env:Path -split ';' | ForEach-Object { $_.TrimEnd('\') }) -notcontains $global) {
        Aviso "A pasta global do npm ($global) nao esta no PATH; o mig nao vai ser encontrado."
    }
    Ok 'mig instalado'

    # 5. Sem RemoteSigned o PowerShell recusa carregar o profile. A politica do
    #    processo e ignorada: o install.cmd roda com Bypass so nesta execucao, e
    #    por isso o Set-ExecutionPolicy reclama de "override" mesmo tendo salvo;
    #    o que vale e conferir o resultado depois.
    Passo 'Politica de execucao'
    $libera = {
        function Efetiva {
            $p = Get-ExecutionPolicy -List |
                Where-Object { $_.Scope -ne 'Process' -and $_.ExecutionPolicy -ne 'Undefined' } |
                Select-Object -First 1 -ExpandProperty ExecutionPolicy
            if ($p) { "$p" } else { 'Restricted' }
        }
        if ((Efetiva) -in 'Restricted', 'AllSigned') {
            Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force -ErrorAction SilentlyContinue
            if ((Efetiva) -in 'Restricted', 'AllSigned') { throw "politica $(Efetiva) imposta pelo TI" }
        }
    }
    try {
        & $libera
        # O Windows PowerShell 5.1 guarda a politica separada do PowerShell 7.
        if ($PSVersionTable.PSEdition -eq 'Core') {
            powershell.exe -NoProfile -EncodedCommand ([Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes("$libera")))
            if ($LASTEXITCODE -ne 0) { throw 'politica do Windows PowerShell imposta pelo TI' }
        }
        Ok 'scripts locais liberados'
    } catch {
        Aviso "Nao foi possivel liberar scripts ($($_.Exception.Message)). Peca ao TI para liberar RemoteSigned."
    }

    # 6. profile.ps1 vale para todo host (terminal, VS Code, ISE). O caminho vem
    #    da pasta Documentos real (pode estar no OneDrive), nao de um valor fixo.
    Passo 'Profile'
    $docs = [Environment]::GetFolderPath('MyDocuments')
    $alvos = @(Join-Path $docs 'WindowsPowerShell\profile.ps1')
    if ((Get-Command pwsh -ErrorAction SilentlyContinue) -or $PSVersionTable.PSEdition -eq 'Core') {
        $alvos += Join-Path $docs 'PowerShell\profile.ps1'
    }

    foreach ($arquivo in $alvos) {
        if (-not (Test-Path $arquivo)) {
            New-Item -ItemType Directory -Force (Split-Path $arquivo) | Out-Null
            [IO.File]::WriteAllText($arquivo, "$bloco`r`n", (New-Object Text.UTF8Encoding $true))
        } elseif ([IO.File]::ReadAllText($arquivo) -notmatch [regex]::Escape($marca)) {
            # Anexa na mesma codificacao do arquivo (o 5.1 pode ter gravado em UTF-16).
            $leitor = New-Object IO.StreamReader($arquivo, [Text.Encoding]::Default, $true)
            try { [void]$leitor.Peek(); $codificacao = $leitor.CurrentEncoding } finally { $leitor.Dispose() }
            [IO.File]::AppendAllText($arquivo, "`r`n$bloco`r`n", $codificacao)
        }
        Ok $arquivo
    }

    Write-Host "`nPronto! Abra um novo terminal para usar os atalhos e o mig." -ForegroundColor Green
}

try {
    Install-DevProfile
} catch {
    Write-Host "`nERRO: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Remove-Item Function:\Install-DevProfile -ErrorAction SilentlyContinue
}
