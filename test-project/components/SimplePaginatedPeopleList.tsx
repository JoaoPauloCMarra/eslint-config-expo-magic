import React, { useRef, useState } from 'react';
import type { RefObject } from 'react';
import { View, Text, FlatList } from 'react-native';

type Person = {
	id: string;
	name: string;
};

type Props<T> = {
	ref?: RefObject<FlatList<T>>;
	data: T[];
	loading: boolean;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	emptyMessage?: string;
	onFetchNextPage?: () => void;
};

const PaginatedPeopleList = <T,>(props: Props<T>) => {
	const listRef = useRef<FlatList>(null);
	const currentRef = (props.ref ?? listRef) as RefObject<FlatList>;

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
					<View style={{ padding: 20 }}>
						<Text>Loading...</Text>
					</View>
				);
			}
			if (showNoMoreResults) {
				return <Text style={{ padding: 20 }}>No more results</Text>;
			}
		}
		return null;
	};

	// Simulate useFocusEffect behavior
	React.useEffect(() => {
		setShowNoMoreResults(false);
		currentRef.current?.scrollToOffset({
			offset: 0,
			animated: false,
		});
	}, []);

	return (
		<FlatList<T>
			ref={currentRef}
			data={props.data}
			keyExtractor={(item: T) => (item as Person).id}
			renderItem={({ item }: { item: T }) => (
				<Text>{(item as Person).name}</Text>
			)}
			onEndReached={onEndReached}
			onEndReachedThreshold={0.5}
			ListEmptyComponent={
				<View>
					{props.loading ? (
						<View style={{ padding: 20 }}>
							<Text>Loading...</Text>
						</View>
					) : (
						<Text style={{ padding: 20 }}>{props.emptyMessage}</Text>
					)}
				</View>
			}
			ListFooterComponent={ListFooterComponent}
		/>
	);
};

export default PaginatedPeopleList;
