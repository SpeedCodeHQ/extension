import vm from "vm";
import assert from "assert";

export interface TestCase {
  input: any[];
  expected: any;
}
export interface TestResult extends TestCase {
  result: any;
  valid: boolean;
}

export default function testCode(
  code: string,
  testCases: TestCase[]
): [boolean, TestResult[]] {
  const context: Record<string, any> = {};
  vm.createContext(context);

  const beforeKeys = new Set(Object.keys(context));

  const script = new vm.Script(code);
  script.runInContext(context);

  const afterKeys = Object.keys(context);
  const newKeys = afterKeys.filter((k) => !beforeKeys.has(k));

  // Find the last function defined
  const funcs = newKeys
    .map((k) => context[k])
    .filter((v) => typeof v === "function");

  if (funcs.length === 0) {
    throw new Error("No function was defined in the code.");
  }

  const targetFn = funcs[funcs.length - 1];

  const tests = testCases.map((t) => {
    const result = targetFn(...t.input);

    try {
      assert.strictEqual(result, t.expected);
      return { ...t, valid: true, result };
    } catch {
      return { ...t, valid: false, result };
    }
  });

  return [tests.every((t) => t.valid), tests];
}
