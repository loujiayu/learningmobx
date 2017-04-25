import {ObservableValue, UNCHANGED} from "./observablevalue";
import {isComputedValue, ComputedValue} from "../core/computedvalue";
import {createInstanceofPredicate, isObject, isPlainObject, addHiddenFinalProp, getNextId} from "../utils/utils";
import {hasInterceptors, IInterceptable, registerInterceptor, interceptChange} from "./intercept-utils";
import {IListenable, registerListener, hasListeners, notifyListeners} from "./listen-utils";
import {IEnhancer, isModifierDescriptor, IModifierDescriptor} from "../types/modifiers";

export interface IObjectWillChange {
	object: any;
	type: "update" | "add";
	name: string;
	newValue: any;
}

// export class ObservableObjectAdministration implements IInterceptable<IObjectWillChange>, IListenable {
export class ObservableObjectAdministration {
  values: {[key: string]: ObservableValue<any>|ComputedValue<any>} = {};
	changeListeners = null;
	interceptors = null;

	constructor(public target: any, public name: string) { }
}

export interface IObservableObject {
	"observable-object": IObservableObject;
}

export function asObservableObject(target, name?: string): ObservableObjectAdministration {
	if (isObservableObject(target))
		return (target as any).$mobx;
	if (!isPlainObject(target))
		name = name = (target.constructor.name || "ObservableObject") + "@" + getNextId();
	if (!name)
		name = "ObservableObject@" + getNextId();

	const adm = new ObservableObjectAdministration(target, name);
	addHiddenFinalProp(target, '$mobx', adm);
	return adm;
}

const isObservableObjectAdministration = createInstanceofPredicate("ObservableObjectAdministration", ObservableObjectAdministration);

export function isObservableObject(thing: any): thing is IObservableObject {
	if (isObject(thing)) {
		// Initializers run lazily when transpiling to babel, so make sure they are run...
		// runLazyInitializers(thing);
		return isObservableObjectAdministration((thing as any).$mobx);
	}
	return false;
}

export function defineObservablePropertyFromDescriptor(adm: ObservableObjectAdministration, propName: string, descriptor: PropertyDescriptor, defaultEnhancer: IEnhancer<any>) {
	if ("value" in descriptor) {
		defineObservableProperty(adm, propName, descriptor.value, defaultEnhancer);
	} else {
		defineComputedProperty(adm, propName, descriptor.get, descriptor.set, false, true);
	}
}

export function defineObservableProperty(
	adm: ObservableObjectAdministration,
	propName: string,
	newValue,
	enhancer: IEnhancer<any>
) {
	const observable = adm.values[propName] = new ObservableValue(newValue, enhancer, `${adm.name}.${propName}`, false)
	newValue = (observable as any).value;

	Object.defineProperty(adm.target, propName, generateObservablePropConfig(propName));
	notifyPropertyAddition(adm, adm.target, propName, newValue);
}

export function defineComputedProperty(
	adm: ObservableObjectAdministration,
	propName: string,
	getter,
	setter,
	compareStructural: boolean,
	asInstanceProperty: boolean
) {
	adm.values[propName] = new ComputedValue(getter, adm.target, compareStructural, `${adm.name}.${propName}`, setter);
	if (asInstanceProperty) {
		Object.defineProperty(adm.target, propName, generateComputedPropConfig(propName));
	}
}

const observablePropertyConfigs = {};
const computedPropertyConfigs = {};

export function generateObservablePropConfig(propName) {
	return observablePropertyConfigs[propName] || (
		observablePropertyConfigs[propName] = {
			configurable: true,
			enumerable: true,
			get: function() {
				return this.$mobx.values[propName].get();
			},
			set: function(v) {
				setPropertyValue(this, propName, v);
			}
		}
	);
}

export function generateComputedPropConfig(propName) {
	return computedPropertyConfigs[propName] || (
		computedPropertyConfigs[propName] = {
			configurable: true,
			enumerable: false,
			get: function() {
				return this.$mobx.values[propName].get();
			},
			set: function(v) {
				return this.$mobx.values[propName].set(v);
			}
		}
	);
}

function notifyPropertyAddition(adm, object, name: string, newValue) {
	const notify = hasListeners(adm);
	const notifySpy = false;
	const change = notify || notifySpy ? {
			type: "add",
			object, name, newValue
		} : null;
}

export function setPropertyValue(instance, name: string, newValue) {
	const adm = instance.$mobx;
	const observable = adm.values[name];

	// intercept
	if (hasInterceptors(adm)) {
		const change = interceptChange<IObjectWillChange>(adm, {
			type: "update",
			object: instance,
			name, newValue
		});
		if (!change)
			return;
		newValue = change.newValue;
	}
	newValue = observable.prepareNewValue(newValue);
	if (newValue !== UNCHANGED) {
		observable.setNewValue(newValue);
	}
}