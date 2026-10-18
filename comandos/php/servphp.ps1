# sobe o servidor embutido do framework
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
