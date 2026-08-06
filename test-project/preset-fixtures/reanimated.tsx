import { useSharedValue } from 'react-native-reanimated';

export function ReanimatedFixture() {
	const source = useSharedValue(0);
	const offset = useSharedValue(source.value);
	usePanGesture({ onStart: () => {} });

	return <>{offset.value}</>;
}
