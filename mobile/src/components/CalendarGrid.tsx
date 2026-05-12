import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Task } from '../types';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface CalendarGridProps {
  year: number;
  month: number;
  tasks: Task[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDate: number | null;
  onSelectDate: (date: number) => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function CalendarGrid(props: CalendarGridProps) {
  const { year, month, tasks, onPrevMonth, onNextMonth, selectedDate, onSelectDate } = props;
  const c = Colors.light;
  const days = useMemo(() => buildDays(year, month, tasks), [year, month, tasks]);
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  return (
    <View>
      <View style={s.header}>
        <View style={s.monthLabel}>
          <Text style={[s.monthText, { color: c.onSurface }]}>{monthName}</Text>
          <Text style={[s.yearText, { color: c.outline }]}>{year}</Text>
        </View>
        <View style={s.navBtns}>
          <Pressable onPress={onPrevMonth} style={[s.navBtn, { borderColor: c.outlineVariant + '4D' }]}>
            <MaterialIcons name="chevron-left" size={24} color={c.onSurfaceVariant} />
          </Pressable>
          <Pressable onPress={onNextMonth} style={[s.navBtn, { borderColor: c.outlineVariant + '4D' }]}>
            <MaterialIcons name="chevron-right" size={24} color={c.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      <View style={[s.grid, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '33' }]}>
        <View style={s.dayRow}>
          {DAY_LABELS.map((l, i) => (
            <View key={i} style={s.dayCell}><Text style={[s.dayLabel, { color: c.outline }]}>{l}</Text></View>
          ))}
        </View>
        <View style={s.datesWrap}>
          {days.map((d, i) => {
            const sel = d.isCur && d.date === selectedDate;
            return (
              <Pressable key={i} onPress={() => d.isCur && onSelectDate(d.date)} style={s.dateCell}>
                <View style={[s.dateNum, d.isToday && { backgroundColor: c.primary }, sel && !d.isToday && { backgroundColor: c.primaryFixedDim }]}>
                  <Text style={[s.dateTxt, { color: d.isCur ? c.onSurface : c.outlineVariant }, d.isToday && { color: c.onPrimary }]}>{d.date}</Text>
                </View>
                <View style={s.dots}>
                  {d.pend > 0 && <View style={[s.dot, { backgroundColor: c.primaryFixedDim }]} />}
                  {d.comp > 0 && <View style={[s.dot, { backgroundColor: c.primary }]} />}
                  {d.rec && <View style={[s.dot, { backgroundColor: c.secondary }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={[s.legend, { borderTopColor: c.outlineVariant + '33' }]}>
          <View style={s.legendItem}><View style={[s.dot, { backgroundColor: c.primary }]} /><Text style={[s.legendTxt, { color: c.outline }]}>Done</Text></View>
          <View style={s.legendItem}><View style={[s.dot, { backgroundColor: c.primaryFixedDim }]} /><Text style={[s.legendTxt, { color: c.outline }]}>Pending</Text></View>
          <View style={s.legendItem}><View style={[s.dot, { backgroundColor: c.secondary }]} /><Text style={[s.legendTxt, { color: c.outline }]}>Recurring</Text></View>
        </View>
      </View>
    </View>
  );
}

function buildDays(year: number, month: number, tasks: Task[]) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const sw = (first.getDay() + 6) % 7;
  const dim = last.getDate();
  const today = new Date();
  const prevLast = new Date(year, month, 0).getDate();
  const days: any[] = [];
  for (let i = sw - 1; i >= 0; i--) days.push({ date: prevLast - i, isCur: false, isToday: false, pend: 0, comp: 0, rec: false });
  for (let d = 1; d <= dim; d++) {
    const dt = new Date(year, month, d);
    const dt_tasks = tasks.filter(t => { if (!t.deadline) return false; const td = new Date(t.deadline); return td.getFullYear() === year && td.getMonth() === month && td.getDate() === d; });
    days.push({ date: d, isCur: true, isToday: dt.toDateString() === today.toDateString(), pend: dt_tasks.filter(t => t.status === 'pending').length, comp: dt_tasks.filter(t => t.status === 'completed').length, rec: dt_tasks.some(t => t.recurring_type !== 'none') });
  }
  const rem = 42 - days.length;
  for (let d = 1; d <= rem; d++) days.push({ date: d, isCur: false, isToday: false, pend: 0, comp: 0, rec: false });
  return days;
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  monthLabel: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  monthText: { fontSize: 32, fontWeight: '700', letterSpacing: -0.64 },
  yearText: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  navBtns: { flexDirection: 'row', gap: 8 },
  navBtn: { padding: 4, borderRadius: 999, borderWidth: 1 },
  grid: { borderRadius: 12, borderWidth: 1, padding: 16, elevation: 1 },
  dayRow: { flexDirection: 'row', marginBottom: 16 },
  dayCell: { flex: 1, alignItems: 'center' },
  dayLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 0.24 },
  datesWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: '14.285%', alignItems: 'center', marginBottom: 24, gap: 4 },
  dateNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dateTxt: { fontSize: 14 },
  dots: { flexDirection: 'row', gap: 2, height: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendTxt: { fontSize: 12, fontWeight: '500' },
});
