import * as vscode from 'vscode';

let resetTimer = () => {}

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.tooltip = 'Speedrun timer';
  statusBarItem.text = "No active Speedrun";
  statusBarItem.show();

  let timer: undefined | NodeJS.Timeout;

  resetTimer = () => {
    if (timer) {
      clearInterval(timer);
    }
    statusBarItem.text = "No active Speedrun";
  };

  resetTimer();

  context.subscriptions.push(vscode.commands.registerCommand('speed-code.startSpeedRun', () => {
    const startTime = Date.now();
    timer = setInterval(() => {
      const currentTime = Date.now();
      const timeSeconds = (currentTime - startTime) / 1000;
      if (timeSeconds > 86400) {
        const days = Math.floor(timeSeconds / 86400);
        const hours = Math.floor(timeSeconds / 3600);
        const minutes = Math.floor(timeSeconds / 60);
        statusBarItem.text = `${days}:${hours - (days * 24)}:${minutes - (hours * 60)}:${(timeSeconds - (minutes * 60)).toFixed(3)}`;
      } else if (timeSeconds >= 3600) {
        const hours = Math.floor(timeSeconds / 3600);
        const minutes = Math.floor(timeSeconds / 60);
        statusBarItem.text = `${hours}:${minutes - (hours * 60)}:${(timeSeconds - (minutes * 60)).toFixed(3)}`;
      } else if (timeSeconds >= 60) {
        const minutes = Math.floor(timeSeconds / 60);
        statusBarItem.text = `${minutes}:${(timeSeconds - (minutes * 60)).toFixed(3)}`;
      } else {
        statusBarItem.text = `${timeSeconds}`;
      }
      statusBarItem.color = '#fff';
    }, 10);

    vscode.window.showInformationMessage('Speedrun Started!');
  }), statusBarItem);

  context.subscriptions.push(vscode.commands.registerCommand('speed-code.cancelSpeedRun', resetTimer), statusBarItem);
}

export function deactivate() {
  resetTimer();
}
