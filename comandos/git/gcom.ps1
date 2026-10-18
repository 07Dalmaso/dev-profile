# add + commit + push, bloqueado em master e develop
function gcom {
    param(
        [Parameter(Mandatory=$true)]
        [string]$msg
    )

    # Pega a branch atual
    $branch = git rev-parse --abbrev-ref HEAD 2>$null

    if (-not $branch) {
        Write-Host Set-ExecutionPolicy RemoteSigned -Scope CurrentUser-ForegroundColor Red
        return
    }

    # Bloqueia branches protegidas
    if ($branch -in @("master", "develop")) {
        Write-Host "❌ Commit bloqueado na branch '$branch'!" -ForegroundColor Red
        Write-Host "➡️ Crie uma branch (ex: feature/minha-task)" -ForegroundColor Yellow
        return
    }

    # Verifica se há mudanças
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "⚠️ Nenhuma alteração para commit." -ForegroundColor Yellow
        return
    }

    # Executa add
    git add .

    # Commit. Branch criada pelo `demandas` (feature/42-...) ganha a referencia
    # da demanda numa segunda linha: o GitHub liga o commit a ela e o painel
    # mostra na linha do tempo.
    $referencia = $null
    if ($branch -match '^(feature|bugfix|hotfix)/(\d+)-') {
        $numero = $Matches[2]
        $config = Join-Path $env:APPDATA 'dev-profile\config.json'
        if (Test-Path $config) {
            $repo = (Get-Content $config -Raw -Encoding UTF8 | ConvertFrom-Json).demandas.repo
            if ($repo) { $referencia = "Refs $repo#$numero" }
        }
    }

    if ($referencia) {
        git commit -m "$msg" -m $referencia
        Write-Host "🔗 Commit ligado a demanda: $referencia" -ForegroundColor DarkGray
    } else {
        git commit -m "$msg"
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no commit. Push cancelado." -ForegroundColor Red
        return
    }

    # Push
    git push

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no push." -ForegroundColor Red
        return
    }

    Write-Host "✅ Commit e push realizados com sucesso na branch '$branch'" -ForegroundColor Green
}
