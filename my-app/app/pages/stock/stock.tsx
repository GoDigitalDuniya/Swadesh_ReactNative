import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Stock() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Stock will be listed here ok.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
  },
  text: {
    fontSize: 16,
    color: '#888',
  },
});