import React, { useRef } from 'react';
import { FlatList, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface Person {
  id: string;
  name: string;
}

interface PaginatedPeopleListProps {
  data: Person[];
}

export const PaginatedPeopleList: React.FC<PaginatedPeopleListProps> = ({ data }) => {
  const currentRef = useRef<FlatList>(null);

  // This should cause "Cannot access refs during render" because we're accessing ref during render
  const scrollPosition = currentRef.current ? 'scrolled' : 'not scrolled';

  useFocusEffect(
    React.useCallback(() => {
      // This should be fine - accessing ref in effect
      currentRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [])
  );

  return (
    <FlatList
      ref={currentRef}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Text>{item.name} - {scrollPosition}</Text>}
    />
  );
};