import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';

import { HapticTab } from '../../components/haptic-tab';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

type TabEmojiProps = {
  emoji: string;
  focused: boolean;
};

function TabEmoji({ emoji, focused }: TabEmojiProps) {
  return (
    <Text
      style={{
        fontSize: focused ? 24 : 22,
        opacity: focused ? 1 : 0.45,
      }}
    >
      {emoji}
    </Text>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarButton: HapticTab,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🏠" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="games"
        options={{
          title: 'Jogos',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🎮" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Prêmios',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🎁" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🧸" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
