const defaultRestrictions = [
	{
		name: 'react-native',
		importNames: ['SafeAreaView'],
		message: "Use 'SafeAreaView' from 'react-native-safe-area-context' instead.",
	},
	{
		name: 'react-native',
		importNames: ['Button'],
		message: "Use your app's button component instead of React Native Button.",
	},
	{
		name: 'react-native',
		importNames: ['Image'],
		message: "Use your app's image component instead of React Native Image.",
	},
	{
		name: 'react-native',
		importNames: ['KeyboardAvoidingView'],
		message: "Use your app's keyboard avoiding container.",
	},
	{
		name: 'react-native',
		importNames: ['Pressable', 'TouchableOpacity'],
		message: "Use your app's pressable components.",
	},
	{
		name: 'react-native',
		importNames: ['ScrollView'],
		message: "Use your app's scroll view component.",
	},
	{
		name: 'react-native',
		importNames: ['FlatList'],
		message: "Use your app's list component.",
	},
	{
		name: 'react-native',
		importNames: ['Modal'],
		message: "Use your app's modal component.",
	},
	{
		name: 'react-native-gesture-handler',
		importNames: ['Pressable', 'TouchableOpacity'],
		message: "Use your app's pressable components.",
	},
	{
		name: 'react-native-gesture-handler',
		importNames: ['ScrollView'],
		message: "Use your app's scroll view component.",
	},
	{
		name: 'expo-router',
		importNames: ['useRouter'],
		message: "Use your app's navigation wrapper.",
	},
];

function createNativeUiConfig(options = {}) {
	const restrictions = options.restrictions ?? defaultRestrictions;
	const allowFiles = options.allowFiles ?? [];
	const config = [
		{
			rules: {
				'no-restricted-imports': [
					'error',
					{
						paths: restrictions,
					},
				],
			},
		},
	];

	if (allowFiles.length > 0) {
		config.push({
			files: allowFiles,
			rules: {
				'no-restricted-imports': 'off',
			},
		});
	}

	return config;
}

const recommended = createNativeUiConfig();

module.exports = {
	createNativeUiConfig,
	defaultRestrictions,
	recommended,
};
