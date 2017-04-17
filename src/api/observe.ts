import {Lambda} from '../utils/utils';
import {getAdministration} from "../types/type-utils";

export function observe(thing, propOrCb?, cbOrFire?, fireImmediately?):Lambda {
  return observeObserable(thing, propOrCb, cbOrFire);
}

function observeObserable(thing, listener, fireImmediately: boolean) {
  return getAdministration(thing).observe(listener, fireImmediately);
}