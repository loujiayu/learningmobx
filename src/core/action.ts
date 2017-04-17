import {IDerivation} from "../core/derivation";
import {untrackedStart, untrackedEnd} from "../core/derivation";
import {startBatch, endBatch} from "../core/observable";

// export function createAction(actionName: string, fn: Function): Function & IAction {
//   const res = function () {
//     return executeAction(actionName, fn, this, arguments);
//   }
// }

// export function executeAction(actionName: string, fn: Function, scope?: any, args?: IArguments) {
//   const runInfo = startAction(actionName, fn, scope, args);

// }

// interface IActionRunInfo {
// 	prevDerivation: IDerivation | null;
// 	prevAllowStateChanges: boolean;
// 	notifySpy: boolean;
// 	startTime: number;
// }

// function startAction(actionName: string, fn: Function, scope: any, args?: IArguments): IActionRunInfo {
//   let startTime: number = 0;
//   const prevDerivation = untrackedStart();
//   startBatch();
// 	const prevAllowStateChanges = allowStateChangesStart(true);
// 	return {
// 		prevDerivation,
// 		prevAllowStateChanges,
// 		notifySpy,
// 		startTime
// 	};
// }
