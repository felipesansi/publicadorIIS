import * as vscode from 'vscode';
import { PublicadorPanel } from './painel';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            PublicadorPanel.viewType,
            new PublicadorPanel(context.extensionUri, context)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('publicadorIIS.publicar', () => {
            PublicadorPanel.criarOuMostrar(context.extensionUri);
        })
    );
}

export function deactivate() {}
