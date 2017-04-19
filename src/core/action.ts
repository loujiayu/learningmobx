import {IDerivation} from "../core/derivation";
import {untrackedStart, untrackedEnd} from "../core/derivation";
import {startBatch, endBatch} from "../core/observable";
import {globalState} from "../core/globalstate";

export interface IAction{
	originalFn: Function
	isMobxAction: boolean
}

export function createAction(actionName: string, fn: Function): Function & IAction {
  const res = function () {
    return executeAction(actionName, fn, this, arguments);
  };
  (res as any).originalFn = fn;
  (res as any).isMobxAction = true
  return res as any;
}

export function executeAction(actionName: string, fn: Function, scope?: any, args?: IArguments) {
	const runInfo = startAction(actionName, fn, scope, args);
	try {
		return fn.apply(scope, args);
	}
	finally {
		endAction(runInfo);
	}
}

interface IActionRunInfo {
	prevDerivation: IDerivation | null;
	prevAllowStateChanges: boolean;
	notifySpy: boolean;
	startTime: number;
}

function startAction(actionName: string, fn: Function, scope: any, args?: IArguments): IActionRunInfo {
  const notifySpy = false;
  let startTime: number = 0;
  const prevDerivation = untrackedStart();
  startBatch()
  const prevAllowStateChanges = allowStateChangesStart(true)
  return {
    prevDerivation,
		prevAllowStateChanges,
		notifySpy,
		startTime
  }
}

function endAction(runInfo: IActionRunInfo) {
	allowStateChangesEnd(runInfo.prevAllowStateChanges);
	endBatch();
	untrackedEnd(runInfo.prevDerivation);
}

export function allowStateChangesStart(allowStateChanges: boolean) {
  const prev = globalState.allowStateChanges;
	globalState.allowStateChanges = allowStateChanges;
	return prev;
}

export function allowStateChangesEnd(prev: boolean) {
	globalState.allowStateChanges = prev;
}
