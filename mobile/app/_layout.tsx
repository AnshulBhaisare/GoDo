import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, LogBox } from 'react-native';
import 'react-native-reanimated';

// Suppress the unavoidable Expo Go notifications warning
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);
import { getDatabase } from '../src/db/database';
import { useTaskStore } from '../src/stores/taskStore';
import { useChatStore } from '../src/stores/chatStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useActivityStore } from '../src/stores/activityStore';
import { requestNotificationPermissions } from '../src/services/notifications';
import { Colors } from '../src/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const theme = useSettingsStore(state => state.theme);
  const c = Colors[theme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        await useSettingsStore.getState().loadSettings();
        await useTaskStore.getState().loadTasks();
        await useChatStore.getState().clearChat();
        await useActivityStore.getState().loadLogs();
        await useTaskStore.getState().cleanupExpiredTasks();
        await requestNotificationPermissions();
      } catch (e) {
        console.error('Init error:', e);
      }
      if (loaded) SplashScreen.hideAsync();
    }
    if (loaded) init();
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
