import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { exportBackup, importBackup } from '../../src/services/backup';
import { useTaskStore } from '../../src/stores/taskStore';
import { useChatStore } from '../../src/stores/chatStore';
import { useActivityStore } from '../../src/stores/activityStore';
import { Colors } from '../../src/constants/theme';
import { AIProvider } from '../../src/types';

export default function SettingsScreen() {
  const c = Colors.light;
  const settings = useSettingsStore();
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settings.getAPIKey(settings.aiProvider).then(key => {
      setHasKey(!!key);
      if (key) setApiKey('••••••••••••••••');
    });
  }, [settings.aiProvider]);

  const handleSaveKey = useCallback(async () => {
    if (apiKey.includes('•')) return; // placeholder
    if (!apiKey.trim()) return;
    setIsSaving(true);
    await settings.saveAPIKey(settings.aiProvider, apiKey.trim());
    setHasKey(true);
    setApiKey('••••••••••••••••');
    setIsSaving(false);
    Alert.alert('Success', 'API key saved securely.');
  }, [apiKey, settings]);

  const handleClearKey = useCallback(async () => {
    await settings.clearAPIKey(settings.aiProvider);
    setApiKey('');
    setHasKey(false);
    Alert.alert('Cleared', 'API key has been removed.');
  }, [settings]);

  const handleExport = useCallback(async () => {
    const result = await exportBackup();
    if (result) Alert.alert('Exported', 'Backup created successfully.');
    else Alert.alert('Error', 'Failed to export backup.');
  }, []);

  const handleImport = useCallback(async () => {
    Alert.alert('Import Backup', 'This will replace all current data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Import', style: 'destructive', onPress: async () => {
        const result = await importBackup();
        if (result) {
          await useTaskStore.getState().loadTasks();
          await useChatStore.getState().loadMessages();
          await useActivityStore.getState().loadLogs();
          Alert.alert('Imported', 'Backup restored successfully.');
        } else {
          Alert.alert('Error', 'Failed to import backup.');
        }
      }},
    ]);
  }, []);

  const handleProviderChange = useCallback((provider: AIProvider) => {
    settings.setAIProvider(provider);
    settings.getAPIKey(provider).then(key => {
      setHasKey(!!key);
      setApiKey(key ? '••••••••••••••••' : '');
    });
  }, [settings]);

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
        <Text style={[s.pageTitle, { color: c.onSurface }]}>Settings</Text>
        <Text style={[s.pageSub, { color: c.onSurfaceVariant }]}>Manage your preferences and integrations.</Text>

        {/* AI Provider */}
        <View style={[s.section, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '33' }]}>
          <View style={s.sectionHeader}>
            <MaterialIcons name="psychology" size={20} color={c.primary} />
            <Text style={[s.sectionTitle, { color: c.onSurface }]}>Connect AI Provider</Text>
          </View>
          <Text style={[s.sectionDesc, { color: c.onSurfaceVariant }]}>
            Link your preferred AI service for smart task parsing.
          </Text>

          {/* Provider selector */}
          <View style={[s.providerRow, { backgroundColor: c.surfaceContainer, borderColor: c.outlineVariant + '4D' }]}>
            <Pressable
              onPress={() => handleProviderChange('groq')}
              style={[s.providerBtn, settings.aiProvider === 'groq' && { backgroundColor: c.surfaceContainerLowest, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }]}
            >
              <Text style={[s.providerText, { color: settings.aiProvider === 'groq' ? c.primary : c.onSurfaceVariant }]}>Groq</Text>
            </Pressable>
            <Pressable
              onPress={() => handleProviderChange('openrouter')}
              style={[s.providerBtn, settings.aiProvider === 'openrouter' && { backgroundColor: c.surfaceContainerLowest, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }]}
            >
              <Text style={[s.providerText, { color: settings.aiProvider === 'openrouter' ? c.primary : c.onSurfaceVariant }]}>OpenRouter</Text>
            </Pressable>
          </View>

          {/* API Key input */}
          <Text style={[s.inputLabel, { color: c.onSurfaceVariant }]}>API Key</Text>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-..."
            placeholderTextColor={c.outlineVariant + '80'}
            secureTextEntry
            style={[s.apiInput, { color: c.onSurface, borderBottomColor: c.outlineVariant }]}
            onFocus={() => { if (apiKey.includes('•')) setApiKey(''); }}
          />
          <View style={s.keyActions}>
            {hasKey && (
              <Pressable onPress={handleClearKey} style={[s.clearBtn, { borderColor: c.error + '4D' }]}>
                <Text style={[s.clearBtnText, { color: c.error }]}>Clear Key</Text>
              </Pressable>
            )}
            <Pressable onPress={handleSaveKey} disabled={isSaving} style={[s.saveBtn, { backgroundColor: c.primary }]}>
              <Text style={[s.saveBtnText, { color: c.onPrimary }]}>{isSaving ? 'Saving...' : 'Save Key'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Reminders */}
        <View style={[s.section, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '33' }]}>
          <View style={s.sectionHeader}>
            <MaterialIcons name="notifications-active" size={20} color={c.primary} />
            <Text style={[s.sectionTitle, { color: c.onSurface }]}>Reminders</Text>
          </View>
          <View style={s.reminderRow}>
            <View>
              <Text style={[s.reminderLabel, { color: c.onSurface }]}>Default Alert Time</Text>
              <Text style={[s.reminderSub, { color: c.onSurfaceVariant }]}>Minutes before task</Text>
            </View>
            <View style={[s.reminderInput, { backgroundColor: c.surfaceContainer, borderColor: c.outlineVariant + '4D' }]}>
              <TextInput
                value={settings.reminderOffsetMinutes.toString()}
                onChangeText={(v) => { const n = parseInt(v, 10); if (!isNaN(n) && n >= 0 && n <= 120) settings.setReminderOffset(n); }}
                keyboardType="numeric"
                style={[s.reminderValue, { color: c.onSurface }]}
                maxLength={3}
              />
              <Text style={[s.reminderUnit, { color: c.onSurfaceVariant }]}>min</Text>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={[s.section, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '33' }]}>
          <View style={s.sectionHeader}>
            <MaterialIcons name="storage" size={20} color={c.primary} />
            <Text style={[s.sectionTitle, { color: c.onSurface }]}>Data Management</Text>
          </View>
          <Pressable onPress={handleExport} style={s.dataRow}>
            <View style={s.dataRowLeft}>
              <MaterialIcons name="cloud-download" size={20} color={c.onSurfaceVariant} />
              <Text style={[s.dataRowText, { color: c.onSurface }]}>Export Backup</Text>
            </View>
            <MaterialIcons name="chevron-right" size={16} color={c.outlineVariant} />
          </Pressable>
          <View style={[s.divider, { backgroundColor: c.outlineVariant + '33' }]} />
          <Pressable onPress={handleImport} style={s.dataRow}>
            <View style={s.dataRowLeft}>
              <MaterialIcons name="cloud-upload" size={20} color={c.onSurfaceVariant} />
              <Text style={[s.dataRowText, { color: c.onSurface }]}>Import Backup</Text>
            </View>
            <MaterialIcons name="chevron-right" size={16} color={c.outlineVariant} />
          </Pressable>
        </View>

        {/* About */}
        <View style={[s.section, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '33' }]}>
          <View style={s.aboutRow}>
            <MaterialIcons name="info-outline" size={20} color={c.primary} />
            <Text style={[s.aboutText, { color: c.onSurface }]}>About GoDo</Text>
          </View>
          <Text style={[s.version, { color: c.outline }]}>v1.0.0 • Local-first AI Task Manager</Text>
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
  pageTitle: { fontSize: 32, fontWeight: '700', letterSpacing: -0.64 },
  pageSub: { fontSize: 16, marginBottom: 8 },
  section: { borderRadius: 12, padding: 16, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  sectionDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  providerRow: { flexDirection: 'row', padding: 4, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  providerBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  providerText: { fontSize: 12, fontWeight: '500', letterSpacing: 0.24 },
  inputLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 0.24, marginBottom: 4 },
  apiInput: { fontSize: 16, paddingVertical: 8, borderBottomWidth: 1 },
  keyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { fontSize: 16, fontWeight: '600' },
  clearBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  clearBtnText: { fontSize: 14, fontWeight: '500' },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  reminderLabel: { fontSize: 16 },
  reminderSub: { fontSize: 14, marginTop: 2 },
  reminderInput: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, paddingHorizontal: 8 },
  reminderValue: { width: 50, textAlign: 'center', fontSize: 18, fontWeight: '600', paddingVertical: 6 },
  reminderUnit: { fontSize: 12, fontWeight: '500', letterSpacing: 0.24 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  dataRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dataRowText: { fontSize: 16 },
  divider: { height: 1 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aboutText: { fontSize: 16 },
  version: { fontSize: 12, marginTop: 8 },
});
