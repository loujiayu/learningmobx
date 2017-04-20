import {globalState} from "../core/globalstate";
import {IObservableArray, isObservableArray} from "../types/observablearray";

export const EMPTY_ARRAY = [];
Object.freeze(EMPTY_ARRAY);

export function isObject(value: any): boolean {
	return value !== null && typeof value === "object";
}

export interface Lambda {
	(): void;
	name?: string;
}

export function createInstanceofPredicate<T>(name: string, clazz: new (...arg: any[]) => T): (x: any) => x is T {
  const propName = "isMobX" + name;
  clazz.prototype[propName] = true;
  return function(x) {
    return isObject(x) && x[propName] === true
  } as any;
}

export function getNextId() {
	return ++globalState.mobxGuid;
}

export function once(func: Lambda): Lambda {
	let invoked = false;
	return function() {
		if (invoked)
			return;
		invoked = true;
		return (func as any).apply(this, arguments);
	}
}

declare var Symbol;

export function primitiveSymbol() {
	return (typeof Symbol === "function" && Symbol.toPrimitive) || "@@toPrimitive";
}

export function toPrimitive(value) {
	return value === null ? null : typeof value === "object" ? ("" + value) : value;
}

export function valueDidChange(compareStructural: boolean, oldValue, newValue): boolean {
	if (typeof oldValue === 'number' && isNaN(oldValue)) {
		return typeof newValue !== 'number' || !isNaN(newValue);
	}
	return compareStructural
		? !deepEqual(oldValue, newValue)
		: oldValue !== newValue;
}

export function addHiddenFinalProp(object: any, propName: string, value: any) {
	Object.defineProperty(object, propName, {
		enumerable: false,
		writable: false,
		configurable: true,
		value
	});
}

/**
 * Returns whether the argument is an array, disregarding observability.
 */
export function isArrayLike(x: any): x is Array<any> | IObservableArray<any> {
	return Array.isArray(x) || isObservableArray(x);
}

/**
 * Naive deepEqual. Doesn't check for prototype, non-enumerable or out-of-range properties on arrays.
 * If you have such a case, you probably should use this function but something fancier :).
 */
export function deepEqual(a, b) {
	if (a === null && b === null)
		return true;
	if (a === undefined && b === undefined)
		return true;
	if (typeof a !== "object")
		return a === b;
	const aIsArray = isArrayLike(a);

	if (aIsArray !== isArrayLike(b)) {
		return false;
	} else if (aIsArray) {
		if (a.length !== b.length) {
			return false;
		}
		for (let i = a.length - 1; i >= 0; i--)
			if (!deepEqual(a[i], b[i]))
				return false;
		return true;
	}
	// const aIsMap = isMapLike(a);
	// if (aIsArray !== isArrayLike(b)) {
	// 	return false;
	// } else if (aIsMap !== isMapLike(b)) {
	// 	return false;
	// } else if (aIsArray) {
	// 	if (a.length !== b.length)
	// 		return false;
	// 	for (let i = a.length -1; i >= 0; i--)
	// 		if (!deepEqual(a[i], b[i]))
	// 			return false;
	// 	return true;
	// } else if (aIsMap) {
	// 	if (a.size !== b.size)
	// 		return false;
	// 	let equals = true;
	// 	a.forEach((value, key) => {
	// 		equals = equals && deepEqual(b.get(key), value);
	// 	});
	// 	return equals;
	// } else if  (typeof a === "object" && typeof b === "object") {
	// 	if (a === null || b === null)
	// 		return false;
	// 	if (isMapLike(a) && isMapLike(b)) {
	// 		if (a.size !== b.size)
	// 			return false;
	// 		// Freaking inefficient.... Create PR if you run into this :) Much appreciated!
	// 		return deepEqual(observable.shallowMap(a).entries(), observable.shallowMap(b).entries());
	// 	}
	// 	if (getEnumerableKeys(a).length !== getEnumerableKeys(b).length)
	// 		return false;
	// 	for (let prop in a) {
	// 		if (!(prop in b))
	// 			return false;
	// 		if (!deepEqual(a[prop], b[prop]))
	// 			return false;
	// 	}
	// 	return true;
	// }
	return false;
}