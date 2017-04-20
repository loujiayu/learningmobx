// import * as mobx from './src/mobx'
import * as test from 'tape'
import * as mobx from './src/mobx';
// import {observable, observe, computed, isObservable, isObservableObject, IObjectChange} from './src/mobx';

var m = mobx;
var observable = mobx.observable;
var computed = mobx.computed;
var reaction = mobx.reaction;

var voidObserver = function(){};

function buffer() {
    var b: number[] = [];
    var res = function(x) {
        b.push(x.newValue);
    };
    res.toArray = function() {
        return b;
    }
    return res;
}

test("#278 do not rerun if expr output doesn't change structurally", t => {
	var users = mobx.observable([
		{
			name: "jan",
			get uppername() { return this.name.toUpperCase() }
		},
		{
			name: "piet",
			get uppername() { return this.name.toUpperCase() }
		}
	]);
	var values = [];

	var d = reaction(
		() => users.map(user => user.uppername),
		newValue => {
			values.push(newValue);
		},
		{
			fireImmediately: true,
			compareStructural: true
		}
	)

	users[0].name = "john";
	users[0].name = "JoHn";
	users[0].name = "jOHN";
	users[1].name = "johan";

	d();
	users[1].name = "w00t";

	t.deepEqual(values, [
		["JAN", "PIET"],
		["JOHN", "PIET"],
		["JOHN", "JOHAN"]
	]);
	t.end();
})