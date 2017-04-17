import { isObservable } from "../api/isobservable";

export interface IEnhancer<T> {
	(newValue: T, oldValue: T | undefined, name: string): T;
}

export interface IModifierDescriptor<T> {
	isMobxModifierDescriptor: boolean;
	initialValue: T | undefined;
	enhancer: IEnhancer<T>;
}

export function isModifierDescriptor(thing): thing is IModifierDescriptor<any> {
	return typeof thing === "object" && thing !== null && thing.isMobxModifierDescriptor === true;
}

export function deepEnhancer(v, _, name) {
	// it is an observable already, done
	if (isObservable(v))
		return v;

	// something that can be converted and mutated?
	// if (Array.isArray(v))
	// 	return observable.array(v, name);
	// if (isPlainObject(v))
	// 	return observable.object(v, name);
	// if (isES6Map(v))
	// 	return observable.map(v, name);

	return v;
}
