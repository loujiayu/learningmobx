import {IValueDidChange} from "../types/observablevalue";
import {isCaughtException, IDerivation, IDerivationState, untrackedStart, untrackedEnd, shouldCompute, CaughtException, trackDerivedFunction} from "./derivation";
import {IObservable, startBatch, endBatch, reportObserved, propagateChangeConfirmed, propagateMaybeChanged} from "./observable";
import {Lambda, getNextId, valueDidChange, createInstanceofPredicate} from '../utils/utils';
import {autorun} from "../api/autorun";
import {globalState} from "./globalstate";

export interface IComputedValue<T> {
	get(): T;
	set(value: T): void;
	observe(listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda;
}

export class ComputedValue<T> implements IObservable, IComputedValue<T>, IDerivation {
	dependenciesState = IDerivationState.NOT_TRACKING;
	observing = [];       // nodes we are looking at. Our value depends on these nodes
	newObserving = null; // during tracking it's an array with new observed observers

	isPendingUnobservation: boolean = false;
	observers = [];
	observersIndexes = {};
	diffValue = 0;
	runId = 0;
	lastAccessedBy = 0;
	lowestObserverState = IDerivationState.UP_TO_DATE;
	unboundDepsCount = 0;
	__mapid = "#" + getNextId();
	protected value: T | undefined | CaughtException = undefined;
	name: string;
	isComputing: boolean = false; // to check for cycles
	isRunningSetter: boolean = false;
	setter: (value: T) => void;

	constructor(public derivation: () => T, public scope: Object | undefined, private compareStructural: boolean, name: string, setter?: (v: T) => void) {
		this.name = name || "ComputedValue@" + getNextId();
	}

	onBecomeStale() {
		propagateMaybeChanged(this);
	}

	onBecomeUnobserved() {
		// clearObserving(this);
		this.value = undefined;
	}

	public get(): T {
		if (globalState.inBatch === 0) {
			startBatch();
			if (shouldCompute(this))
				this.value = this.computeValue(false);
			endBatch();
		} else {
			reportObserved(this);
			if (shouldCompute(this))
				if (this.trackAndCompute())
					propagateChangeConfirmed(this);
		}
		const result = this.value!;

		if (isCaughtException(result))
			throw result.cause;
		return result;
	}

	public set(value: T) {

	}

	private trackAndCompute(): boolean {
		const oldValue = this.value;
		const newValue = this.value = this.computeValue(true)
		return isCaughtException(newValue) || valueDidChange(this.compareStructural, newValue, oldValue);
	}

	computeValue(track: boolean) {
		this.isComputing = true
		globalState.computationDepth++
		let res: T | CaughtException
		if (track) {
			res = trackDerivedFunction(this, this.derivation, this.scope)
		} else {
			try {
				res = this.derivation.call(this.scope);
			} catch (e) {
				res = new CaughtException(e);
			}
		}
		globalState.computationDepth--;
		this.isComputing = false;
		return res;
	}

	observe(listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda {
		let firstTime = true;
		let prevValue: T | undefined = undefined;
		return autorun(() => {
			let newValue = this.get();
			
			firstTime = false;
			prevValue = newValue;
		})
		// return auto
	}

}

export const isComputedValue = createInstanceofPredicate("ComputedValue", ComputedValue);
