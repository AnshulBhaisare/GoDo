import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '../../src/stores/taskStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors } from '../../src/constants/theme';

export default function TrashScreen() {
  const settings = useSettingsStore();
  const c = Colors[settings.theme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { deletedTasks, restoreTask, permanentlyDeleteTask, loadTasks } = useTaskStore();

  useEffect(() => { loadTasks(); }, []);

  const handleRestore = useCallback((id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    restoreTask(id);
  }, [restoreTask]);

  const handlePermanentDelete = useCallback((id: string) => {
    Alert.alert(
      'Permanently Delete?',
      'This action cannot be undone. This task will be removed forever.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await permanentlyDeleteTask(id);
          }
        }
      ]
    );
  }, [permanentlyDeleteTask]);

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
      {/* Header matching other tabs */}
      <View style={[s.header, { backgroundColor: c.background + 'CC' }]}>
        <Pressable 
          onPress={() => settings.setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          style={[s.profilePic, { backgroundColor: c.surfaceVariant }]}
        >
          <MaterialIcons name={settings.theme === 'dark' ? 'light-mode' : 'dark-mode'} size={18} color={c.onSurfaceVariant} />
        </Pressable>
        <Text style={[s.headerTitle, { color: c.primary }]}>GoDo</Text>
        <Pressable onPress={() => router.push('/notifications')}>
          <MaterialIcons name="notifications-none" size={24} color={c.onSurfaceVariant} />
        </Pressable>
      </View>

      <View style={s.content}>
        <Text style={[s.pageTitle, { color: c.onSurface }]}>Trash Bin</Text>
        <Text style={[s.pageSubtitle, { color: c.onSurfaceVariant }]}>Recently deleted tasks (24h expiry)</Text>

        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {deletedTasks.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialIcons name="delete-outline" size={48} color={c.outlineVariant} />
              <Text style={[s.emptyText, { color: c.outline }]}>Your trash is empty.</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {deletedTasks.map(task => (
                <View key={task.id} style={[s.card, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '4D' }]}>
                  <View style={s.info}>
                    <Text style={[s.taskTitle, { color: c.onSurface }]}>{task.title}</Text>
                    <Text style={[s.meta, { color: c.onSurfaceVariant }]}>
                      Deleted {task.deleted_at ? new Date(task.deleted_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                  <View style={s.actions}>
                    <Text style={[s.timeLeft, { color: c.error }]}>{getTimeLeft(task.deleted_at)}</Text>
                    <View style={s.btnRow}>
                      <Pressable onPress={() => handleRestore(task.id)} style={[s.actionBtn, { borderColor: c.primary + '4D' }]}>
                        <MaterialIcons name="restore" size={14} color={c.primary} />
                        <Text style={[s.btnText, { color: c.primary }]}>Restore</Text>
                      </Pressable>
                      <Pressable onPress={() => handlePermanentDelete(task.id)} style={[s.actionBtn, { borderColor: c.error + '4D' }]}>
                        <MaterialIcons name="delete-forever" size={14} color={c.error} />
                        <Text style={[s.btnText, { color: c.error }]}>Purge</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  profilePic: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.24 },
  content: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { fontSize: 32, fontWeight: '700', letterSpacing: -0.64 },
  pageSubtitle: { fontSize: 16, marginTop: 4, marginBottom: 24 },
  list: { paddingBottom: Platform.OS === 'ios' ? 120 : 100 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  info: { flex: 1, paddingRight: 12 },
  taskTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 12 },
  actions: { alignItems: 'flex-end', gap: 10 },
  timeLeft: { fontSize: 12, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  btnText: { fontSize: 12, fontWeight: '600' },
});
