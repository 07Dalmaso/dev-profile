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

function nBranch{
    # retorna a branch atual
    git branch --show-current
}

function gdevelop {

    # Pega branch atual
    $currentBranch = git branch --show-current 2>$null

    if (-not $currentBranch) {
        Write-Host "❌ Não está em um repositório Git." -ForegroundColor Red
        return
    }

    # Bloqueia develop/master
    if ($currentBranch -in @("master", "develop")) {
        Write-Host "❌ Você está na branch '$currentBranch'" -ForegroundColor Red
        return
    }

    Write-Host ""
    Write-Host "🌿 Branch atual: $currentBranch" -ForegroundColor Cyan

    # Nome nova branch
    $newBranch = "$currentBranch-develop"

    Write-Host "🆕 Nova branch: $newBranch" -ForegroundColor Yellow
    Write-Host ""

    # Confirmação
    $confirm = Read-Host "Deseja continuar? (s/n)"

    if ($confirm -ne "s") {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        return
    }

    # Verifica mudanças pendentes
    $status = git status --porcelain

    if ($status) {
        Write-Host "⚠️ Existem alterações não commitadas." -ForegroundColor Yellow
        Write-Host "Faça commit/stash antes." -ForegroundColor Yellow
        return
    }

    # Cria branch
    git checkout -b $newBranch

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao criar branch." -ForegroundColor Red
        return
    }

    Write-Host ""
    Write-Host "⬇️ Fazendo pull da develop..." -ForegroundColor Cyan

    # Pull develop
    git pull origin develop

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "⚠️ Possíveis conflitos encontrados." -ForegroundColor Yellow
        Write-Host "➡️ Resolva os conflitos manualmente." -ForegroundColor Yellow
        return
    }

    Write-Host ""
    Write-Host "✅ Branch criada e develop sincronizada com sucesso!" -ForegroundColor Green
    Write-Host "🌿 Branch: $newBranch" -ForegroundColor Green
}