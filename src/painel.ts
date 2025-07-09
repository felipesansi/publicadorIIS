import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as cp from "child_process";

export class PublicadorPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = "publicadorIIS.view";

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {}

  public static criarOuMostrar(extensionUri: vscode.Uri) {
    vscode.commands.executeCommand("workbench.view.extension.publicadorIIS");
  }

  resolveWebviewView(view: vscode.WebviewView) {
    view.webview.options = { enableScripts: true };
    view.webview.html = this.getHtml(view.webview);

    view.webview.onDidReceiveMessage(async (dados) => {
      if (dados.acao === "publicar") {
        const { server, sitePath, urlDestino, user, password } = dados;
        const profileName = "PublicacaoGerada";

        this.context.globalState.update("publicadorIIS.dados", {
          server,
          sitePath,
          urlDestino,
          user,
          password,
        });

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          vscode.window.showErrorMessage("Abra a pasta do projeto ASP.NET.");
          return;
        }

        const projetoPath = workspaceFolders[0].uri.fsPath;
        const csprojFiles = await vscode.workspace.findFiles("**/*.csproj");
        if (csprojFiles.length === 0) {
          vscode.window.showErrorMessage("Nenhum arquivo .csproj encontrado.");
          return;
        }

        const csproj = csprojFiles[0].fsPath;
        const pubxmlDir = path.join(
          projetoPath,
          "Properties",
          "PublishProfiles"
        );
        const pubxmlPath = path.join(pubxmlDir, `${profileName}.pubxml`);

        if (!fs.existsSync(pubxmlDir)) {
          fs.mkdirSync(pubxmlDir, { recursive: true });
        }

        const pubxmlContent = `
<Project>
  <PropertyGroup>
    <WebPublishMethod>MSDeploy</WebPublishMethod>
    <PublishProvider>MSDeploy</PublishProvider>
    <MSDeployServiceURL>${server}</MSDeployServiceURL>
    <DeployIisAppPath>${sitePath}</DeployIisAppPath>
    <UserName>${user}</UserName>
    <Password>${password}</Password>
    <AllowUntrustedCertificate>True</AllowUntrustedCertificate>
    <IncludeIisSettings>False</IncludeIisSettings>
    <UseMsdeployExe>True</UseMsdeployExe>
  </PropertyGroup>
</Project>`.trim();

        fs.writeFileSync(pubxmlPath, pubxmlContent, { encoding: "utf8" });

        const outputChannel = vscode.window.createOutputChannel("Publicador IIS");
        outputChannel.show(true);

        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Publicando no IIS...",
            cancellable: false,
          },
          async () => {
            try {
              const msbuildPath = `"C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\MSBuild\\Current\\Bin\\MSBuild.exe"`;
              const comando = `${msbuildPath} "${csproj}" /p:DeployOnBuild=true /p:PublishProfile=${profileName}`;

              outputChannel.appendLine(`Comando executado: ${comando}`);

              cp.exec(comando, (error, stdout, stderr) => {
                outputChannel.appendLine("---- Saída do MSBuild ----");
                outputChannel.appendLine(stdout);
                outputChannel.appendLine("--------------------------");
                if (error) {
                  outputChannel.appendLine(`Erro: ${error.message}`);
                  outputChannel.appendLine(stderr);
                  vscode.window.showErrorMessage(
                    `Erro na publicação: ${error.message}`
                  );
                  return;
                }

                vscode.window
                  .showInformationMessage(
                    "Publicação concluída com sucesso!",
                    "Abrir site",
                    "Usar outros dados"
                  )
                  .then((opcao) => {
                    if (opcao === "Abrir site") {
                      vscode.env.openExternal(
                        vscode.Uri.parse(urlDestino || `https://${server}`)
                      );
                    } else if (opcao === "Usar outros dados") {
                      view.webview.postMessage({ acao: "limparCampos" });
                    }
                  });
              });
            } catch (error: any) {
              vscode.window.showErrorMessage(`Erro: ${error.message}`);
            }
          }
        );
      }

      if (dados.acao === "carregarDados") {
        const dadosSalvos = this.context.globalState.get("publicadorIIS.dados");
        view.webview.postMessage({
          acao: "preencherCampos",
          dados: dadosSalvos,
        });
      }
    });
  }

  private getHtml(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: sans-serif;
            padding: 12px;
            color: #ddd;
            background-color: transparent;
        }
        input, button {
            width: 100%;
            padding: 6px;
            margin-top: 6px;
            background-color: transparent;
            border: 1px solid #888;
            color: #fff;
            border-radius: 4px;
            font-size: 14px;
        }
        input::placeholder {
            color: #aaa;
        }
        label {
            font-weight: bold;
            margin-top: 10px;
            display: block;
        }
        button {
            background-color: #007acc;
            border: none;
            color: #fff;
            cursor: pointer;
        }
        button:hover {
            background-color: #005f9e;
        }
    </style>
</head>
<body>
    <h3>Publicar no IIS</h3>
    <form id="formulario">
        <label>Servidor Web Deploy:</label>
        <input type="text" id="server" placeholder="ex:123.123.123.223" required>

        <label>Nome do site no IIS:</label>
        <input type="text" id="sitePath" placeholder="ex: Default Web Site/MeuApp" required>

        <label>URL publicada:</label>
        <input type="text" id="urlDestino" placeholder="https://meusite.com">

        <label>Usuário:</label>
        <input type="text" id="user" placeholder="Usuário do Web Deploy" required>

        <label>Senha:</label>
        <input type="password" id="password" placeholder="Senha" required>

        <button type="submit">Publicar</button>
    </form>

    <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('formulario').addEventListener('submit', e => {
            e.preventDefault();
            vscode.postMessage({
                acao: 'publicar',
                server: document.getElementById('server').value,
                sitePath: document.getElementById('sitePath').value,
                urlDestino: document.getElementById('urlDestino').value,
                user: document.getElementById('user').value,
                password: document.getElementById('password').value
            });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.acao === 'preencherCampos') {
                const dados = message.dados || {};
                document.getElementById('server').value = dados.server || '';
                document.getElementById('sitePath').value = dados.sitePath || '';
                document.getElementById('urlDestino').value = dados.urlDestino || '';
                document.getElementById('user').value = dados.user || '';
                document.getElementById('password').value = dados.password || '';
            }
            if (message.acao === 'limparCampos') {
                document.getElementById('server').value = '';
                document.getElementById('sitePath').value = '';
                document.getElementById('urlDestino').value = '';
                document.getElementById('user').value = '';
                document.getElementById('password').value = '';
            }
        });

        vscode.postMessage({ acao: 'carregarDados' });
    </script>
</body>
</html>`;
  }
}