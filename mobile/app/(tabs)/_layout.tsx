import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { Colors } from '../../src/constants/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function TabLayout() {
  const theme = useSettingsStore(state => state.theme);
  const c = Colors[theme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.outline,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: c.surface + 'CC',
          borderTopWidth: 0.5,
          borderTopColor: c.outlineVariant + '33',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name="chat-bubble" size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.primary, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name="check-circle" size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.primary, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name="calendar-today" size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.primary, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name="analytics" size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.primary, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="trash"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name="delete-sweep" size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.primary, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name="settings" size={24} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.primary, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
