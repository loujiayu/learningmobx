import {Lambda, getNextId, valueDidChange} from "../utils/utils";
import {Reaction, IReactionPublic, IReactionDisposer} from "../core/reaction";
import {action} from "../api/action";

export function autorun(view: (r: IReactionPublic) => void, scope?: any): IReactionDisposer;
export function autorun(name: string, view: (r: IReactionPublic) => void, scope?: any): IReactionDisposer;
export function autorun(arg1: any, arg2: any, arg3?: any) {
  let name: string,
		view: (r: IReactionPublic) => void,
		scope: any;

	if (typeof arg1 === "string") {
		name = arg1;
		view = arg2;
		scope = arg3;
	} else {
		name = arg1.name || ("Autorun@" + getNextId());
		view = arg1;
		scope = arg2;
	}

  if (scope) 
    view = view.bind(scope)

  const reaction = new Reaction(name, function() {
    this.track(reactionRunner);
  })

  function reactionRunner() {
    view(reaction);
  }

  reaction.schedule()

	return reaction.getDisposer()
}

export interface IReactionOptions {
	context?: any;
	fireImmediately?: boolean;
	delay?: number;
	compareStructural?: boolean;
	/** alias for compareStructural */
	struct?: boolean;
	name?: string;
}

/**
 *
 * Basically sugar for computed(expr).observe(action(effect))
 * or
 * autorun(() => action(effect)(expr));
 */
export function reaction<T>(expression: (r: IReactionPublic) => T, effect: (arg: T, r: IReactionPublic) => void, opts?: IReactionOptions): IReactionDisposer;
export function reaction<T>(expression: (r: IReactionPublic) => T, effect: (arg: T, r: IReactionPublic) => void, fireImmediately?: boolean): IReactionDisposer;
export function reaction<T>(expression: (r: IReactionPublic) => T, effect: (arg: T, r: IReactionPublic) => void, arg3: any) {
	let opts: IReactionOptions;
	if (typeof arg3 === 'object') {
		opts = arg3;
	} else {
		opts = {};
	}

	opts.name = opts.name || (expression as any).name || (effect as any).name || ("Reaction@" + getNextId());
	opts.fireImmediately = arg3 === true || opts.fireImmediately === true;
	opts.delay = opts.delay || 0
	opts.compareStructural = opts.compareStructural || opts.struct || false;
	effect = action(opts.name!, opts.context ? effect.bind(opts.context) : effect);
	if (opts.context) {
		expression = expression.bind(opts.context)
	}
	let firstTime = true
	let isScheduled = false;
	let nextValue: T
	
	const r = new Reaction(opts.name, () => {
		if (firstTime || (opts.delay as any) < 1) {
			reactionRunner();
		} else if (!isScheduled) {
			isScheduled = true;
			setTimeout(() => {
				isScheduled = false;
				reactionRunner();
			}, opts.delay);
		}
	});

	function reactionRunner() {
		if (r.isDisposed)
			return;
		let changed = false;
		r.track(() => {
			const v = expression(r);
			changed = valueDidChange(opts.compareStructural!, nextValue, v)
			nextValue = v
		})
		if (firstTime && opts.fireImmediately)
			effect(nextValue, r);
		if (!firstTime && (changed as boolean) === true ) 
			effect(nextValue, r)
		if (firstTime)
			firstTime = false
	}

	r.schedule()
	return r.getDisposer()
}