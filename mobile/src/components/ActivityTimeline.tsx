import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityLog, ActivityEventType } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface Props { logs: ActivityLog[]; }

export function ActivityTimeline({ logs }: Props) {
  const settings = useSettingsStore();
  const c = Colors[settings.theme === 'dark' ? 'dark' : 'light'];

  const EVENT_CONFIG: Record<ActivityEventType, { icon: string; color: string; label: string }> = {
    created: { icon: 'add-circle', color: c.primary, label: 'Task Created' },
    updated: { icon: 'edit', color: c.primary, label: 'Task Updated' },
    completed: { icon: 'check-circle', color: c.primary, label: 'Task Completed' },
    reopened: { icon: 'refresh', color: c.secondary, label: 'Task Reopened' },
    deleted: { icon: 'delete', color: c.error, label: 'Task Deleted' },
    restored: { icon: 'history', color: c.primary, label: 'Task Restored' },
  };

  if (logs.length === 0) {
    return (
      <View style={s.empty}>
        <MaterialIcons name="history" size={48} color={c.outlineVariant} />
        <Text style={[s.emptyText, { color: c.onSurfaceVariant }]}>No activity yet</Text>
        <Text style={[s.emptySubtext, { color: c.outline }]}>Task events will appear here</Text>
      </View>
    );
  }

  return (
    <View style={s.timeline}>
      <View style={[s.line, { backgroundColor: c.surfaceVariant }]} />
      {logs.map((log, i) => {
        const config = EVENT_CONFIG[log.event_type];
        const isDelete = log.event_type === 'deleted';
        return (
          <View key={log.id} style={s.item}>
            <View style={[s.iconWrap, { backgroundColor: isDelete ? c.errorContainer : c.surfaceContainer, borderColor: isDelete ? c.error + '33' : c.outlineVariant + '4D' }]}>
              <MaterialIcons name={config.icon as any} size={18} color={config.color} />
            </View>
            <View style={[s.card, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '4D' }]}>
              <View style={s.cardHeader}>
                <Text style={[s.eventLabel, { color: c.onSurface }]}>{config.label}</Text>
                <Text style={[s.timestamp, { color: c.outline }]}>{formatTime(log.timestamp)}</Text>
              </View>
              <Text style={[s.taskTitle, { color: c.onSurfaceVariant }]} numberOfLines={2}>
                "{log.task_title}"
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) {
    return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const s = StyleSheet.create({
  timeline: { position: 'relative', paddingLeft: 0 },
  line: { position: 'absolute', left: 19, top: 0, bottom: 0, width: 2 },
  item: { flexDirection: 'row', gap: 16, marginBottom: 24, alignItems: 'flex-start' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, zIndex: 1, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  card: { flex: 1, borderRadius: 8, borderWidth: 1, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  eventLabel: { fontSize: 18, fontWeight: '600' },
  timestamp: { fontSize: 12, fontWeight: '500', letterSpacing: 0.24 },
  taskTitle: { fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14 },
});
