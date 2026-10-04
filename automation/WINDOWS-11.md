# n8n no Windows 11

Usaremos Ubuntu no WSL 2 e Docker Engine dentro dele. Esse caminho reutiliza os scripts do projeto. O WSL permite executar um ambiente Linux no Windows.

## Primeiro: conferir o Windows e o SSD

Abra **PowerShell como administrador** pelo menu Iniciar. Execute um comando por vez:

```powershell
wsl --status
wsl --list --verbose
Get-PSDrive -Name ($env:SystemDrive.TrimEnd(':')) | Select-Object Name,@{Name='Livre_GB';Expression={[math]::Round($_.Free/1GB,1)}}
```

Envie o resultado antes de prosseguir se houver erro. A edição mencionada pelo usuário ainda não foi verificada; não presumimos que seus componentes estejam habilitados.

Reserve cerca de **15 GB livres** no SSD para a primeira instalação e uma margem de trabalho. É uma recomendação deste projeto. O disco virtual do WSL pode mostrar espaço livre que ainda depende do espaço físico no SSD.

## Instalar o WSL, se ainda não estiver configurado

Ainda no PowerShell como administrador:

```powershell
wsl --list --online
```

Se `Ubuntu-24.04` estiver na lista:

```powershell
wsl --install -d Ubuntu-24.04
```

Reinicie o Windows se solicitado. Abra Ubuntu pelo menu Iniciar e crie seu usuário e sua senha Linux.

Confira a versão no PowerShell:

```powershell
wsl --list --verbose
```

Ubuntu deve aparecer com **VERSION 2**. Se for 1, se o comando não existir ou se houver erro sobre virtualização, envie a mensagem para ajustarmos o ambiente antes de instalar o projeto.

## Dentro do Ubuntu do WSL

Os comandos abaixo são executados no **terminal Ubuntu**, não no PowerShell.

Primeiro confira:

```bash
ps -p 1 -o comm=
```

O resultado esperado é `systemd`. Se aparecer outro nome, pare e envie o resultado; precisamos configurar o gerenciador de serviços conforme a documentação do WSL.

Depois:

```bash
cd ~
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/Wesleyttiago/garimpo-smart-ml.git
cd garimpo-smart-ml/automation
bash install-ubuntu.sh
bash setup.sh
bash manage.sh test
```

Mantenha o projeto na pasta pessoal do Ubuntu. Esse local evita problemas de montagem e permissões ao trabalhar com arquivos do Windows.

Esta é uma instalação nova. O script cria uma nova chave privada e um volume para os dados. O arquivo da instalação antiga só seria necessário para migrar os dados antigos; não é feito nenhum acesso automático ao outro disco.

## Abrir o n8n

No navegador do Windows:

- **http://localhost:5678**: crie seu usuário local e abra o fluxo Garimpo Smart.
- **http://localhost:8078**: confira os cinco candidatos DEMO depois da execução.

Se a página não abrir, envie `bash manage.sh status` e `bash manage.sh logs` no Ubuntu.

Para voltar em outro momento, abra Ubuntu e execute:

```bash
cd ~/garimpo-smart-ml/automation
bash manage.sh start
```

Para parar, use `bash manage.sh stop`. O Windows, o WSL e os serviços precisam estar funcionando para executar agendas. Evite suspender o computador durante as execuções.

A busca real e os links de afiliado ainda exigem as conexões autorizadas. Para a conexão OAuth oficial, veja [CONECTAR-MERCADO-LIVRE.md](CONECTAR-MERCADO-LIVRE.md). A próxima automação poderá ser criada como outro fluxo nesse mesmo n8n.

Fontes oficiais:

- https://learn.microsoft.com/en-us/windows/wsl/install
- https://learn.microsoft.com/en-us/windows/wsl/systemd
- https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose.md

O projeto foi validado em Docker/Linux. A disponibilidade do WSL e a instalação neste Windows precisam ser confirmadas pelos resultados do usuário.
