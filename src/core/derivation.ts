import {IObservable, IDepTreeNode, addObserver} from "./observable";
import {globalState} from "./globalstate";
import {isComputedValue} from "./computedvalue";

export enum IDerivationState {
	// before being run or (outside batch and not being observed)
	// at this point derivation is not holding any data about dependency tree
	NOT_TRACKING = -1,
	// no shallow dependency changed since last computation
	// won't recalculate derivation
	// this is what makes mobx fast
	UP_TO_DATE = 0,
	// some deep dependency changed, but don't know if shallow dependency changed
	// will require to check first if UP_TO_DATE or POSSIBLY_STALE
	// currently only ComputedValue will propagate POSSIBLY_STALE
	//
	// having this state is second big optimization:
	// don't have to recompute on every dependency change, but only when it's needed
	POSSIBLY_STALE = 1,
	// shallow dependency changed
	// will need to recompute when it's needed
	STALE = 2
}

export class CaughtException {
	constructor(public cause: any) {
		// Empty
	}
}

export function isCaughtException(e): e is CaughtException {
	return e instanceof CaughtException;
}

export interface IDerivation extends IDepTreeNode {
	observing: IObservable[];
	newObserving: null | IObservable[];
	dependenciesState: IDerivationState;
	/**
	 * Id of the current run of a derivation. Each time the derivation is tracked
	 * this number is increased by one. This number is globally unique
	 */
	runId: number;
	/**
	 * amount of dependencies used by the derivation in this run, which has not been bound yet.
	 */
	unboundDepsCount: number;
	__mapid: string;
	onBecomeStale();
}

export function untrackedStart(): IDerivation | null {
	const prev = globalState.trackingDerivation;
	globalState.trackingDerivation = null;
	return prev;
}

export function untrackedEnd(prev: IDerivation | null) {
	globalState.trackingDerivation = prev;
}

export function isComputingDerivation() {
	return globalState.trackingDerivation !== null; // filter out actions inside computations
}

export function shouldCompute(derivation: IDerivation): boolean {
	switch(derivation.dependenciesState) {
		case IDerivationState.UP_TO_DATE: return false;
		case IDerivationState.NOT_TRACKING: case IDerivationState.STALE: return true;
		case IDerivationState.POSSIBLY_STALE: {
			const prevUntracked = untrackedStart(); // no need for those computeds to be reported, they will be picked up in trackDerivedFunction.
			const obs = derivation.observing, l = obs.length;
			for (let i = 0; i < l; i++) {
				const obj = obs[i];
				if (isComputedValue(obj)) {
					try {
						obj.get();
					} catch (e) {
						// we are not interested in the value *or* exception at this moment, but if there is one, notify all
						untrackedEnd(prevUntracked);
						return true;
					}
					// if ComputedValue `obj` actually changed it will be computed and propagated to its observers.
					// and `derivation` is an observer of `obj`
					if ((derivation as any).dependenciesState === IDerivationState.STALE) {
						untrackedEnd(prevUntracked);
						return true;
					}
				}
			}
			changeDependenciesStateTo0(derivation);
			untrackedEnd(prevUntracked);
			return false;
		}
	}
}

export function trackDerivedFunction<T>(derivation: IDerivation, f: () => T, context) {
	changeDependenciesStateTo0(derivation)
	derivation.newObserving = new Array(derivation.observing.length + 100)
	derivation.unboundDepsCount = 0
	derivation.runId = ++globalState.runId;
	const prevTracking = globalState.trackingDerivation
	globalState.trackingDerivation = derivation
	let result
	try {
		result = f.call(context)
	} catch (e) {
		result = new CaughtException(e)
	}
	globalState.trackingDerivation = prevTracking
	bindDependencies(derivation)
	return result
}

function bindDependencies(derivation: IDerivation) {
	const prevObserving = derivation.observing;
	const observing = derivation.observing = derivation.newObserving!;
	let lowestNewObservingDerivationState = IDerivationState.UP_TO_DATE;

	derivation.newObserving = null; // newObserving shouldn't be needed outside tracking
	// Go through all new observables and check diffValue: (this list can contain duplicates):
	//   0: first occurence, change to 1 and keep it
	//   1: extra occurence, drop it
	let i0 = 0, l = derivation.unboundDepsCount;
	for (let i = 0; i < l; i++) {
		const dep = observing[i];
		if (dep.diffValue === 0) {
			dep.diffValue = 1;
			if (i0 !== i) observing[i0] = dep;
			i0++;
		}

		// Upcast is 'safe' here, because if dep is IObservable, `dependenciesState` will be undefined,
		// not hitting the condition
		if ((dep as any as IDerivation).dependenciesState > lowestNewObservingDerivationState) {
			lowestNewObservingDerivationState = (dep as any as IDerivation).dependenciesState;
		}
	}
	observing.length = i0;

	// Go through all old observables and check diffValue: (it is unique after last bindDependencies)
	//   0: it's not in new observables, unobserve it
	//   1: it keeps being observed, don't want to notify it. change to 0
	// l = prevObserving.length;
	// while (l--) {
	// 	const dep = prevObserving[l];
	// 	if (dep.diffValue === 0) {
	// 		removeObserver(dep, derivation);
	// 	}
	// 	dep.diffValue = 0;
	// }

	// Go through all new observables and check diffValue: (now it should be unique)
	//   0: it was set to 0 in last loop. don't need to do anything.
	//   1: it wasn't observed, let's observe it. set back to 0
	while (i0--) {
		const dep = observing[i0];
		if (dep.diffValue === 1) {
			dep.diffValue = 0;
			addObserver(dep, derivation);
		}
	}

	// Some new observed derivations might become stale during this derivation computation
	// so say had no chance to propagate staleness (#916)
	// if (lowestNewObservingDerivationState !== IDerivationState.UP_TO_DATE) {
	// 	derivation.dependenciesState = lowestNewObservingDerivationState;
	// 	derivation.onBecomeStale();
	// }
}

export function changeDependenciesStateTo0(derivation: IDerivation) {
	if (derivation.dependenciesState === IDerivationState.UP_TO_DATE) return;
	derivation.dependenciesState = IDerivationState.UP_TO_DATE;

	const obs = derivation.observing;
	let i = obs.length;
	while (i--)
		obs[i].lowestObserverState = IDerivationState.UP_TO_DATE;
}

// export function clearObserving(derivation: IDerivation) {
// 	// invariant(globalState.inBatch > 0, "INTERNAL ERROR clearObserving should be called only inside batch");
// 	const obs = derivation.observing;
// 	let i = obs.length;
// 	while (i--)
// 		removeObserver(obs[i], derivation);

// 	derivation.dependenciesState = IDerivationState.NOT_TRACKING;
// 	obs.length = 0;
// }