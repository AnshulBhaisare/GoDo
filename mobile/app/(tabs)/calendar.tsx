import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CalendarGrid } from '../../src/components/CalendarGrid';
import { useActivityStore } from '../../src/stores/activityStore';
import { getTasksForMonth } from '../../src/db/taskQueries';
import { Colors } from '../../src/constants/theme';
import { Task } from '../../src/types';

export default function CalendarScreen() {
  const c = Colors.light;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<number | null>(now.getDate());
  const { weeklyCompletions, dailyCounts, loadStats } = useActivityStore();

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { getTasksForMonth(year, month).then(setTasks); }, [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
    setSelectedDate(null);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
    setSelectedDate(null);
  }, [month]);

  // Heatmap data
  const maxCount = Math.max(...dailyCounts.map(d => d.count), 1);
  const heatBars = dailyCounts.length > 0 ? dailyCounts : Array(7).fill({ count: 0 });

  // Completion rate
  const totalTasks = tasks.length || 1;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const rate = Math.round((completedCount / totalTasks) * 100);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[s.header, { backgroundColor: c.background + 'CC' }]}>
        <View style={[s.profilePic, { backgroundColor: c.surfaceVariant }]}>
          <MaterialIcons name="person" size={18} color={c.onSurfaceVariant} />
        </View>
        <Text style={[s.headerTitle, { color: c.primary }]}>GoDo</Text>
        <MaterialIcons name="notifications-none" size={24} color={c.onSurfaceVariant} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <CalendarGrid
          year={year} month={month} tasks={tasks}
          onPrevMonth={prevMonth} onNextMonth={nextMonth}
          selectedDate={selectedDate} onSelectDate={setSelectedDate}
        />

        {/* Stats section */}
        <View style={s.statsRow}>
          {/* Heatmap */}
          <View style={[s.statCard, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '33' }]}>
            <Text style={[s.statTitle, { color: c.onSurface }]}>Activity Heatmap</Text>
            <View style={s.heatBars}>
              {heatBars.slice(0, 7).map((bar: any, i: number) => (
                <View key={i} style={[s.heatBar, { height: Math.max(4, (bar.count / maxCount) * 56), backgroundColor: c.primary, opacity: 0.3 + (bar.count / maxCount) * 0.7 }]} />
              ))}
            </View>
            <View style={s.heatLabels}>
              <Text style={[s.heatLabel, { color: c.outline }]}>Mon</Text>
              <Text style={[s.heatLabel, { color: c.outline }]}>Sun</Text>
            </View>
          </View>

          {/* Weekly Focus */}
          <View style={[s.statCard, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '33' }]}>
            <Text style={[s.statTitle, { color: c.onSurface }]}>Weekly Focus</Text>
            <View style={s.focusRow}>
              <View>
                <Text style={[s.focusNum, { color: c.primary }]}>{weeklyCompletions}</Text>
                <Text style={[s.focusSub, { color: c.outline }]}>Tasks Done</Text>
              </View>
              <View style={[s.divider, { backgroundColor: c.outlineVariant + '4D' }]} />
              <View>
                <Text style={[s.focusNum, { color: c.secondary }]}>{rate}%</Text>
                <Text style={[s.focusSub, { color: c.outline }]}>Rate</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  profilePic: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.24 },
  scroll: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 120 : 100, gap: 16 },
  statsRow: { gap: 12 },
  statCard: { borderRadius: 12, borderWidth: 1, padding: 16, elevation: 1 },
  statTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  heatBars: { flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 4, justifyContent: 'space-between', marginTop: 8 },
  heatBar: { flex: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  heatLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  heatLabel: { fontSize: 12, fontWeight: '500' },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  focusNum: { fontSize: 32, fontWeight: '700', letterSpacing: -0.64 },
  focusSub: { fontSize: 12, fontWeight: '500' },
  divider: { width: 1, height: 40 },
});
