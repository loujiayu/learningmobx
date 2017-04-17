import {createInstanceofPredicate, getNextId} from '../utils/utils';
import {IObservable, propagateChanged, startBatch, endBatch, reportObserved} from "./observable";
import {IDerivationState} from "./derivation";

export interface IAtom extends IObservable {
}

export class BaseAtom implements IAtom {
  isPendingUnobservation = true;
  observers = [];
	observersIndexes = {};

  diffValue = 0;
  lastAccessedBy = 0;
  lowestObserverState = IDerivationState.NOT_TRACKING;

  constructor(public name = 'Atom@' + getNextId()) {}

  /**
	 * Invoke this method _after_ this method has changed to signal mobx that all its observers should invalidate.
	 */
	public reportChanged() {
		startBatch();
		propagateChanged(this);
		endBatch();
	}

	public reportObserved() {
		reportObserved(this);
	}

  public onBecomeUnobserved() {
		// noop
	}

}
export const isAtom = createInstanceofPredicate("Atom", BaseAtom);