import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../src/stores/taskStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { Colors } from '../src/constants/theme';

export default function TrashScreen() {
  const settings = useSettingsStore();
  const c = Colors[settings.theme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { deletedTasks, restoreTask, loadTasks } = useTaskStore();

  useEffect(() => { loadTasks(); }, []);

  const handleRestore = useCallback((id: string) => {
    restoreTask(id);
  }, [restoreTask]);

  const getTimeLeft = (deletedAt: string | null) => {
    if (!deletedAt) return 'Unknown';
    const expiry = new Date(new Date(deletedAt).getTime() + 24 * 60 * 60 * 1000);
    const diff = expiry.getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}m left`;
    return `${hours}h left`;
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <View style={[s.header, { backgroundColor: c.background + 'CC', borderBottomColor: c.outlineVariant + '4D' }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={c.onSurface} />
        </Pressable>
        <Text style={[s.headerTitle, { color: c.onSurface }]}>Trash Bin</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {deletedTasks.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialIcons name="delete-outline" size={48} color={c.outlineVariant} />
            <Text style={[s.emptyText, { color: c.outline }]}>Your trash is empty.</Text>
            <Text style={[s.emptySub, { color: c.outlineVariant }]}>Deleted tasks will stay here for 24 hours.</Text>
          </View>
        ) : (
          <View style={s.list}>
            {deletedTasks.map(task => (
              <View key={task.id} style={[s.card, { backgroundColor: c.surfaceContainerLowest, borderColor: c.errorContainer + '80' }]}>
                <View style={s.info}>
                  <Text style={[s.taskTitle, { color: c.onSurface }]}>{task.title}</Text>
                  <Text style={[s.meta, { color: c.onSurfaceVariant }]}>
                    Deleted {task.deleted_at ? new Date(task.deleted_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
                <View style={s.actions}>
                  <Text style={[s.timeLeft, { color: c.error }]}>{getTimeLeft(task.deleted_at)}</Text>
                  <Pressable onPress={() => handleRestore(task.id)} style={[s.restoreBtn, { borderColor: c.outlineVariant + '80' }]}>
                    <MaterialIcons name="restore" size={14} color={c.primary} />
                    <Text style={[s.restoreBtnText, { color: c.primary }]}>Restore</Text>
                  </Pressable>
                </View>
              </View>
            ))}
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
  list: { gap: 12 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  info: { flex: 1, paddingRight: 12 },
  taskTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  meta: { fontSize: 13 },
  actions: { alignItems: 'flex-end', gap: 10 },
  timeLeft: { fontSize: 12, fontWeight: '600', letterSpacing: 0.24 },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  restoreBtnText: { fontSize: 14, fontWeight: '600' },
});
