import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useActivityStore } from '../../src/stores/activityStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { ActivityTimeline } from '../../src/components/ActivityTimeline';
import { Colors } from '../../src/constants/theme';

export default function ActivityScreen() {
  const c = Colors.light;
  const { logs, loadLogs } = useActivityStore();
  const { deletedTasks, restoreTask } = useTaskStore();

  useEffect(() => { loadLogs(); }, []);

  const handleRestore = useCallback((id: string) => {
    restoreTask(id);
    loadLogs();
  }, [restoreTask, loadLogs]);

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
    <SafeAreaView style={[s.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[s.header, { backgroundColor: c.background + 'CC' }]}>
        <View style={[s.profilePic, { backgroundColor: c.surfaceVariant }]}>
          <MaterialIcons name="person" size={18} color={c.onSurfaceVariant} />
        </View>
        <Text style={[s.headerTitle, { color: c.primary }]}>GoDo</Text>
        <MaterialIcons name="notifications-none" size={24} color={c.primary} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.pageTitle, { color: c.onSurface }]}>Activity Log</Text>
        <Text style={[s.pageSubtitle, { color: c.onSurfaceVariant }]}>Track the lifecycle of your tasks.</Text>

        <ActivityTimeline logs={logs} />

        {/* Deleted tasks bin */}
        {deletedTasks.length > 0 && (
          <View style={[s.deletedSection, { borderTopColor: c.surfaceVariant }]}>
            <View style={s.deletedHeader}>
              <MaterialIcons name="delete-sweep" size={24} color={c.error} />
              <Text style={[s.deletedTitle, { color: c.onSurface }]}>Recently Deleted</Text>
            </View>
            {deletedTasks.map(task => (
              <View key={task.id} style={[s.deletedCard, { backgroundColor: c.surfaceContainerLowest, borderColor: c.errorContainer + '80' }]}>
                <View style={s.deletedInfo}>
                  <Text style={[s.deletedTaskTitle, { color: c.onSurface }]}>{task.title}</Text>
                  <Text style={[s.deletedMeta, { color: c.onSurfaceVariant }]}>
                    Deleted {task.deleted_at ? new Date(task.deleted_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                  </Text>
                </View>
                <View style={s.deletedActions}>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  profilePic: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.24 },
  scroll: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 120 : 100 },
  pageTitle: { fontSize: 32, fontWeight: '700', letterSpacing: -0.64, marginBottom: 4 },
  pageSubtitle: { fontSize: 16, marginBottom: 24 },
  deletedSection: { marginTop: 32, paddingTop: 24, borderTopWidth: 1 },
  deletedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  deletedTitle: { fontSize: 18, fontWeight: '600' },
  deletedCard: { borderRadius: 8, borderWidth: 1, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  deletedInfo: { flex: 1 },
  deletedTaskTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  deletedMeta: { fontSize: 14 },
  deletedActions: { alignItems: 'flex-end', gap: 8 },
  timeLeft: { fontSize: 12, fontWeight: '500', letterSpacing: 0.24 },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  restoreBtnText: { fontSize: 12, fontWeight: '500' },
});
