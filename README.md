# Publicador IIS

Extensão do Visual Studio Code para publicar projetos ASP.NET no IIS remoto usando Web Deploy (MSDeploy).

---

## 📦 Recursos

- Criação automática de perfil `.pubxml`
- Suporte a autenticação por usuário e senha
- Interface gráfica na barra lateral do VS Code
- Suporte a múltiplas publicações com diferentes dados

---

## 🚀 Como usar

1. Abra o projeto ASP.NET no VS Code.
2. Acesse o painel lateral **"Publicar IIS"**.
3. Preencha os campos com os dados do seu servidor:
   - **Servidor Web Deploy**: exemplo.com:8172/msdeploy.axd
   - **Nome do site no IIS**: Default Web Site/MeuApp
   - **Usuário e senha**: credenciais do Web Deploy
4. Clique em **Publicar**.
5. Após a publicação, você poderá abrir a URL do site.

---

## 🛠️ Requisitos

- Projeto ASP.NET com `.csproj`
- Visual Studio instalado (com MSBuild)
- Web Deploy instalado no servidor IIS de destino

---

## 💡 Dicas

- O perfil gerado será salvo em `Properties/PublishProfiles/PublicacaoGerada.pubxml`.
- Você pode editar esse arquivo manualmente se desejar.
- Caso queira usar outro perfil, basta criar um novo no Visual Studio.

---

## 🧪 Testar Localmente

Para instalar a extensão localmente:

```bash
code --install-extension publicador-iis-0.0.1.vsix
vsce publish
