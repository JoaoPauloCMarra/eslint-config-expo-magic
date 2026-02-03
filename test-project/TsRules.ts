// ❌ This should trigger @typescript-eslint/consistent-type-assertions
const casting = <string>'hi';
console.log(casting);

// ❌ This should trigger @typescript-eslint/naming-convention
class bad_class_name {}
console.log(bad_class_name);
enum BadEnum {
	bad_member,
}
console.log(BadEnum.bad_member);

export {};
