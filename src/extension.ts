import * as vscode from "vscode";
import os from "os";
import path from "path";
import fs from "fs";
import testCode, { TestCase } from "./tester";
import * as utils from "./utils";
import { MyTreeDataProvider } from "./resultViewer";

let resetTimer = () => {};

const speedCodePath = path.join(os.homedir(), ".speed-code/");

if (!fs.existsSync(speedCodePath)) {
  fs.mkdirSync(speedCodePath);
}

export async function openAndFocusFile(filePath: string) {
  const document = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(document, {
    preview: false,
    preserveFocus: false,
  });
}

const userCode = `
function isPalindrome(s) {
  return s === s.split('').reverse().join('');
}
`;

const treeDataProvider = new MyTreeDataProvider();

const treeView = vscode.window.createTreeView("speedCodeResultTab", {
  treeDataProvider,
});

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.tooltip = "Speedrun timer";
  statusBarItem.text = "No active Speedrun";
  statusBarItem.show();

  let run:
    | undefined
    | {
        path: string;
        name: string;
        testCases: TestCase[];
        elapsed: number;
        timer: NodeJS.Timeout;
      };

  resetTimer = () => {
    if (run) {
      clearInterval(run.timer);
      run = undefined;
    }
    statusBarItem.text = "No active Speedrun";
  };

  resetTimer();
  updateTreeMessage();

  context.subscriptions.push(
    vscode.commands.registerCommand("speed-code.submitSpeedRun", () => {
      if (run) {
        try {
          const [isValid, res] = testCode(
            fs.readFileSync(run.path).toString(),
            run.testCases
          );

          if (isValid) {
            treeDataProvider.testResults = res;
            treeDataProvider.testSummary = {
              elapsed: run.elapsed,
              valid: isValid,
            };
            resetTimer();
          } else {
            treeDataProvider.blunders.push([run.elapsed, res]);
          }

          treeDataProvider.refresh();
          updateTreeMessage();
        } catch (e) {
          treeDataProvider.blunders.push([run.elapsed, String(e)]);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("speed-code.startSpeedRun", async () => {
      const quickPick = vscode.window.createQuickPick();
      quickPick.placeholder = "Type to search";
      quickPick.matchOnDescription = true;
      quickPick.items = utils.problems.map((label) => ({ label }));
      quickPick.onDidChangeValue((value) => {
        quickPick.items = utils.problems
          .filter((prob) => prob.toLowerCase().includes(value.toLowerCase()))
          .map((label) => ({ label }));
      });
      quickPick.onDidAccept(async () => {
        const selection = quickPick.selectedItems[0];
        if (selection) {
          const name = selection.label.toLowerCase();
          treeDataProvider.testSummary = undefined;
          treeDataProvider.testResults = [];
          treeDataProvider.blunders = [];
          updateTreeMessage();
          const runFilePath = path.join(speedCodePath, name + ".js");
          fs.writeFileSync(runFilePath, "");
          openAndFocusFile(runFilePath);

          const response = await fetch(
            `https://raw.githubusercontent.com/SpeedCodeHQ/problems/refs/heads/main/${name}.json`
          );

          if (!response.ok) {
            vscode.window.showErrorMessage(
              `Failed to fetch test cases for ${name}: ${response.statusText}`
            );
            return;
          }

          const startTime = Date.now();
          run = {
            path: runFilePath,
            elapsed: 0,
            name,
            testCases: (await response.json()) as TestCase[],
            timer: setInterval(() => {
              if (!run) return;
              const currentTime = Date.now();
              run.elapsed = (currentTime - startTime) / 1000;
              statusBarItem.text = utils.format(run.elapsed);
              statusBarItem.color = "#fff";
            }, 10),
          };

          vscode.window.showInformationMessage("Speedrun Started!");
        }
        quickPick.hide();
      });
      quickPick.show();
    }),
    statusBarItem
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("speed-code.cancelSpeedRun", () => {
      resetTimer();
      treeDataProvider.testSummary = undefined;
      treeDataProvider.testResults = [];
      treeDataProvider.blunders = [];
      treeDataProvider.refresh();
    }),
    statusBarItem
  );
}

export function deactivate() {
  resetTimer();
}

function updateTreeMessage() {
  if (
    !treeDataProvider.testResults.length &&
    !treeDataProvider.blunders.length &&
    !treeDataProvider.testSummary
  ) {
    treeView.message = "No results yet. Start a speedrun!";
  } else {
    treeView.message = "";
  }
}
