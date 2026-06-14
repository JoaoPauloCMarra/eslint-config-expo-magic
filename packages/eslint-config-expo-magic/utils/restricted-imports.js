const baseRestrictedImports = [
	{
		name: 'react-native',
		importNames: ['SafeAreaView'],
		message:
			"Use 'SafeAreaView' from 'react-native-safe-area-context' instead.",
	},
];

module.exports = {
	baseRestrictedImports,
};
