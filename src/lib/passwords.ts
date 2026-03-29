export const GENERATED_PASSWORD_MIN_LENGTH = 10;
export const GENERATED_PASSWORD_MAX_LENGTH = 15;
export const GENERATED_PASSWORD_PATTERN = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{}|;:,.<>?]+$/;

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const NUMBERS = "23456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const ALL_CHARACTERS = `${LETTERS}${NUMBERS}${SYMBOLS}`;

function randomIndex(max: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}

function randomCharacter(source: string) {
  return source[randomIndex(source.length)] ?? source[0] ?? "";
}

function shuffleCharacters(characters: string[]) {
  const shuffled = [...characters];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex] ?? "", shuffled[index] ?? ""];
  }

  return shuffled;
}

export function generateLockInPassword() {
  const targetLength = GENERATED_PASSWORD_MIN_LENGTH + randomIndex(GENERATED_PASSWORD_MAX_LENGTH - GENERATED_PASSWORD_MIN_LENGTH + 1);

  const required = [randomCharacter(LETTERS), randomCharacter(NUMBERS), randomCharacter(SYMBOLS)];
  const remainder = Array.from({ length: targetLength - required.length }, () => randomCharacter(ALL_CHARACTERS));

  return shuffleCharacters([...required, ...remainder]).join("");
}
