export const problems = ["Two Sum", "Palindrome", "Fibonacci", "Factorial", "Find Missing Number", "Anagram", "Reverse Words In a Sentence"];

export function format(timeSeconds: number): string {
  if (timeSeconds > 86400) {
    const days = Math.floor(timeSeconds / 86400);
    const hours = Math.floor(timeSeconds / 3600);
    const minutes = Math.floor(timeSeconds / 60);
    return `${days}:${hours - days * 24}:${minutes - hours * 60}:${(
      timeSeconds -
      minutes * 60
    ).toFixed(3)}`;
  } else if (timeSeconds >= 3600) {
    const hours = Math.floor(timeSeconds / 3600);
    const minutes = Math.floor(timeSeconds / 60);
    return `${hours}:${minutes - hours * 60}:${(
      timeSeconds -
      minutes * 60
    ).toFixed(3)}`;
  } else if (timeSeconds >= 60) {
    const minutes = Math.floor(timeSeconds / 60);
    return `${minutes}:${(timeSeconds - minutes * 60).toFixed(3)}`;
  } else {
    return `${timeSeconds}`;
  }
}
