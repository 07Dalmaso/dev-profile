
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

function servphp {
    if (Test-Path "artisan") {
        Write-Host "🔍 Projeto Laravel detectado" -ForegroundColor Cyan
        php artisan serve
    }
    elseif (Test-Path "yii") {
        Write-Host "🔍 Projeto Yii2 detectado" -ForegroundColor Cyan
        php yii serve
    }
    else {
        Write-Host "❌ Não foi possível identificar o framework." -ForegroundColor Red
    }
}

function laraveldev {
    if (-not (Test-Path "artisan")) {
        Write-Host "Este diretorio nao parece ser um projeto Laravel." -ForegroundColor Red
        return
    }

    Write-Host "Projeto Laravel detectado" -ForegroundColor Cyan

    $port = 8000
    while ((Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) -and $port -lt 8100) {
        $port++
    }

    if ($port -ne 8000) {
        Write-Host "Porta 8000 ocupada, usando $port." -ForegroundColor Yellow
    }

    Write-Host "Iniciando PHP server na porta $port..." -ForegroundColor Green

    Start-Process powershell -ArgumentList "-NoExit", "-Command", "php artisan serve --port=$port"

    Start-Sleep -Seconds 2

    Write-Host "Abrindo navegador..." -ForegroundColor Green
    Start-Process "http://127.0.0.1:$port"

    Write-Host "Iniciando Vite..." -ForegroundColor Green
    npm run dev
}

function stoplaravel {
    Write-Host "Parando Laravel..." -ForegroundColor Yellow

    Get-Process php -ErrorAction SilentlyContinue |
        Stop-Process -Force

    Get-Process node -ErrorAction SilentlyContinue |
        Stop-Process -Force

    Write-Host "Laravel e Vite encerrados." -ForegroundColor Green
}