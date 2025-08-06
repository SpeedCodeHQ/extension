import * as vscode from 'vscode';
import os from 'os';
import path from 'path';
import fs from 'fs';
import testCode from './tester';
import * as utils from './utils';

let resetTimer = () => {}

const speedCodePath = path.join(os.homedir(), ".speed-code/");

if (!fs.existsSync(speedCodePath)) {
  fs.mkdirSync(speedCodePath);
}

export async function openAndFocusFile(filePath: string) {
  const document = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(document, { preview: false, preserveFocus: false });
}

const userCode = `
function isPalindrome(s) {
  return s === s.split('').reverse().join('');
}
`;

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.tooltip = 'Speedrun timer';
  statusBarItem.text = "No active Speedrun";
  statusBarItem.show();

  let run: undefined | { path: string, elapsed: number, timer: NodeJS.Timeout };

  resetTimer = () => {
    if (run) {
      clearInterval(run.timer);
      run = undefined;
    }
    statusBarItem.text = "No active Speedrun";
  };

  resetTimer();

  context.subscriptions.push(vscode.commands.registerCommand('speed-code.submitSpeedRun', () => {
    if (run) {
      const [isValid, res] = testCode(fs.readFileSync(run.path).toString(), [
        { input: ["racecar"], expected: true },
        { input: ["hello"], expected: true },
        { input: ["madam"], expected: true },
      ]);

      vscode.window.showInformationMessage('Time: ' + run.elapsed);

      if (isValid) {
        resetTimer();
      }
    }
  }));


  context.subscriptions.push(vscode.commands.registerCommand('speed-code.startSpeedRun', () => {
    const runFilePath = path.join(speedCodePath, 'isPalindrome.js');
    fs.writeFileSync(runFilePath, '');
    openAndFocusFile(runFilePath);

    const startTime = Date.now();
    run = {
      path: runFilePath,
      elapsed: 0,
      timer: setInterval(() => {
        if (!run) return;
        const currentTime = Date.now();
        run.elapsed = (currentTime - startTime) / 1000;
        statusBarItem.text = utils.format(run.elapsed);
        statusBarItem.color = '#fff';
      }, 10),
    };

    vscode.window.showInformationMessage('Speedrun Started!');
  }), statusBarItem);

  context.subscriptions.push(vscode.commands.registerCommand('speed-code.cancelSpeedRun', resetTimer), statusBarItem);
}

export function deactivate() {
  resetTimer();
}
