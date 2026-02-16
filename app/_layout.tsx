import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

const LightThemeWithGrayBg = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#c4c4c4',
    card: '#c4c4c4',
  },
};

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightThemeWithGrayBg}>
      <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ title: 'Inicio' }} />
        <Stack.Screen name="cotizar" options={{ title: 'Nueva Cotización' }} />
        <Stack.Screen name="precios" options={{ title: 'Configurar Precios' }} />
        <Stack.Screen name="historial" options={{ title: 'Historial' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
