import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../src/stores/taskStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { TaskCard } from '../src/components/TaskCard';
import { Colors } from '../src/constants/theme';
import { Task } from '../src/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const settings = useSettingsStore();
  const c = Colors[settings.theme === 'dark' ? 'dark' : 'light'];
  const { pendingTasks, loadTasks } = useTaskStore();

  const [overdue, setOverdue] = useState<Task[]>([]);
  const [upcoming, setUpcoming] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const now = new Date().getTime();
    const ov: Task[] = [];
    const up: Task[] = [];

    pendingTasks.forEach(task => {
      if (!task.deadline) return;
      const dl = new Date(task.deadline).getTime();
      if (dl < now) {
        ov.push(task);
      } else if (dl < now + 24 * 60 * 60 * 1000) {
        up.push(task);
      }
    });

    setOverdue(ov.sort((a, b) => new Date(b.deadline!).getTime() - new Date(a.deadline!).getTime()));
    setUpcoming(up.sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()));
  }, [pendingTasks]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <View style={[s.header, { backgroundColor: c.background + 'CC', borderBottomColor: c.outlineVariant + '4D' }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={c.onSurface} />
        </Pressable>
        <Text style={[s.headerTitle, { color: c.onSurface }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {overdue.length === 0 && upcoming.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialIcons name="notifications-off" size={48} color={c.outlineVariant} />
            <Text style={[s.emptyText, { color: c.outline }]}>You're all caught up!</Text>
            <Text style={[s.emptySub, { color: c.outlineVariant }]}>No pending alerts or overdue tasks.</Text>
          </View>
        ) : (
          <View style={s.list}>
            {overdue.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <MaterialIcons name="warning" size={20} color={c.error} />
                  <Text style={[s.sectionTitle, { color: c.error }]}>Overdue</Text>
                </View>
                {overdue.map(t => <TaskCard key={t.id} task={t} />)}
              </View>
            )}

            {upcoming.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <MaterialIcons name="schedule" size={20} color={c.primary} />
                  <Text style={[s.sectionTitle, { color: c.primary }]}>Upcoming (Next 24h)</Text>
                </View>
                {upcoming.map(t => <TaskCard key={t.id} task={t} />)}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 60 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  emptySub: { fontSize: 14, textAlign: 'center' },
  list: { gap: 24 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
});
