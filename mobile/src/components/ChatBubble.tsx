import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatMessage as ChatMessageType } from '../types';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface ChatBubbleProps {
  message: ChatMessageType;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const colors = Colors.light;

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
          <MaterialIcons name="auto-awesome" size={16} color={colors.onSurfaceVariant} />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser
          ? { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '1A' }
          : { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '33' },
        isUser ? styles.userBubble : styles.aiBubble,
      ]}>
        <Text style={[
          styles.messageText,
          { color: isUser ? colors.onPrimaryContainer : colors.onSurface },
        ]}>
          {message.message}
        </Text>

        {/* Embedded task card */}
        {message.taskData && message.taskData.action === 'create' && message.taskData.task && (
          <View style={[styles.taskCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.primary + '33' }]}>
            <View style={[styles.taskIcon, { backgroundColor: colors.primary + '1A' }]}>
              <MaterialIcons name="alarm" size={14} color={colors.primary} />
            </View>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, { color: colors.onSurface }]}>
                {message.taskData.task.title}
              </Text>
              {message.taskData.task.deadline && (
                <Text style={[styles.taskDeadline, { color: colors.outline }]}>
                  {formatDeadline(message.taskData.task.deadline)}
                </Text>
              )}
            </View>
          </View>
        )}

        {message.taskData && message.taskData.action === 'complete' && (
          <View style={[styles.taskCard, { backgroundColor: '#e8f5e9', borderColor: '#4caf5033' }]}>
            <View style={[styles.taskIcon, { backgroundColor: '#4caf501A' }]}>
              <MaterialIcons name="check-circle" size={14} color="#4caf50" />
            </View>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, { color: colors.onSurface }]}>
                {message.taskData.taskTitle || 'Task Completed'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function formatDeadline(deadline: string): string {
  try {
    const date = new Date(deadline);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
  } catch {
    return deadline;
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.containerMargin,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  userBubble: {
    borderRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.sm,
  },
  aiBubble: {
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.sm,
    maxWidth: '80%',
  },
  messageText: {
    ...Typography.bodyMd,
    lineHeight: 22,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
    marginTop: Spacing.sm + 4,
    padding: Spacing.sm,
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
  },
  taskIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...Typography.labelMono,
  },
  taskDeadline: {
    ...Typography.caption,
    marginTop: 2,
  },
});
