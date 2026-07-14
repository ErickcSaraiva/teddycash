import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';

// ─── Placeholders — substituir por useAuth() quando o backend estiver integrado
const user = {
  name: 'Erick',
};

const wallet = {
  balance: 0,
  coins: 0,
};
// ────────────────────────────────────────────────────────────────────────────

const FEATURED_REWARDS = [
  { emoji: '💳', label: 'Pix' },
  { emoji: '🎮', label: 'Steam' },
  { emoji: '🎁', label: 'Google Play' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─── Componente reutilizável ────────────────────────────────────────────────
type ActionCardProps = {
  icon: string;
  title: string;
  onPress: () => void;
  cardColor: string;
  textColor: string;
};

function ActionCard({ icon, title, onPress, cardColor, textColor }: ActionCardProps) {
  return (
    <Pressable
      style={[styles.actionCard, { backgroundColor: cardColor }]}
      onPress={onPress}
    >
      <Text style={styles.actionEmoji}>{icon}</Text>
      <Text style={[styles.actionLabel, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.appName, { color: palette.primary }]}>🧸 TeddyCash</Text>
        <Text style={[styles.greeting, { color: palette.text }]}>
          {getGreeting()}, {user.name} 👋
        </Text>
      </View>

      {/* ── Card de Saldo ── */}
      <View style={[styles.balanceCard, { backgroundColor: palette.card }]}>
        <Text style={[styles.balanceLabel, { color: palette.softText }]}>Saldo</Text>
        <Text style={[styles.balanceValue, { color: palette.primary }]}>
          R$ {wallet.balance.toFixed(2)}
        </Text>

        <View style={[styles.divider, { backgroundColor: palette.softText + '33' }]} />

        <Text style={[styles.coinsValue, { color: palette.accent }]}>
          🪙 {wallet.coins} moedas
        </Text>

        <Pressable
          style={[styles.earnButton, { backgroundColor: palette.primary }]}
          onPress={() => router.push('/(tabs)/games')}
        >
          <Text style={styles.earnButtonText}>+ Ganhar moedas</Text>
        </Pressable>
      </View>

      {/* ── Acesso Rápido ── */}
      <Text style={[styles.sectionTitle, { color: palette.text }]}>⚡ Acesso rápido</Text>

      <ActionCard
        icon="🎮"
        title="Jogar"
        onPress={() => router.push('/(tabs)/games')}
        cardColor={palette.card}
        textColor={palette.text}
      />
      <ActionCard
        icon="🎁"
        title="Prêmios"
        onPress={() => router.push('/(tabs)/rewards')}
        cardColor={palette.card}
        textColor={palette.text}
      />
      <ActionCard
        icon="📅"
        title="Check-in"
        onPress={() => router.push('/checkin')}
        cardColor={palette.card}
        textColor={palette.text}
      />

      {/* ── Prêmios em Destaque ── */}
      <Text style={[styles.sectionTitle, { color: palette.text }]}>🔥 Prêmios em destaque</Text>

      <View style={[styles.rewardsCard, { backgroundColor: palette.card }]}>
        {FEATURED_REWARDS.map((reward, index) => (
          <View key={reward.label}>
            <Pressable
              style={styles.rewardRow}
              onPress={() => router.push('/(tabs)/rewards')}
            >
              <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
              <Text style={[styles.rewardLabel, { color: palette.text }]}>{reward.label}</Text>
              <Text style={[styles.rewardArrow, { color: palette.softText }]}>›</Text>
            </Pressable>
            {index < FEATURED_REWARDS.length - 1 && (
              <View style={[styles.rewardDivider, { backgroundColor: palette.softText + '22' }]} />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    marginTop: 60,
    marginBottom: 24,
  },
  appName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
  },

  // Saldo
  balanceCard: {
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 32,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  coinsValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  earnButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  earnButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },

  // Seção
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Action Cards
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 22,
    marginRight: 14,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Prêmios em destaque
  rewardsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  rewardEmoji: {
    fontSize: 22,
    marginRight: 14,
  },
  rewardLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  rewardArrow: {
    fontSize: 22,
    fontWeight: '300',
  },
  rewardDivider: {
    height: 1,
    marginHorizontal: 20,
  },
});