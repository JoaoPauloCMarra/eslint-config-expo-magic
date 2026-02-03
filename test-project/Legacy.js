var x = 1;
var x = 2;
console.log(x);

if ((!'a') in {}) {
	console.log('unsafe');
}

export {};

// ❌ This should trigger no-dupe-class-members
class Dupe {
	foo() {}
	foo() {}
}
console.log(Dupe);

// ❌ This should trigger no-unsafe-negation
if ((!'a') in { a: 1 }) {
	console.log('unsafe');
}

export {};
