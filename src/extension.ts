import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('speed-code.startSpeedRun', () => {
    vscode.window.showInformationMessage('Hello World from My Extension!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
