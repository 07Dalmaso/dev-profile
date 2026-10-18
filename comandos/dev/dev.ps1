# menu por area com todos os comandos (dev -l so lista)
function dev {
    # O lib/dev/menu.js le os arquivos de comandos\ e mostra o menu. Daqui ele
    # so precisa do que o PowerShell sabe em tempo de execucao: os parametros
    # de cada funcao e se um alias esconde a funcao (gc, gp).
    $raiz = Split-Path (Split-Path $PSScriptRoot)
    $comuns = [System.Management.Automation.PSCmdlet]::CommonParameters +
              [System.Management.Automation.PSCmdlet]::OptionalCommonParameters

    $info = @{}
    foreach ($arquivo in Get-ChildItem (Join-Path $raiz 'comandos') -Filter '*.ps1' -Recurse) {
        $nome = $arquivo.BaseName
        $funcao = Get-Command $nome -CommandType Function -ErrorAction SilentlyContinue
        if (-not $funcao) { continue }

        $parametros = @($funcao.Parameters.Values | Where-Object { $comuns -notcontains $_.Name } | ForEach-Object {
            $obrigatorio = [bool]($_.Attributes | Where-Object { $_ -is [System.Management.Automation.ParameterAttribute] -and $_.Mandatory })
            @{ nome = $_.Name; obrigatorio = $obrigatorio }
        })

        # Atribuicao explicita: `$x = if` sem else vira {} no ConvertTo-Json do 5.1.
        $conflito = $null
        $resolvido = Get-Command $nome -ErrorAction SilentlyContinue
        if ($resolvido.CommandType -eq 'Alias') { $conflito = "alias de $($resolvido.Definition)" }

        $info[$nome] = @{ parametros = $parametros; conflito = $conflito }
    }

    $entrada = [IO.Path]::GetTempFileName()
    $saida = [IO.Path]::GetTempFileName()
    try {
        [IO.File]::WriteAllText($entrada, (ConvertTo-Json $info -Depth 5), (New-Object Text.UTF8Encoding $false))
        node (Join-Path $raiz 'lib\dev\menu.js') $entrada $saida @args
        $linha = [IO.File]::ReadAllText($saida).Trim()
    } finally {
        Remove-Item $entrada, $saida -ErrorAction SilentlyContinue
    }

    if ($linha) {
        Write-Host "> $linha" -ForegroundColor DarkGray
        Invoke-Expression $linha
    }
}
