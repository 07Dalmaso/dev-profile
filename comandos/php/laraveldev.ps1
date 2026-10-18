# sobe o servidor em porta livre, abre o navegador e roda o Vite
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
