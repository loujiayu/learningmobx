import {isObservable} from "./isobservable";
import {deepEnhancer} from "../types/modifiers";
import {IObservableValue, ObservableValue} from "../types/observablevalue";

function createObservable(v: any = undefined) {
  if (typeof arguments[1] === 'string')
    return;

  if (isObservable(v))
    return v;

  const res = deepEnhancer(v, undefined, undefined);

  if (res !== v) 
    return res;

  return observable.box(v);
}

export interface IObservableFactory {
  <T>(): IObservableValue<T>;
	// <T>(wrapped: IModifierDescriptor<T>): T;
	(target: Object, key: string, baseDescriptor?: PropertyDescriptor): any;
	// <T>(value: T[]): IObservableArray<T>;
	(value: string): IObservableValue<string>;
	(value: boolean): IObservableValue<boolean>;
	(value: number): IObservableValue<number>;
	(value: Date): IObservableValue<Date>;
	(value: RegExp): IObservableValue<RegExp>;
	(value: Function): IObservableValue<Function>;
	<T>(value: null | undefined): IObservableValue<T>;
	(value: null | undefined): IObservableValue<any>;
	(): IObservableValue<any>;
	// <T>(value: IMap<string | number | boolean, T>): ObservableMap<T>;
	// <T extends Object>(value: T): T & IObservableObject;
	<T>(value: T): IObservableValue<T>;
}

export class IObservableFactories {
  box<T>(value?: T, name?: string): IObservableValue<T> {
    return new ObservableValue(value, deepEnhancer, name);
  }
}

export var observable: IObservableFactory & IObservableFactories = createObservable as any;

Object.keys(IObservableFactories.prototype).forEach(key => observable[key] = IObservableFactories.prototype[key]);
