import {deepEnhancer, IEnhancer} from "../types/modifiers";
import {asObservableObject, defineObservablePropertyFromDescriptor} from "../types/observableobject";
import {hasOwnProperty, isPropertyConfigurable} from "../utils/utils";

export function extendObservable<A extends Object, B extends Object>(target: A, ...properties: B[]): A & B {
	return extendObservableHelper(target, deepEnhancer, properties) as any;
}

export function extendObservableHelper(target: Object, defaultEnhancer: IEnhancer<any>, properties: Object[]): Object {
  const adm = asObservableObject(target);
  const definedProps = {}

  for (let i = properties.length - 1; i >= 0; i--) {
    const propSet = properties[i]
    for (let key in propSet) if (definedProps[key] !== true && hasOwnProperty(propSet, key)) {
      definedProps[key] = true
      if (target as any === propSet && !isPropertyConfigurable(target, key))
        continue;
      const descriptor = Object.getOwnPropertyDescriptor(propSet, key);
      defineObservablePropertyFromDescriptor(adm, key, descriptor, defaultEnhancer);
    }
  }
}