import {IDerivation, IDerivationState} from "./derivation";
import {globalState} from "./globalstate";
import {runReactions} from './reaction'
export interface IDepTreeNode {
	name: string;
	observing?: IObservable[];
}

export interface IObservable extends IDepTreeNode {
	diffValue: number;
	/**
	 * Id of the derivation *run* that last accesed this observable.
	 * If this id equals the *run* id of the current derivation,
	 * the dependency is already established
	 */
	lastAccessedBy: number;

	lowestObserverState: IDerivationState; // Used to avoid redundant propagations
	isPendingUnobservation: boolean; // Used to push itself to global.pendingUnobservations at most once per batch.

	observers: IDerivation[]; // maintain _observers in raw array for for way faster iterating in propagation.
	observersIndexes: {}; // map derivation.__mapid to _observers.indexOf(derivation) (see removeObserver)

	onBecomeUnobserved();
}

/**
 * Batch starts a transaction, at least for purposes of memoizing ComputedValues when nothing else does.
 * During a batch `onBecomeUnobserved` will be called at most once per observable.
 * Avoids unnecessary recalculations.
 */
export function startBatch() {
	globalState.inBatch++;
}

export function addObserver(observable: IObservable, node: IDerivation) {
	const l = observable.observers.length;

	if (l) { // because object assignment is relatively expensive, let's not store data about index 0.
		observable.observersIndexes[node.__mapid] = l;
	}
	observable.observers[l] = node;

	if (observable.lowestObserverState > node.dependenciesState) observable.lowestObserverState = node.dependenciesState;
}

export function endBatch() {
	if (--globalState.inBatch === 0) {
		runReactions();
		// the batch is actually about to finish, all unobserving should happen here.
		const list = globalState.pendingUnobservations;
		for (let i = 0; i < list.length; i++) {
			const observable = list[i];
			observable.isPendingUnobservation = false;
			if (observable.observers.length === 0) {
				observable.onBecomeUnobserved();
				// NOTE: onBecomeUnobserved might push to `pendingUnobservations`
			}
		}
		globalState.pendingUnobservations = [];
	}
}

export function removeObserver(observable: IObservable, node: IDerivation) {
	if (observable.observers.length === 1) {
		observable.observers.length = 0;
		queueForUnobservation(observable);
	} else {
		// const list = observable.observers;
		// const map = observable.observersIndexes;
	}
}

export function queueForUnobservation(observable: IObservable) {
	if (!observable.isPendingUnobservation) {
		// invariant(globalState.inBatch > 0, "INTERNAL ERROR, remove should be called only inside batch");
		// invariant(observable._observers.length === 0, "INTERNAL ERROR, shuold only queue for unobservation unobserved observables");
		observable.isPendingUnobservation = true;
		globalState.pendingUnobservations.push(observable);
	}
}

export function reportObserved(observable: IObservable) {
	const derivation = globalState.trackingDerivation;
	if (derivation !== null) {
		/**
		 * Simple optimization, give each derivation run an unique id (runId)
		 * Check if last time this observable was accessed the same runId is used
		 * if this is the case, the relation is already known
		 */
		if (derivation.runId !== observable.lastAccessedBy) {
			observable.lastAccessedBy = derivation.runId;
			derivation.newObserving![derivation.unboundDepsCount++] = observable;
		}
	}
}

export function propagateChanged(observable: IObservable) {
	if (observable.lowestObserverState === IDerivationState.STALE) return;
	observable.lowestObserverState = IDerivationState.STALE;

	const observers = observable.observers;
	let i = observers.length;
	while (i--) {
		const d = observers[i];
		if (d.dependenciesState === IDerivationState.UP_TO_DATE)
			d.onBecomeStale();
		d.dependenciesState = IDerivationState.STALE;
	}
}

export function propagateChangeConfirmed(observable: IObservable) {
	// invariantLOS(observable, "confirmed start");
	if (observable.lowestObserverState === IDerivationState.STALE) return;
	observable.lowestObserverState = IDerivationState.STALE;

	const observers = observable.observers;
	let i = observers.length;
	while (i--) {
		const d = observers[i];
		if (d.dependenciesState === IDerivationState.POSSIBLY_STALE)
			d.dependenciesState = IDerivationState.STALE;
		else if (d.dependenciesState === IDerivationState.UP_TO_DATE) // this happens during computing of `d`, just keep lowestObserverState up to date.
			observable.lowestObserverState = IDerivationState.UP_TO_DATE;
	}
	// invariantLOS(observable, "confirmed end");
}

export function propagateMaybeChanged(observable: IObservable) {
	// invariantLOS(observable, "maybe start");
	if (observable.lowestObserverState !== IDerivationState.UP_TO_DATE) return;
	observable.lowestObserverState = IDerivationState.POSSIBLY_STALE;

	const observers = observable.observers;
	let i = observers.length;
	while (i--) {
		const d = observers[i];
		if (d.dependenciesState === IDerivationState.UP_TO_DATE) {
			d.dependenciesState = IDerivationState.POSSIBLY_STALE;
			d.onBecomeStale();
		}
	}
	// invariantLOS(observable, "maybe end");
}
