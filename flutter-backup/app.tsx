import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ThemeProvider } from './src/contexts/ThemeContext'; // O contexto que vais criar

export default function App() {
  return (
    // O Provider envolve toda a App
    <ThemeProvider>
      <View style={styles.container}>
        <Text style={styles.text}>teddycash Platform: Pronto para o Live-Ops!</Text>
        {/* Aqui entrará o teu Navigation Container posteriormente */}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});