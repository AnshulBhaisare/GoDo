import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/stores/taskStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { TaskCard } from '../../src/components/TaskCard';
import { Colors } from '../../src/constants/theme';
import { Task } from '../../src/types';

export default function TasksScreen() {
  const router = useRouter();
  const settings = useSettingsStore();
  const c = Colors[settings.theme === 'dark' ? 'dark' : 'light'];
  const { pendingTasks, completedTasks, completeTask, reopenTask, deleteTask } = useTaskStore();
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const tasks = (tab === 'pending' ? pendingTasks : completedTasks).filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = useCallback((id: string) => {
    if (tab === 'pending') completeTask(id);
    else reopenTask(id);
  }, [tab, completeTask, reopenTask]);

  const handleDelete = useCallback((id: string) => {
    deleteTask(id);
  }, [deleteTask]);

  const renderTask = useCallback(({ item }: { item: Task }) => (
    <TaskCard task={item} onToggleComplete={handleToggle} onDelete={handleDelete} isCompleted={tab === 'completed'} />
  ), [handleToggle, handleDelete, tab]);

  const renderEmpty = useCallback(() => (
    <View style={s.empty}>
      <MaterialIcons name={tab === 'pending' ? 'check-circle-outline' : 'celebration'} size={48} color={c.outlineVariant} />
      <Text style={[s.emptyText, { color: c.onSurfaceVariant }]}>
        {tab === 'pending' ? 'No pending tasks' : 'No completed tasks yet'}
      </Text>
      <Text style={[s.emptySubtext, { color: c.outline }]}>
        {tab === 'pending' ? 'Use the chat to add tasks naturally' : 'Complete tasks to see them here'}
      </Text>
    </View>
  ), [tab, c]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
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
        <Text style={[s.pageTitle, { color: c.onSurface }]}>Tasks</Text>
        <Text style={[s.pageSubtitle, { color: c.onSurfaceVariant }]}>Manage your priorities</Text>

        {/* Search Bar */}
        <View style={[s.searchBar, { backgroundColor: c.surfaceContainer, borderColor: c.outlineVariant + '4D' }]}>
          <MaterialIcons name="search" size={20} color={c.onSurfaceVariant} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tasks..."
            placeholderTextColor={c.outlineVariant}
            style={[s.searchInput, { color: c.onSurface }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={c.onSurfaceVariant} />
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        <View style={[s.tabs, { borderBottomColor: c.outlineVariant + '4D' }]}>
          <Pressable onPress={() => setTab('pending')} style={s.tab}>
            <Text style={[s.tabText, tab === 'pending' ? { color: c.primary } : { color: c.onSurfaceVariant }]}>
              Pending ({pendingTasks.length})
            </Text>
            {tab === 'pending' && <View style={[s.tabIndicator, { backgroundColor: c.primary }]} />}
          </Pressable>
          <Pressable onPress={() => setTab('completed')} style={s.tab}>
            <Text style={[s.tabText, tab === 'completed' ? { color: c.primary } : { color: c.onSurfaceVariant }]}>
              Completed ({completedTasks.length})
            </Text>
            {tab === 'completed' && <View style={[s.tabIndicator, { backgroundColor: c.primary }]} />}
          </Pressable>
        </View>

        {/* Task list */}
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
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
  pageSubtitle: { fontSize: 16, marginTop: 4, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
  tabs: { flexDirection: 'row', gap: 16, borderBottomWidth: 1, marginBottom: 16 },
  tab: { paddingBottom: 12, position: 'relative' },
  tabText: { fontSize: 18, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1 },
  list: { paddingBottom: Platform.OS === 'ios' ? 120 : 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14, textAlign: 'center' },
});
