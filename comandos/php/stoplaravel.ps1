# encerra TODOS os processos php e node da maquina (phpt parar encerra so os do projeto)
function stoplaravel {
    Write-Host "Parando Laravel..." -ForegroundColor Yellow

    Get-Process php -ErrorAction SilentlyContinue |
        Stop-Process -Force

    Get-Process node -ErrorAction SilentlyContinue |
        Stop-Process -Force

    Write-Host "Laravel e Vite encerrados." -ForegroundColor Green
}
