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
import { useAuth } from '@/src/hooks/useAuth';

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

type ActionCardProps = {
  icon: string;
  title: string;
  onPress: () => void;
  cardColor: string;
  textColor: string;
};

function ActionCard({ icon, title, onPress, cardColor, textColor }: ActionCardProps) {
  return (
    <Pressable style={[styles.actionCard, { backgroundColor: cardColor }]} onPress={onPress}>
      <Text style={styles.actionEmoji}>{icon}</Text>
      <Text style={[styles.actionLabel, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const router = useRouter();
  const { token, userId, username, balance, refreshBalance, refreshing } = useAuth();

  const displayName = username ?? (userId ? 'Usuário' : 'Usuário');
  const credits = balance;
  const balanceLabel = balance === null ? 'Carregando saldo...' : `R$ ${(credits ?? 0).toFixed(2)}`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.appName, { color: palette.primary }]}>🧸 TeddyCash</Text>
        <Text style={[styles.greeting, { color: palette.text }]}>
          {getGreeting()}, {displayName} 👋
        </Text>
        {token ? (
          <Pressable onPress={() => refreshBalance()} style={styles.refreshBtn} disabled={refreshing || balance === null}>
            <Text style={[styles.refreshText, { color: palette.primary }]}>
              {refreshing ? 'Atualizando...' : balance === null ? 'Saldo indisponível' : 'Atualizar saldo'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.balanceCard, { backgroundColor: palette.card }]}>
        <Text style={[styles.balanceLabel, { color: palette.softText }]}>Saldo</Text>
        <Text style={[styles.balanceValue, { color: palette.primary }]}> 
          {balanceLabel}
        </Text>

        <View style={[styles.divider, { backgroundColor: palette.softText + '33' }]} />

        <Text style={[styles.coinsValue, { color: palette.accent }]}> 
          💳 {balance === null ? 'Carregando...' : `${credits} créditos`}
        </Text>

        <Pressable
          style={[styles.earnButton, { backgroundColor: palette.primary }]}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.earnButtonText}>+ Ganhar moedas</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text }]}>⚡ Acesso rápido</Text>

      <ActionCard
        icon="🎮"
        title="Jogar"
        onPress={() => router.push('/home')}
        cardColor={palette.card}
        textColor={palette.text}
      />
      
      <ActionCard
        icon="🕹️"
        title="Transferir para máquina"
        onPress={() => router.push('/transfer')}
        cardColor={palette.card}
        textColor={palette.text}
      />

      <ActionCard
        icon="📜"
        title="Histórico"
        onPress={() => router.push('/transactions')}
        cardColor={palette.card}
        textColor={palette.text}
      />

      <ActionCard
        icon="🎁"
        title="Prêmios"
        onPress={() => router.push('/home')}
        cardColor={palette.card}
        textColor={palette.text}
      />

      <ActionCard
        icon="📅"
        title="Check-in"
        onPress={() => router.push('/home')}
        cardColor={palette.card}
        textColor={palette.text}
      />

      <Text style={[styles.sectionTitle, { color: palette.text }]}>🔥 Prêmios em destaque</Text>

      <View style={[styles.rewardsCard, { backgroundColor: palette.card }]}>
        {FEATURED_REWARDS.map((reward, index) => (
          <View key={reward.label}>
              <Pressable style={styles.rewardRow} onPress={() => router.push('/home')}>
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
  refreshBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
  },
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
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