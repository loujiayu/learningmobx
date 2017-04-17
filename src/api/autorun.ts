import {Lambda, getNextId} from "../utils/utils";
import {Reaction, IReactionPublic, IReactionDisposer} from "../core/reaction";

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