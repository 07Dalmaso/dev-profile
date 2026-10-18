# dev-profile

Coleção de scripts PowerShell para otimizar o fluxo de desenvolvimento com Git, Laravel e Yii2.

## Instalação

Um comando, em qualquer PowerShell, sem precisar clonar antes:

```powershell
irm https://api.github.com/repos/07Dalmaso/dev-profile/contents/scripts/install.ps1 -Headers @{Accept='application/vnd.github.raw'} | iex
```

O endereço é o da API do GitHub, e não o `raw.githubusercontent.com`, porque o
Zscaler bloqueia o raw na rede corporativa. A API aceita 60 chamadas por hora
por IP sem login; se estourar, use a alternativa abaixo.

Se já tiver a pasta, ou se o comando acima falhar:

```powershell
git clone https://github.com/07Dalmaso/dev-profile.git "$HOME\dev-profile"
& "$HOME\dev-profile\install.cmd"
```

(ou dê um duplo clique em `install.cmd`)

O instalador faz tudo sozinho:

- clona em `$HOME\dev-profile`, ou atualiza se já estiver instalado;
- instala Node e Git pelo `winget`, se faltarem;
- instala o `mig` (`npm install` + `npm link`);
- libera scripts locais para o usuário (`RemoteSigned`), senão o profile não carrega;
- configura o certificado do Zscaler para o Node, se ele existir na máquina;
- adiciona um bloco ao `profile.ps1` do Windows PowerShell e do PowerShell 7
  (achando a pasta Documentos real, mesmo no OneDrive) que carrega os
  `profile-*.ps1` desta pasta.

Pode rodar de novo quando quiser: atualiza sem duplicar nada. O caminho do
projeto fica na variável de usuário `DEV_PROFILE_DIR`, então para mover a pasta
basta rodar o `install.cmd` no lugar novo.

Novos atalhos entram automaticamente: qualquer `profile-*.ps1` na raiz é
carregado em todo terminal. Por isso o instalador fica em `scripts/`.

O `mig` fica ligado a esta pasta via `npm link`, então editar `bin/mig.js` tem
efeito na hora, sem reinstalar.

## Comandos

| Comando | O que faz |
| --- | --- |
| `gs` / `ga` / `gc` / `gp` | atalhos de `git status` / `add .` / `commit -m` / `push` |
| `gcom <msg>` | add + commit + push, bloqueado em `master` e `develop` |
| `gbranch [nome]` | cria `feature/`, `bugfix/` ou `hotfix/` a partir da base correta |
| `gdevelop` | cria `<branch>-develop` e sincroniza com a `develop` |
| `nBranch` | mostra a branch atual |
| `cachephp` | limpa cache (detecta Laravel ou Yii2) |
| `servphp` | sobe o servidor embutido do framework |
| `laraveldev` | sobe PHP server em porta livre, abre o navegador e roda o Vite |
| `stoplaravel` | encerra os processos `php` e `node` |
| `mig` | menu interativo de migrations (Node, em `bin/mig.js`) |
| `tools` | caixa de ferramentas: diff, JSON, Base64, JWT, URL, datas, hash... (Node, em `bin/tools.js`) |
| `diff-str` | atalho direto para o comparador de textos (Node, em `bin/diff-str.js`) |

### tools

```powershell
tools          # abre o menu
tools json     # vai direto para uma ferramenta
tools -h       # lista as ferramentas
```

| Ferramenta | O que faz |
| --- | --- |
| `diff` | compara dois textos ou arquivos (detalhes em [diff-str](#diff-str)) |
| `json` | formata, minifica, ordena chaves, valida (mostra linha e coluna do erro), escapa e desescapa |
| `base64` | codifica e decodifica; se o conteúdo for JSON, já sai formatado |
| `jwt` | decodifica o token (aceita `Bearer ...`), mostra as datas e se está expirado |
| `url` | encode, decode e separa a URL em host, caminho e parâmetros |
| `data` | timestamp Unix ↔ data, formato MySQL, ISO e relativo ("há 3 dias") |
| `hash` | MD5, SHA-1, SHA-256 e SHA-512 de texto ou arquivo |
| `gerar` | UUID, senha forte, token hex e `APP_KEY` do Laravel |
| `texto` | camelCase, PascalCase, snake_case, kebab/slug, sem acentos e contagem |
| `documento` | gera CPF/CNPJ válidos para teste e valida (inclusive CNPJ alfanumérico) |

Em todas, a entrada pode vir do clipboard, de um arquivo novo aberto em branco
no editor (VS Code, ou Bloco de Notas sem ele) para você colar, de um arquivo
existente (dá para arrastar o arquivo para o terminal) ou ser digitada, e o
resultado vai direto para o clipboard. Depois de cada uso o menu volta com a última ferramenta selecionada.

Para criar uma ferramenta nova, faça um módulo em `lib/ferramentas/` que exporte
`{ id, label, hint, executar }` e adicione-o à lista em `bin/tools.js`. As peças
comuns (escolher a entrada, copiar o resultado) ficam em `lib/ui.js`.

### diff-str

```powershell
diff-str                         # menu interativo, igual ao mig
diff-str "texto A" "texto B"     # direto pelos argumentos
diff-str -f antigo.sql novo.sql  # compara dois arquivos
diff-str -c "texto B"            # clipboard atual como texto A
diff-str -m linha ...            # força o modo: char, palavra ou linha (padrão: auto)
```

No menu, o jeito mais rápido é **colar em dois arquivos novos**: ele abre
`texto-A.txt` e `texto-B.txt` em branco no editor, você cola, salva e confirma
no terminal. Como os arquivos continuam abertos, depois do resultado dá para
editar e comparar de novo sem colar tudo outra vez, ou abrir a mesma comparação
no diff lado a lado do VS Code. Também dá para escolher a origem de cada texto
(clipboard, arquivo existente ou digitar). O modo de comparação já vem com o
recomendado selecionado.

Em vermelho riscado o que só existe em A, em verde o que só existe em B. Espaços,
tabs e caracteres invisíveis aparecem marcados (`·`, `→`, `⍽`, `⌀`), e no fim
vem um aviso quando a única diferença é CRLF x LF, espaço ou maiúscula/minúscula.
Sai com código 0 se os textos forem iguais e 1 se forem diferentes.

## Rede corporativa

Se o `npm` falhar com `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, é a inspeção TLS do
Zscaler: o Windows confia no CA dele, o Node não. O instalador já resolve isso
quando acha o certificado no Windows; para fazer à mão, aponte o Node para o CA
em vez de desligar a verificação:

```powershell
[Environment]::SetEnvironmentVariable('NODE_EXTRA_CA_CERTS', "$env:USERPROFILE\.certs\zscaler-root.pem", 'User')
```
