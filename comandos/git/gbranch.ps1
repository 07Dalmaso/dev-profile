# cria feature/, bugfix/ ou hotfix/ a partir da base correta
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
