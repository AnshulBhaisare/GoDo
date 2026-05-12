import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../src/constants/theme';

export default function NotFoundScreen() {
  const c = Colors.light;
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.onSurface }]}>This screen doesn't exist.</Text>
        <Link href="/" style={[styles.link, { color: c.primary }]}>
          Go to home screen
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '600' },
  link: { marginTop: 16, fontSize: 16 },
});
