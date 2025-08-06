import * as vscode from "vscode";
import { TestResult } from "./tester";
import { format } from "./utils";

class RunTreeItem extends vscode.TreeItem {
  children?: RunTreeItem[];

  constructor(
    label: string | vscode.TreeItemLabel,
    description?: string,
    children?: RunTreeItem[],
    expanded: boolean = false
  ) {
    super(
      label,
      children
        ? expanded
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );
    this.children = children;
    this.description = description;
  }
}

export class MyTreeDataProvider
  implements vscode.TreeDataProvider<RunTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    RunTreeItem | undefined | void
  > = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<RunTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  testResults: TestResult[] = [];
  testSummary: undefined | { elapsed: number; valid: boolean };
  blunders: [number, string | TestResult[]][] = [];

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: RunTreeItem): RunTreeItem {
    return element;
  }

  getChildren(element?: RunTreeItem): Thenable<RunTreeItem[]> {
    if (!element) {
      const items: RunTreeItem[] = [];

      if (this.testSummary) {
        items.push(
          new RunTreeItem(
            `Speedrun Summary`,
            undefined,
            [
              new RunTreeItem("Time Elapsed", format(this.testSummary.elapsed)),
              new RunTreeItem(
                "Test Passed",
                this.testSummary.valid ? "✅ Passed" : "❌ Failed"
              ),
              new RunTreeItem("Blunders", `${this.blunders.length}`),
            ],
            true
          )
        );
      }

      if (this.blunders.length > 0) {
        items.push(
          new RunTreeItem(
            `Blunders`,
            undefined,
            this.blunders.map((blunder, i) =>
              typeof blunder[1] === "string"
                ? new RunTreeItem(blunder[1], format(blunder[0]))
                : new RunTreeItem(
                    `Output Blunder ${i + 1}`,
                    format(blunder[0]),
                    blunder[1].map(
                      (t) =>
                        new RunTreeItem(
                          `(${JSON.stringify(t.input)})`,
                          undefined,
                          [
                            new RunTreeItem("Output", `${t.result}`),
                            new RunTreeItem("Expected Output", `${t.expected}`),
                          ]
                        )
                    )
                  )
            )
          )
        );
      }

      this.testResults.forEach((t) => {
        const item = new RunTreeItem(
          `(${JSON.stringify(t.input)})`,
          undefined,
          [
            new RunTreeItem("Output", `${t.result}`),
            new RunTreeItem("Expected Output", `${t.expected}`),
          ]
        );
        item.description = t.valid ? "✅ Passed" : "❌ Failed";
        items.push(item);
      });

      return Promise.resolve(items);
    } else {
      return Promise.resolve(element.children || []);
    }
  }
}
