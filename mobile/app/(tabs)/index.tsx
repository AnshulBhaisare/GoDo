import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useChatStore } from '../../src/stores/chatStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { ChatBubble } from '../../src/components/ChatBubble';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/constants/theme';
import { ChatMessage } from '../../src/types';

const SUGGESTIONS = ["Today's tasks", 'Pending tasks', 'Add reminder'];

export default function ChatScreen() {
  const router = useRouter();
  const settings = useSettingsStore();
  const c = Colors[settings.theme === 'dark' ? 'dark' : 'light'];
  const { messages, isAIResponding, sendMessage } = useChatStore();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isAIResponding) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    sendMessage(text);
  }, [inputText, isAIResponding, sendMessage]);

  const handleSuggestion = useCallback((suggestion: string) => {
    if (isAIResponding) return;
    sendMessage(suggestion);
  }, [isAIResponding, sendMessage]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <ChatBubble message={item} />
  ), []);

  const renderEmpty = useCallback(() => (
    <View style={s.emptyContainer}>
      <View style={[s.emptyIcon, { backgroundColor: c.surfaceContainer }]}>
        <MaterialIcons name="auto-awesome" size={32} color={c.primary} />
      </View>
      <Text style={[s.emptyTitle, { color: c.onSurface }]}>Hey there! 👋</Text>
      <Text style={[s.emptySubtitle, { color: c.onSurfaceVariant }]}>
        Tell me what you need to do and I'll help you stay on track.
      </Text>
    </View>
  ), [c]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: c.background + 'CC' }]}>
        <Pressable 
          onPress={() => settings.setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          style={[s.profilePic, { backgroundColor: c.surfaceContainer, borderColor: c.surfaceVariant }]}
        >
          <MaterialIcons name={settings.theme === 'dark' ? 'light-mode' : 'dark-mode'} size={18} color={c.onSurfaceVariant} />
        </Pressable>
        <Text style={[s.headerTitle, { color: c.primary }]}>godo</Text>
        <Pressable style={s.headerBtn} onPress={() => router.push('/notifications')}>
          <MaterialIcons name="notifications-none" size={24} color={c.onSurfaceVariant} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.messageList}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Typing indicator */}
        {isAIResponding && (
          <View style={s.typingWrap}>
            <View style={[s.typingDot, { backgroundColor: c.primary }]} />
            <View style={[s.typingDot, { backgroundColor: c.primary, opacity: 0.6 }]} />
            <View style={[s.typingDot, { backgroundColor: c.primary, opacity: 0.3 }]} />
          </View>
        )}

        {/* Input area */}
        <View style={[s.inputArea, { backgroundColor: c.background + 'E6', borderTopColor: c.surfaceVariant + '4D', paddingBottom: isKeyboardVisible ? 12 : (Platform.OS === 'ios' ? 90 : 74) }]}>
          {/* Suggestion chips */}
          <FlatList
            horizontal
            data={SUGGESTIONS}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSuggestion(item)}
                style={[s.chip, { backgroundColor: c.surface, borderColor: c.outlineVariant + '66' }]}
              >
                {item === 'Add reminder' && <MaterialIcons name="add" size={14} color={c.primary} />}
                <Text style={[s.chipText, item === 'Add reminder' ? { color: c.primary } : { color: c.onSurfaceVariant }]}>{item}</Text>
              </Pressable>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsRow}
          />

          {/* Text input */}
          <View style={[s.inputRow, { backgroundColor: c.surface, borderColor: c.outlineVariant + '66' }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="What do you want to do today?"
              placeholderTextColor={c.outline}
              style={[s.textInput, { color: c.onSurface }]}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || isAIResponding}
              style={[s.sendBtn, { backgroundColor: inputText.trim() ? c.primary : c.outlineVariant, opacity: isAIResponding ? 0.5 : 1 }]}
            >
              {isAIResponding ? (
                <ActivityIndicator size="small" color={c.onPrimary} />
              ) : (
                <MaterialIcons name="arrow-upward" size={20} color={c.onPrimary} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, zIndex: 50 },
  profilePic: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.24 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  messageList: { paddingTop: 8, paddingBottom: 8, flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 120 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  typingWrap: { flexDirection: 'row', gap: 4, paddingHorizontal: 60, paddingVertical: 8 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  inputArea: { paddingHorizontal: 20, paddingTop: 8, borderTopWidth: 0.5, gap: 12 },
  chipsRow: { gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  chipText: { fontSize: 12, fontWeight: '500' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderRadius: 16, borderWidth: 1, padding: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  textInput: { flex: 1, fontSize: 16, paddingHorizontal: 12, paddingVertical: 10, maxHeight: 100, minHeight: 44 },
  sendBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', margin: 2 },
});
