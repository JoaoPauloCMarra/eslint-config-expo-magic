import type { RefObject } from 'react';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';

type Props<T> = {
	ref?: RefObject<FlatList<T>>;
	data: T[];
	loading: boolean;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	emptyMessage?: string;
	scrollEnabled?: boolean;
	bottomInset?: number;
	keyExtractor: (item: T) => string;
	renderItem: (item: { item: T; index: number }) => JSX.Element;
	onItemPress?: (item: T) => void;
	onItemCheck?: (id: string, member: T) => void;
	onFetchNextPage?: VoidFunction;
};

type Props<T> = {
	ref?: RefObject<FlatListRef<T>>;
	data: T[];
	loading: boolean;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	emptyMessage?: string;
	scrollEnabled?: boolean;
	bottomInset?: number;
	keyExtractor: (item: T) => string;
	renderItem: ListRenderItem<T>;
	onItemPress?: (item: T) => void;
	onItemCheck?: (id: string, member: T) => void;
	onFetchNextPage?: VoidFunction;
};

const PaginatedPeopleList = <T,>(props: Props<T>) => {
	const listRef = useRef<FlatList<T>>(null);
	const currentRef = (props.ref ?? listRef) as RefObject<FlatList<T>>;

	const [showNoMoreResults, setShowNoMoreResults] = useState(false);

	const onEndReached = () => {
		if (props.data?.length === 0) {
			setShowNoMoreResults(false);
			return;
		}

		if (!props.hasNextPage) {
			setShowNoMoreResults(true);
			return;
		}

		if (!props.isFetchingNextPage) {
			if (showNoMoreResults) {
				setShowNoMoreResults(false);
			}
			props.onFetchNextPage?.();
		}
	};

	const ListFooterComponent = () => {
		if (props.data.length > 0) {
			if (props.isFetchingNextPage) {
				return (
					<View style={styles.footer}>
						<Text>Loading...</Text>
					</View>
				);
			}
			if (showNoMoreResults) {
				return <Text style={styles.footer}>No more results</Text>;
			}
		}
		return null;
	};

	useFocusEffect(
		useCallback(() => {
			setShowNoMoreResults(false);
			currentRef.current?.scrollToOffset({
				offset: 0,
				animated: false,
			});
		}, [currentRef]),
	);

	return (
		<FlatList<T>
			ref={currentRef}
			style={styles.container}
			contentContainerStyle={{ paddingBottom: props.bottomInset }}
			contentInsetAdjustmentBehavior="automatic"
			data={props.data}
			keyExtractor={props.keyExtractor}
			renderItem={props.renderItem}
			scrollEnabled={props.scrollEnabled}
			onEndReached={onEndReached}
			onEndReachedThreshold={0.5}
			ListEmptyComponent={
				<View>
					{props.loading ? (
						<View style={styles.footer}>
							<Text>Loading...</Text>
						</View>
					) : (
						<Text style={styles.footer}>{props.emptyMessage}</Text>
					)}
				</View>
			}
			ListFooterComponent={ListFooterComponent}
		/>
	);
};

export default PaginatedPeopleList;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	footer: {
		marginVertical: 20,
		minHeight: 40,
	},
});
