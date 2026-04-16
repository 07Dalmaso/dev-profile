function gs { git status }
function ga { git add . }
function gc { git commit -m $args }
function gp { git push }
function versionphp {php -v}

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

    # Commit
    git commit -m "$msg"

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

function cachephp {
    if (Test-Path "artisan") {
        Write-Host "🔍 Projeto Laravel detectado" -ForegroundColor Cyan

        php artisan cache:clear
        php artisan config:clear
        php artisan route:clear
        php artisan view:clear

        Write-Host "✅ Cache do Laravel limpo!" -ForegroundColor Green
    }
    elseif (Test-Path "yii") {
        Write-Host "🔍 Projeto Yii2 detectado" -ForegroundColor Cyan

        php yii cache/flush-all

        Write-Host "✅ Cache do Yii2 limpo!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Não foi possível identificar o framework." -ForegroundColor Red
    }
}


function gbranch {
    param(
        [string]$name
    )

    Write-Host "Escolha o tipo de branch:" -ForegroundColor Cyan
    Write-Host "1 - feature"
    Write-Host "2 - bugfix"
    Write-Host "3 - hotfix"

    $option = Read-Host "Digite o número"

    switch ($option) {
        "1" { $type = "feature" }
        "2" { $type = "bugfix" }
        "3" { $type = "hotfix" }
        default {
            Write-Host "Opcao invalida." -ForegroundColor Red
            return
        }
    }

    if (-not $name) {
        $name = Read-Host "Digite o nome da branch"
    }

    # Verifica se está em um repo git
    $current = git rev-parse --abbrev-ref HEAD 2>$null
    if (-not $current) {
        Write-Host "Nao esta em um repositorio Git." -ForegroundColor Red
        return
    }

    # Define branch base
    if ($type -eq "hotfix") {
        $base = "master"
    } else {
        $base = "develop"
    }

    Write-Host "Base: $base" -ForegroundColor Cyan

    # Vai pra base
    git checkout $base
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao trocar para $base" -ForegroundColor Red
        return
    }

    # Atualiza
    git pull
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao atualizar $base" -ForegroundColor Red
        return
    }

    # Limpa nome
    $cleanName = $name.ToLower().Trim().Replace(" ", "-")

    # Valida nome
    if ($cleanName -notmatch "^[a-z0-9\-]+$") {
        Write-Host "Nome invalido. Use apenas letras, numeros e hifen." -ForegroundColor Red
        return
    }

    $branchName = "$type/$cleanName"

    # Cria branch
    git checkout -b $branchName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao criar branch" -ForegroundColor Red
        return
    }

    Write-Host "Branch criada: $branchName" -ForegroundColor Green
}