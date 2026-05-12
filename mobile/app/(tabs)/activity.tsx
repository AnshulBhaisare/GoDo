import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useActivityStore } from '../../src/stores/activityStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { ActivityTimeline } from '../../src/components/ActivityTimeline';
import { Colors } from '../../src/constants/theme';

export default function ActivityScreen() {
  const router = useRouter();
  const settings = useSettingsStore();
  const c = Colors[settings.theme === 'dark' ? 'dark' : 'light'];
  const { logs, loadLogs } = useActivityStore();
  const { deletedTasks } = useTaskStore();

  useEffect(() => { loadLogs(); }, []);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[s.header, { backgroundColor: c.background + 'CC' }]}>
        <Pressable 
          onPress={() => settings.setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          style={[s.profilePic, { backgroundColor: c.surfaceVariant }]}
        >
          <MaterialIcons name={settings.theme === 'dark' ? 'light-mode' : 'dark-mode'} size={18} color={c.onSurfaceVariant} />
        </Pressable>
        <Text style={[s.headerTitle, { color: c.primary }]}>GoDo</Text>
        <Pressable onPress={() => router.push('/notifications')}>
          <MaterialIcons name="notifications-none" size={24} color={c.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.pageTitle, { color: c.onSurface }]}>Activity Log</Text>
        <Text style={[s.pageSubtitle, { color: c.onSurfaceVariant }]}>Track the lifecycle of your tasks.</Text>

        <ActivityTimeline logs={logs} />

        {/* Deleted tasks bin link */}
        <Pressable onPress={() => router.push('/trash')} style={[s.trashLink, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '4D' }]}>
          <View style={s.trashLeft}>
            <View style={[s.trashIconWrap, { backgroundColor: c.errorContainer + '4D' }]}>
              <MaterialIcons name="delete-outline" size={24} color={c.error} />
            </View>
            <View>
              <Text style={[s.trashTitle, { color: c.onSurface }]}>Recently Deleted</Text>
              <Text style={[s.trashSub, { color: c.outline }]}>{deletedTasks.length} task{deletedTasks.length !== 1 ? 's' : ''} in trash</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={c.outlineVariant} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  profilePic: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.24 },
  scroll: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 120 : 100 },
  pageTitle: { fontSize: 32, fontWeight: '700', letterSpacing: -0.64, marginBottom: 4 },
  pageSubtitle: { fontSize: 16, marginBottom: 24 },
  trashLink: { marginTop: 32, padding: 16, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trashLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  trashIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  trashTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  trashSub: { fontSize: 13 },
});
