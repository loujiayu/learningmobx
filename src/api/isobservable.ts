import {isAtom} from "../core/atom";

export function isObservable(value, property?: string): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  return isAtom(value);
}