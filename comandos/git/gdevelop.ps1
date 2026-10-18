# cria <branch>-develop e sincroniza com a develop
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
