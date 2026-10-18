# dev-profile

 Comandos de terminal para o dia a dia com Git, Laravel e Yii2: atalhos de Git,
menus de PHP e de migrations e uma caixa de ferramentas (diff, JSON, JWT...).

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
- instala os comandos Node (`npm install` + `npm link`);
- libera scripts locais para o usuário (`RemoteSigned`), senão o profile não carrega;
- configura o certificado do Zscaler para o Node, se ele existir na máquina;
- adiciona um bloco ao `profile.ps1` do Windows PowerShell e do PowerShell 7
  (achando a pasta Documentos real, mesmo no OneDrive) que carrega os comandos
  desta pasta.

Pode rodar de novo quando quiser: atualiza sem duplicar nada. O caminho do
projeto fica na variável de usuário `DEV_PROFILE_DIR`, então para mover a pasta
basta rodar o `install.cmd` no lugar novo.

## Comandos

Não precisa decorar: `dev` abre um menu com tudo, por área.

| Área | Comando | O que faz |
| --- | --- | --- |
| | `dev` | menu por área que executa o comando escolhido (`dev -l` só lista) |
| Git | `gs` / `ga` | `git status` / `git add .` |
| Git | `gc` / `gp` | `commit -m` / `push` — **não funcionam**: o PowerShell já usa esses nomes (veja abaixo) |
| Git | `gcom <msg>` | add + commit + push, bloqueado em `master` e `develop` |
| Git | `gbranch [nome]` | cria `feature/`, `bugfix/` ou `hotfix/` a partir da base correta |
| Git | `gdevelop` | cria `<branch>-develop` e sincroniza com a `develop` |
| Git | `nBranch` | mostra a branch atual |
| Demandas | `demandas` | suas demandas (issues de um repositório privado): listar, criar, começar, concluir |
| PHP | `phpt` | menu de PHP para Laravel e Yii2: cache, servidor, logs, rotas, tinker... |
| PHP | `mig` | menu de migrations do Laravel |
| PHP | `cachephp` | limpa cache (detecta Laravel ou Yii2) |
| PHP | `servphp` | sobe o servidor embutido do framework |
| PHP | `laraveldev` | sobe o servidor em porta livre, abre o navegador e roda o Vite |
| PHP | `stoplaravel` | encerra **todos** os processos `php` e `node` (`phpt` → parar encerra só os do projeto) |
| PHP | `versionphp` | `php -v` |
| Ferramentas | `tools` | caixa de ferramentas: diff, JSON, Base64, JWT, URL, datas, hash... |
| Ferramentas | `diff-str` | atalho direto para o comparador de textos |
| Navegador | `dalmasodev` | abre o **DalmasoDev** no navegador: demandas e todas as ferramentas, só no seu computador |

`gc` e `gp` existem como funções, mas no PowerShell um alias tem prioridade
sobre uma função, e `gc` (Get-Content) e `gp` (Get-ItemProperty) são aliases
nativos. O `dev` mostra os dois marcados.

### dev

```powershell
dev            # escolhe a área (Git, PHP, Ferramentas), depois o comando, e executa
dev -l         # só lista
dev git        # filtra por nome, área ou descrição (se sobrar uma área só, abre direto nela)
```

Parâmetros (como a mensagem do `gcom`) são pedidos no menu.

Uma área com um comando só (como Demandas) abre o comando direto.

**Ativar e desativar:** `dev` → `configurar` pergunta o que configurar (uma
área de comandos, as ferramentas do `tools` ou as ações do `phpt` e do
`demandas`) e mostra a lista: espaço marca e desmarca, `a` marca ou desmarca todos e Enter salva.

- Comando desativado não é carregado no terminal e some do `dev`; um comando
  Node desativado avisa em vez de rodar. Vale a partir do próximo terminal.
- Ferramenta ou ação desativada some do menu do `tools`, do `phpt` ou do
  `demandas` (e aparece marcada no `-h` de cada um).

A escolha fica em `%APPDATA%\dev-profile\config.json`, fora do repositório,
então `git pull` e o instalador não desfazem.

### demandas

Sua lista de demandas fica nas **issues de um repositório privado seu** no
GitHub: pessoal (fora deste projeto), na nuvem e no celular pelo app
**GitHub Mobile**, onde dá para criar, comentar e fechar.

```powershell
demandas           # menu
demandas nova      # vai direto para uma ação (listar, nova, comecar, concluir)
```

| Ação | O que faz |
| --- | --- |
| `listar` | escolhe o projeto (ou todas), mostra as abertas com as em andamento primeiro e depois por prioridade; escolhe uma para ver, começar, concluir ou abrir |
| `nova` | título, prioridade (alta/média/baixa), projeto e descrição (uma linha ou no editor) |
| `comecar` | cria a branch **local** `feature/42-titulo-da-demanda` a partir da base certa (como o `gbranch`) e, se você escolher, marca "em andamento" |
| `concluir` | fecha a demanda, com um comentário opcional |
| `painel` | dashboard no navegador: números, gráfico de concluídas por semana, abertas por projeto, lista com filtros e, em cada demanda, a linha do tempo do código (commits, PRs) |
| `relatorio` | documento das concluídas num período (semana, mês, datas) e projeto: um `.md` e um `.html` para salvar em PDF (Ctrl+P), em `Documentos\demandas` |

Nada vai para o GitHub sem você confirmar: criar, marcar e fechar mostram o que
vai acontecer e perguntam antes. O `comecar` nunca dá push. Prioridade e projeto
são labels (`prioridade:alta`, `projeto:loja`), então também funcionam como
filtro no site e no app.

**Ligação com o código:** numa branch criada pelo `comecar` (`feature/42-...`),
o `gcom` acrescenta `Refs 07Dalmaso/demandas#42` na mensagem do commit. O
GitHub liga o commit à demanda (aparece na issue, no app e no painel), e
`Closes 07Dalmaso/demandas#42` na descrição da PR fecha a demanda no merge.
Isso funciona quando o código também está no GitHub.

**Painel:** `demandas painel` abre o [DalmasoDev](#dalmasodev) já na aba
Demandas.

**Projetos:** cada demanda pode ter um projeto (o label `projeto:<nome>`).
Rodando `demandas` dentro da pasta de um projeto, ele já sabe qual é: pelo
nome da pasta do repositório (`loja` = projeto `loja`) ou por um vínculo que a
`nova` oferece na primeira vez (`loja-virtual-api` = projeto `loja`). Aí o
`listar` já abre nesse projeto e a `nova` já vem com ele selecionado. O vínculo
fica só na sua config. No celular, filtre a lista de issues pelo label do projeto.

**Primeira vez** (feito por você, uma vez só):

```powershell
winget install --id GitHub.cli -e      # 1. instala o GitHub CLI
gh auth login                          # 2. num terminal novo: login (abre o navegador)
gh repo create demandas --private      # 3. cria o repositório (ou pelo site, marcando Private)
demandas                               # 4. informa o repositório, ex.: 07Dalmaso/demandas
```

O repositório escolhido fica na sua config (`%APPDATA%\dev-profile\config.json`)
e pode ser trocado no menu.

### phpt

```powershell
phpt           # menu
phpt log       # vai direto para uma ação
phpt -h        # lista as ações
```

Detecta se a pasta é Laravel ou Yii2 e mostra só as ações que fazem sentido:

| Ação | O que faz |
| --- | --- |
| `cache` | limpa o cache (os 4 `*:clear` no Laravel, `cache/flush-all` no Yii2) |
| `dev` | sobe o servidor em porta livre numa janela própria, abre o navegador e roda o Vite |
| `serve` | só o servidor, em porta livre |
| `parar` | encerra o servidor e o Vite **deste projeto**, sem derrubar outros `php`/`node` |
| `log` | mostra o último erro do log, navega pelos anteriores e abre no editor na linha certa |
| `mig` | abre o `mig` |
| `rotas` | `route:list` com filtro por URI |
| `tinker` / `fila` | `tinker` e `queue:work`; Ctrl+C volta ao menu |
| `optimize` / `storage` | `optimize` e `storage:link` |
| `autoload` | `composer dump-autoload` |
| `versoes` | PHP, Composer, Node e a versão do framework (do `composer.lock`) |

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
resultado vai direto para o clipboard. Depois de cada uso o menu volta com a
última ferramenta selecionada.

### diff-str

```powershell
diff-str                         # menu interativo
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

### DalmasoDev

```powershell
dalmasodev          # abre no navegador (ou: dev > Navegador)
dalmasodev json     # abre direto numa aba
```

Um site que roda **só no seu computador** com as abas Demandas (painel,
lista, código ligado a cada demanda, relatório) e as 10 ferramentas do
`tools`. No navegador, as ferramentas atualizam enquanto você digita, aceitam
arquivo arrastado e têm botão de copiar; o comparador mostra A e B lado a lado.

É o mesmo código do terminal: cada ferramenta tem um *motor* em
`lib/tools/motor/`, usado pelo menu do terminal e pelo site. Corrigiu num,
vale nos dois.

Segurança:

- escuta só em `127.0.0.1` (não aparece na rede) e exige uma chave aleatória
  por sessão; outro site aberto no navegador não consegue ler as respostas;
- o que você cola (tokens, JWT, JSON) é processado aqui e não vai para
  nenhum serviço de fora;
- as demandas usam o login do `gh` (nenhum token novo; a credencial nunca vai
  para o navegador) e o site não altera nada no GitHub;
- fica no ar enquanto o terminal estiver aberto; Ctrl+C fecha.

O que estiver desativado no `dev` → configurar também some do site.

## Como está organizado

Uma regra: **o nome do arquivo é o nome do comando, e a pasta é a área.**

```
comandos/                  o que você digita no terminal
  git/   gs.ps1  gcom.ps1  gbranch.ps1 ...
  demandas/  demandas.js
  php/   cachephp.ps1 ...  phpt.js  mig.js
  ferramentas/  tools.js  diff-str.js
  navegador/  dalmasodev.js
  dev/   dev.ps1
lib/                       as partes internas, uma pasta por comando
  comum/   clipboard, editor, entrada, saida, processo, config, prompts
  tools/   menu do terminal de cada ferramenta; index.js é a lista
    motor/   a lógica de cada ferramenta (usada pelo terminal e pelo site)
  phpt/    uma ação por arquivo; index.js é a lista do menu (+ suporte/)
  mig/     leitura das conexões e regras de nome
  demandas/  uma ação por arquivo; index.js é a lista do menu (+ suporte/)
  web/     o DalmasoDev: servidor, rotas e site/ (uma tela por ferramenta)
  dev/     descoberta dos comandos, menu e configuração
profile-carregar.ps1       carrega comandos\*\*.ps1, menos os desativados
scripts/install.ps1        o instalador (chamado pelo install.cmd)
```

A primeira linha de comentário de cada arquivo (`# ...` ou `// ...`) é a
descrição que aparece no `dev`.

## Como adicionar

**Um comando PowerShell:** crie `comandos/<área>/<nome>.ps1` com o comentário
na primeira linha e a função com o mesmo nome do arquivo. Abra um terminal novo
e ele já aparece no `dev`. Área nova é só uma pasta nova.

```powershell
# mostra os ultimos 10 commits
function glog { git log --oneline -10 }
```

**Um comando Node:** crie `comandos/<área>/<nome>.js` (com `#!/usr/bin/env node`
e o comentário na segunda linha), registre em `"bin"` no `package.json` e rode
`npm link` (ou o `install.cmd`).

**Uma ferramenta no `tools`:**

1. a lógica em `lib/tools/motor/<nome>.js` (recebe a entrada, devolve dados,
   sem perguntar nada);
2. o menu do terminal em `lib/tools/<nome>.js` exportando
   `{ id, label, hint, executar }`, e uma linha em `lib/tools/index.js`;
3. para aparecer no DalmasoDev: uma linha em `MOTORES` de
   `lib/web/ferramentas.js` e a tela em `lib/web/site/ferramentas/<nome>.js`
   (sem a tela, ela fica só no terminal).

**Uma ação no `phpt`:** crie `lib/phpt/<nome>.js` exportando
`{ id, label, hint, fw, executar }` (`fw` limita a `['laravel']`, `['yii']` ou
ambos; sem `fw` aparece em qualquer pasta) e adicione uma linha na lista de
`lib/phpt/index.js`.

Nos dois casos, o item novo já aparece no `dev` → `configurar`.

O que mais de um comando usa (clipboard, abrir no editor, pedir um texto,
copiar o resultado, rodar outro programa) já está pronto em `lib/comum/`.

## Rede corporativa

Se o `npm` falhar com `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, é a inspeção TLS do
Zscaler: o Windows confia no CA dele, o Node não. O instalador já resolve isso
quando acha o certificado no Windows; para fazer à mão, aponte o Node para o CA
em vez de desligar a verificação:

```powershell
[Environment]::SetEnvironmentVariable('NODE_EXTRA_CA_CERTS', "$env:USERPROFILE\.certs\zscaler-root.pem", 'User')
```
