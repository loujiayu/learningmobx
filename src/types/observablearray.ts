import {IListenable, registerListener, hasListeners, notifyListeners} from "./listen-utils";
import {IInterceptable, IInterceptor, registerInterceptor} from "./intercept-utils";
import {isObject, createInstanceofPredicate, getNextId, Lambda, addHiddenFinalProp, EMPTY_ARRAY, addHiddenProp} from "../utils/utils";
import {BaseAtom} from "../core/atom";
import {IEnhancer} from "../types/modifiers";

export interface IObservableArray<T> extends Array<T> {
	spliceWithArray(index: number, deleteCount?: number, newItems?: T[]): T[];
	observe(listener: (changeData: IArrayChange<T>|IArraySplice<T>) => void, fireImmediately?: boolean): Lambda;
	intercept(handler: IInterceptor<IArrayChange<T> | IArraySplice<T>>): Lambda;
	intercept<T>(handler: IInterceptor<IArrayChange<T> | IArraySplice<T>>): Lambda; // TODO: remove in 4.0
	clear(): T[];
	peek(): T[];
	replace(newItems: T[]): T[];
	find(predicate: (item: T, index: number, array: IObservableArray<T>) => boolean, thisArg?: any, fromIndex?: number): T;
	remove(value: T): boolean;
	move(fromIndex: number, toIndex: number): void;
}

export interface IArrayChange<T> {
	type: "update";
	object: IObservableArray<T>;
	index: number;
	newValue: T;
	oldValue: T;
}

export interface IArraySplice<T> {
	type: "splice";
	object: IObservableArray<T>;
	index: number;
	added: T[];
	addedCount: number;
	removed: T[];
	removedCount: number;
}

export interface IArrayWillChange<T> {
	type: "update";
	object: IObservableArray<T>;
	index: number;
	newValue: T;
}

export interface IArrayWillSplice<T> {
	type: "splice";
	object: IObservableArray<T>;
	index: number;
	added: T[];
	removedCount: number;
}

let OBSERVABLE_ARRAY_BUFFER_SIZE = 0;

export class StubArray {
}
StubArray.prototype = [];

// class ObservableArrayAdministration<T> implements IInterceptable<IArrayWillChange<T> | IArrayWillSplice<T>>, IListenable {
class ObservableArrayAdministration<T> implements IListenable {
  atom: BaseAtom;
	values: T[];
	lastKnownLength: number = 0;
	interceptors = null;
	changeListeners = null;
	enhancer: (newV: T, oldV: T | undefined) => T;

  constructor(name, enhancer: IEnhancer<T>, public array: IObservableArray<T>, public owned: boolean) {
		this.atom = new BaseAtom(name || ("ObservableArray@" + getNextId()));
		this.enhancer = (newV, oldV) => enhancer(newV, oldV, name + "[..]");
	}

  observe(listener: (changeData: IArrayChange<T>|IArraySplice<T>) => void, fireImmediately = false): Lambda {
    if (fireImmediately) {
      listener(<IArraySplice<T>>{
				object: this.array,
				type: "splice",
				index: 0,
				added: this.values.slice(),
				addedCount: this.values.length,
				removed: [],
				removedCount: 0
			});
    }
    return registerListener(this, listener);
  }


  updateArrayLength(oldLength: number, delta: number) {
    this.lastKnownLength += delta;
    if (delta > 0 && oldLength + delta + 1 > OBSERVABLE_ARRAY_BUFFER_SIZE)
			reserveArrayBuffer(oldLength + delta + 1);
  }

  notifyArraySplice<T>(index: number, added: T[], removed: T[]) {
    const notifySpy = !this.owned;
		const notify = hasListeners(this);
		const change = notify || notifySpy ? {
				object: this.array,
				type: "splice",
				index, removed, added,
				removedCount: removed.length,
				addedCount: added.length
			} : null;
    this.atom.reportChanged();
  }
}

export class ObservableArray<T> extends StubArray {
  private $mobx: ObservableArrayAdministration<T>;

  constructor(initialValues: T[] | undefined, enhancer: IEnhancer<T>, name = "ObservableArray@" + getNextId(), owned = false) {
    super()

    const adm = new ObservableArrayAdministration<T>(name, enhancer, this as any, owned);
    addHiddenFinalProp(this, "$mobx", adm);

    if (initialValues && initialValues.length) {
			adm.updateArrayLength(0, initialValues.length);
			adm.values = initialValues.map(v => enhancer(v, undefined, name + "[..]"));
			adm.notifyArraySplice(0, adm.values.slice(), EMPTY_ARRAY);
		} else {
			adm.values = [];
		}
  }
}

function reserveArrayBuffer(max: number) {
	for (let index = OBSERVABLE_ARRAY_BUFFER_SIZE; index < max; index++)
		createArrayBufferItem(index);
	OBSERVABLE_ARRAY_BUFFER_SIZE = max;
}

function createArrayBufferItem(index: number) {
	const set = createArraySetter(index);
	const get = createArrayGetter(index);
	Object.defineProperty(ObservableArray.prototype, "" + index, {
		enumerable: false,
		configurable: true,
		set, get
	});
}

function createArraySetter(index: number) {
  return function<T>(newValue: T) {
		const adm = <ObservableArrayAdministration<T>> this.$mobx;
		const values = adm.values;
		if (index < values.length) {
			const oldValue = values[index];
			// if ()
		}
  }
}

function createArrayGetter(index: number) {
  return function() {
    const impl = <ObservableArrayAdministration<any>> this.$mobx;
    if (impl) {
      if (index < impl.values.length) {
        impl.atom.reportObserved();
        return impl.values[index];
      }
      console.warn(`[mobx.array] Attempt to read an array index (${index}) that is out of bounds (${impl.values.length}). Please check length first. Out of bound indices will not be tracked by MobX`);
    }
    return undefined;
  }
}

[
	"every",
	"filter",
	"forEach",
	"indexOf",
	"join",
	"lastIndexOf",
	"map",
	"reduce",
	"reduceRight",
	"slice",
	"some"
].forEach(funcName => {
	const baseFunc = Array.prototype[funcName];
	addHiddenProp(ObservableArray.prototype, funcName, function() {
		this.$mobx.atom.reportObserved();
		return baseFunc.apply(this.$mobx.values, arguments);
	});
});


const isObservableArrayAdministration = createInstanceofPredicate("ObservableArrayAdministration", ObservableArrayAdministration);

export function isObservableArray(thing): thing is IObservableArray<any> {
	return isObject(thing) && isObservableArrayAdministration(thing.$mobx);
}
