import {createAction, IAction} from "../core/action";

export interface IActionFactory {
	// nameless actions
	<A1, R, T extends (a1: A1) => R>(fn: T): T & IAction;
	<A1, A2, R, T extends (a1: A1, a2: A2) => R>(fn: T): T & IAction;
	<A1, A2, A3, R, T extends (a1: A1, a2: A2, a3: A3) => R>(fn: T): T & IAction;
	<A1, A2, A3, A4, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4) => R>(fn: T): T & IAction;
	<A1, A2, A3, A4, A5, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => R>(fn: T): T & IAction;
	<A1, A2, A3, A4, A5, A6, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4, a6: A6) => R>(fn: T): T & IAction;

	// named actions
	<A1, R, T extends (a1: A1) => R>(name: string, fn: T): T & IAction;
	<A1, A2, R, T extends (a1: A1, a2: A2) => R>(name: string, fn: T): T & IAction;
	<A1, A2, A3, R, T extends (a1: A1, a2: A2, a3: A3) => R>(name: string, fn: T): T & IAction;
	<A1, A2, A3, A4, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4) => R>(name: string, fn: T): T & IAction;
	<A1, A2, A3, A4, A5, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => R>(name: string, fn: T): T & IAction;
	<A1, A2, A3, A4, A5, A6, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4, a6: A6) => R>(name: string, fn: T): T & IAction;

	// generic forms
	<T extends Function>(fn: T): T & IAction;
	<T extends Function>(name: string, fn: T): T & IAction;

	// named decorator
	(customName: string): (target: Object, key: string, baseDescriptor?: PropertyDescriptor) => void;

	// unnamed decorator
	(target: Object, propertyKey: string, descriptor?: PropertyDescriptor): void;

	// .bound
	bound<A1, R, T extends (a1: A1) => R>(fn: T): T & IAction;
	bound<A1, A2, R, T extends (a1: A1, a2: A2) => R>(fn: T): T & IAction;
	bound<A1, A2, A3, R, T extends (a1: A1, a2: A2, a3: A3) => R>(fn: T): T & IAction;
	bound<A1, A2, A3, A4, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4) => R>(fn: T): T & IAction;
	bound<A1, A2, A3, A4, A5, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => R>(fn: T): T & IAction;
	bound<A1, A2, A3, A4, A5, A6, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4, a6: A6) => R>(fn: T): T & IAction;

	// .bound decorator
	bound(target: Object, propertyKey: string, descriptor?: PropertyDescriptor): void;
}

export var action: IActionFactory = function action(arg1, arg2?, arg3?, arg4?): any {
  if (arguments.length === 2 && typeof arg2 === 'function')
    return createAction(arg1, arg2);
  // return nameActionDecorator(arg2).apply(null, arguments)
} as any