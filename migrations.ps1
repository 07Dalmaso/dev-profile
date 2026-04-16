function mig {

    $year = Get-Date -Format "yyyy"
    $month = Get-Date -Format "MM"

    $path = "database/migrations/$year/$month"

    Write-Host "Comandos de migracao:" -ForegroundColor Green
    Write-Host "1 - php artisan migrate" -ForegroundColor Cyan
    Write-Host "2 - php artisan migrate:rollback" -ForegroundColor Cyan
    Write-Host "3 - php artisan migrate:refresh" -ForegroundColor Cyan
    Write-Host "4 - make:migration-ddl (com objeto)" -ForegroundColor Cyan
    Write-Host "5 - make:migration (basico)" -ForegroundColor Cyan
    Write-Host "6 - make:migration-controle-acesso" -ForegroundColor Cyan

    $option = Read-Host "Digite o numero do comando"

    function Escolher-Acao {
        Write-Host "Acao:"
        Write-Host "1 - alter"
        Write-Host "2 - create"
        Write-Host "3 - update"
        Write-Host "4 - insert"
        Write-Host "5 - delete"

        switch (Read-Host "Escolha a acao") {
            "1" { return "alter" }
            "2" { return "create" }
            "3" { return "update" }
            "4" { return "insert" }
            "5" { return "delete" }
            default { return $null }
        }
    }

    function Escolher-Tipo {
        Write-Host "Tipo:"
        Write-Host "1 - procedure"
        Write-Host "2 - view"
        Write-Host "3 - function"
        Write-Host "4 - table"

        switch (Read-Host "Escolha o tipo") {
            "1" { return "procedure" }
            "2" { return "view" }
            "3" { return "function" }
            "4" { return "table" }
            default { return $null }
        }
    }

    switch ($option) {

        "1" { $command = "php artisan migrate --path=$path" }
        "2" { $command = "php artisan migrate:rollback --path=$path" }
        "3" { $command = "php artisan migrate:refresh --path=$path" }

        # DDL COMPLETO
        "4" {
            $action = Escolher-Acao
            $type = Escolher-Tipo

            if (!$action -or !$type) {
                Write-Host "Opcao invalida." -ForegroundColor Red
                return
            }

            $objectName = Read-Host "Nome do objeto (ex: sp_xxx)"

            if ([string]::IsNullOrWhiteSpace($objectName)) {
                Write-Host "Nome invalido." -ForegroundColor Red
                return
            }

            $migrationName = "${action}_${objectName}_${type}"
            $command = "php artisan make:migration-ddl $migrationName $objectName --path=$path"
        }

        # BASICO
        "5" {
            $action = Escolher-Acao
            $type = Escolher-Tipo

            if (!$action -or !$type) {
                Write-Host "Opcao invalida." -ForegroundColor Red
                return
            }

            $name = Read-Host "Nome base (ex: tabela ou descricao)"

            if ([string]::IsNullOrWhiteSpace($name)) {
                Write-Host "Nome invalido." -ForegroundColor Red
                return
            }

            $name = $name.ToLower().Replace(" ", "_")

            $migrationName = "${action}_${name}_${type}"
            $command = "php artisan make:migration $migrationName --path=$path"
        }

        # CONTROLE DE ACESSO
        "6" {
            $action = Escolher-Acao

            if (!$action) {
                Write-Host "Opcao invalida." -ForegroundColor Red
                return
            }

            $name = Read-Host "Nome base (ex: usuario_permissao)"

            if ([string]::IsNullOrWhiteSpace($name)) {
                Write-Host "Nome invalido." -ForegroundColor Red
                return
            }

            $table = Read-Host "Nome da tabela (opcional)"

            $name = $name.ToLower().Replace(" ", "_")
            $type = "table"

            $migrationName = "${action}_${name}_${type}"

            if ([string]::IsNullOrWhiteSpace($table)) {
                $command = "php artisan make:migration-controle-acesso $migrationName --path=$path"
            } else {
                $command = "php artisan make:migration-controle-acesso $migrationName --table=$table --path=$path"
            }
        }

        default {
            Write-Host "Opcao invalida." -ForegroundColor Red
            return
        }
    }

    Write-Host "Executando: $command" -ForegroundColor Yellow
    Invoke-Expression $command
}