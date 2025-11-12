import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';

const SimpleList = () => {
  const [data] = useState([{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }]);

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Text>{item.name}</Text>}
    />
  );
};

export default SimpleList;