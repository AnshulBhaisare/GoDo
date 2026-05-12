import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Task } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isCompleted?: boolean;
}

export function TaskCard({ task, onToggleComplete, onDelete, isCompleted = false }: TaskCardProps) {
  const settings = useSettingsStore();
  const colors = Colors[settings.theme === 'dark' ? 'dark' : 'light'];

  const priorityConfig: Record<string, { label: string; bg: string; text: string; border?: string }> = {
    high: {
      label: 'High',
      bg: colors.errorContainer,
      text: colors.onErrorContainer,
    },
    medium: {
      label: 'Med',
      bg: colors.surfaceContainerHigh,
      text: colors.onSurfaceVariant,
    },
    low: {
      label: 'Low',
      bg: colors.surfaceContainerLow,
      text: colors.onSurfaceVariant,
      border: colors.outlineVariant + '33',
    },
  };

  const priority = priorityConfig[task.priority];
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status === 'pending';

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: isCompleted ? colors.surfaceContainerLow : colors.surface,
        borderColor: colors.outlineVariant + '33',
      },
      isCompleted && styles.completedCard,
    ]}>
      {/* Checkbox */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onToggleComplete(task.id);
        }}
        style={[styles.checkbox, { borderColor: colors.primary + '33' }, isCompleted && { backgroundColor: colors.primary, borderColor: colors.primary }]}
      >
        {isCompleted && <MaterialIcons name="check" size={14} color={colors.onPrimary} />}
      </Pressable>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              { color: colors.onSurface },
              isCompleted && styles.completedTitle,
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: priority.bg },
            priority.border ? { borderWidth: 1, borderColor: priority.border } : {},
          ]}>
            <Text style={[styles.priorityText, { color: priority.text }]}>
              {priority.label}
            </Text>
          </View>
        </View>

        {task.deadline && (
          <View style={styles.deadlineRow}>
            <MaterialIcons
              name="calendar-today"
              size={14}
              color={isOverdue ? colors.error : colors.onSurfaceVariant}
            />
            <Text style={[
              styles.deadlineText,
              { color: isOverdue ? colors.error : colors.onSurfaceVariant },
            ]}>
              {formatTaskDeadline(task.deadline)}
            </Text>
          </View>
        )}

        {task.recurring_type !== 'none' && (
          <View style={styles.deadlineRow}>
            <MaterialIcons name="repeat" size={14} color={colors.secondary} />
            <Text style={[styles.deadlineText, { color: colors.secondary }]}>
              {task.recurring_type}
            </Text>
          </View>
        )}
      </View>

      {/* Delete button */}
      {!isCompleted && (
        <Pressable 
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(task.id);
          }} 
          style={styles.deleteBtn}
        >
          <MaterialIcons name="delete-outline" size={18} color={colors.error} />
        </Pressable>
      )}
    </View>
  );
}

function formatTaskDeadline(deadline: string): string {
  try {
    const date = new Date(deadline);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow`;
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return deadline;
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  completedCard: {
    opacity: 0.6,
  },
  checkboxContainer: {
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  title: {
    ...Typography.titleSm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  priorityText: {
    ...Typography.labelMono,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm - 2,
    marginTop: Spacing.sm,
  },
  deadlineText: {
    ...Typography.caption,
  },
  deleteBtn: {
    padding: 4,
  },
});
