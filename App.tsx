import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from './src/i18n';
import { QueryProvider } from './src/providers/QueryProvider';
import { HomeValueScreen } from './src/charts/domains/homeValue/HomeValueScreen';
import { HomeEquityScreen } from './src/charts/domains/homeEquity/HomeEquityScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <I18nextProvider i18n={i18n}>
          <QueryProvider>
            <SafeAreaView style={styles.root}>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
              <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.heading}>Home Value</Text>
                <HomeValueScreen />
                <View style={styles.divider} />
                <Text style={styles.heading}>Home Equity</Text>
                <HomeEquityScreen />
              </ScrollView>
            </SafeAreaView>
          </QueryProvider>
        </I18nextProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    color: '#222',
  },
  divider: {
    height: 1,
    backgroundColor: '#e6e6e8',
    marginVertical: 8,
    marginHorizontal: 12,
  },
});

export default App;
