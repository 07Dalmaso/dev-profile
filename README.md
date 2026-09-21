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

## Rede corporativa

Se o `npm` falhar com `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, é a inspeção TLS do
Zscaler: o Windows confia no CA dele, o Node não. O instalador já resolve isso
quando acha o certificado no Windows; para fazer à mão, aponte o Node para o CA
em vez de desligar a verificação:

```powershell
[Environment]::SetEnvironmentVariable('NODE_EXTRA_CA_CERTS', "$env:USERPROFILE\.certs\zscaler-root.pem", 'User')
```
