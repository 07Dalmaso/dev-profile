
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