import { Warrior } from "./warrior";

export function sanitizeWarriors(warriors: Warrior[]): Warrior[] {
  warriors.forEach((x) => {
    x.name = sanitizeString(x.name);
    x.hp = sanitizeString(x.hp);
  });
  return warriors;
}

function sanitizeString(input: string): string {
  return input.replace(/[^a-zA-Z0-9 /]/g, "");
}
