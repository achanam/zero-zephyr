// Bitwarden-style generator: built entirely on crypto.getRandomValues
// (never Math.random) with rejection sampling for unbiased picks, one
// guaranteed char per enabled class, then a Fisher-Yates shuffle.

export type PwCharClass = "upper" | "lower" | "numbers" | "symbols";

export type PwGenOptions = {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
};

export const PW_CHAR_SETS: Record<PwCharClass, string> = {
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ", // no I/O
  lower: "abcdefghijkmnopqrstuvwxyz", // no l
  numbers: "23456789", // no 0/1
  symbols: "!@#$%^&*()-_=+[]{}?",
};

function uniformRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) throw new Error("maxExclusive must be positive");
  if (maxExclusive > 256) {
    throw new Error("uniformRandomInt: maxExclusive > 256 not supported");
  }
  const range = 256 - (256 % maxExclusive);
  const buf = new Uint8Array(1);
  let val: number;
  do {
    crypto.getRandomValues(buf);
    val = buf[0];
  } while (val >= range);
  return val % maxExclusive;
}

function pickRandomChar(pool: string): string {
  return pool[uniformRandomInt(pool.length)];
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = uniformRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generatePassword(options: PwGenOptions): string {
  const enabledClasses = (Object.keys(PW_CHAR_SETS) as PwCharClass[]).filter((k) => options[k]);
  if (enabledClasses.length === 0) {
    throw new Error("Select at least one character type.");
  }
  if (options.length < enabledClasses.length) {
    throw new Error(`Length must be at least ${enabledClasses.length} to include one of each selected type.`);
  }

  const combinedPool = enabledClasses.map((k) => PW_CHAR_SETS[k]).join("");

  const chars = enabledClasses.map((k) => pickRandomChar(PW_CHAR_SETS[k]));
  while (chars.length < options.length) {
    chars.push(pickRandomChar(combinedPool));
  }

  return fisherYatesShuffle(chars).join("");
}

export function estimatePasswordStrength(options: PwGenOptions): { label: string; level: "weak" | "ok" | "strong" } {
  const classes: PwCharClass[] = ["upper", "lower", "numbers", "symbols"];
  const classCount = classes.filter((k) => options[k]).length;
  const poolSize = classes.filter((k) => options[k]).reduce((sum, k) => sum + PW_CHAR_SETS[k].length, 0);
  const entropyBits = options.length * Math.log2(Math.max(poolSize, 2));

  if (entropyBits < 40 || classCount === 0) return { label: "Weak", level: "weak" };
  if (entropyBits < 70) return { label: "Adequate", level: "ok" };
  return { label: "Strong", level: "strong" };
}
