import {IDerivation, IDerivationState, shouldCompute, trackDerivedFunction, clearObserving} from "./derivation";
import {globalState} from "./globalstate";
import {IObservable, startBatch, endBatch} from "./observable";
import {createInstanceofPredicate, getNextId} from "../utils/utils";

export interface IReactionPublic {
	dispose: IReactionDisposer;
}

export interface IReactionDisposer {
	(): void;
	$mobx?: Reaction;
	onError?(handler: (error: any, derivation: IDerivation) => void);
}

export interface IReactionDisposer {
	(): void;
	$mobx?: Reaction;
	onError?(handler: (error: any, derivation: IDerivation) => void);
}

export class Reaction implements IDerivation, IReactionPublic {
  observing: IObservable[] = []; // nodes we are looking at. Our value depends on these nodes
	newObserving: IObservable[] = [];
	dependenciesState = IDerivationState.NOT_TRACKING;
	diffValue = 0;
	runId = 0;
	unboundDepsCount = 0;
	__mapid = "#" + getNextId();
	isDisposed = false;
	_isScheduled = false;
	_isTrackPending = false;
	_isRunning = false;
	errorHandler: (error: any, derivation: IDerivation) => void;

  constructor(public name: string = "Reaction@" + getNextId(), private onInvalidate: () => void) { }

	onBecomeStale() {
		this.schedule();
	}

	schedule() {
		if(!this._isScheduled) {
			this._isScheduled = true;
			globalState.pendingReactions.push(this);
			runReactions();
		}
	}

	runReaction() {
		if (!this.isDisposed) {
			startBatch();
			this._isScheduled = false;
			if (shouldCompute(this)) {
				this._isTrackPending = true;
				this.onInvalidate();
			}
			endBatch();
		}
	}

	track(fn: () => void) {
		startBatch()
		this._isRunning = true;
		const result = trackDerivedFunction(this, fn, undefined);
		this._isRunning = false;
		this._isTrackPending = false;
		// if (this.isDisposed) {

		// }
		endBatch()
	}

	getDisposer(): IReactionDisposer {
		const r = this.dispose.bind(this);
		r.$mobx = this;
		r.onError = registerErrorHandler;
		return r;
	}

  dispose() {
		if (!this.isDisposed) {
			this.isDisposed = true;
			if (!this._isRunning) {
				startBatch();
				clearObserving(this); // if disposed while running, clean up later. Maybe not optimal, but rare case
				endBatch();
			}
		}
	}
}

function registerErrorHandler(handler) {
	// invariant(this && this.$mobx && isReaction(this.$mobx), "Invalid `this`");
	// invariant(!this.$mobx.errorHandler, "Only one onErrorHandler can be registered");
	this.$mobx.errorHandler = handler;
}

const MAX_REACTION_ITERATIONS = 100;

let reactionScheduler: (fn: () => void) => void = f => f();

export function runReactions() {
	// Trampolining, if runReactions are already running, new reactions will be picked up
	if (globalState.inBatch > 0 || globalState.isRunningReactions)
		return;
	reactionScheduler(runReactionsHelper);
}

function runReactionsHelper() {
	globalState.isRunningReactions = true;
	const allReactions = globalState.pendingReactions

	let iterations = 0;
	while(allReactions.length > 0) {
		if (++iterations === MAX_REACTION_ITERATIONS) {
			console.error(`Reaction doesn't converge to a stable state after ${MAX_REACTION_ITERATIONS} iterations.`
				+ ` Probably there is a cycle in the reactive function: ${allReactions[0]}`);
			allReactions.splice(0); // clear reactions
		}
		let remainingReactions = allReactions.splice(0);
		for (let i = 0, l = remainingReactions.length; i < l; i++) {
			remainingReactions[i].runReaction();
		}
	}
	globalState.isRunningReactions = false;
}
