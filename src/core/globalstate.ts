import {IDerivation} from "./derivation";
import {IObservable} from "./observable";
import {Reaction} from "./reaction";

export class MobXGlobals {
	/**
	 * MobXGlobals version.
	 * MobX compatiblity with other versions loaded in memory as long as this version matches.
	 * It indicates that the global state still stores similar information
	 */
	version = 5;

	/**
	 * Currently running derivation
	 */
	trackingDerivation: IDerivation | null = null;

	/**
	 * Are we running a computation currently? (not a reaction)
	 */
	computationDepth = 0;

	/**
	 * Each time a derivation is tracked, it is assigned a unique run-id
	 */
	runId = 0;

	/**
	 * 'guid' for general purpose. Will be persisted amongst resets.
	 */
	mobxGuid = 0;

	/**
	 * Are we in a batch block? (and how many of them)
	 */
	inBatch: number = 0;

	/**
	 * Observables that don't have observers anymore, and are about to be
	 * suspended, unless somebody else accesses it in the same batch
	 *
	 * @type {IObservable[]}
	 */
	pendingUnobservations: IObservable[] = [];

	/**
	 * List of scheduled, not yet executed, reactions.
	 */
	pendingReactions: Reaction[] = [];

	/**
	 * Are we currently processing reactions?
	 */
	isRunningReactions = false;

	/**
	 * Is it allowed to change observables at this point?
	 * In general, MobX doesn't allow that when running computations and React.render.
	 * To ensure that those functions stay pure.
	 */
	allowStateChanges = true;
	/**
	 * If strict mode is enabled, state changes are by default not allowed
	 */
	strictMode = false;

	/**
	 * Used by createTransformer to detect that the global state has been reset.
	 */
	resetId = 0;

	/**
	 * Spy callbacks
	 */
	spyListeners: {(change: any): void}[] = [];

	/**
	 * Globally attached error handlers that react specifically to errors in reactions
	 */
	globalReactionErrorHandlers: ((error: any, derivation: IDerivation) => void)[] = [];
}

export let globalState: MobXGlobals = new MobXGlobals();