import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ResolvedSeasonalTheme } from '../../theme/seasonalCampaigns';

type Props = {
  campaign: ResolvedSeasonalTheme;
  reduceMotion: boolean;
  isPreview: boolean;
  onCallToAction?: () => void;
};

export function SeasonalCampaignBanner({ campaign, reduceMotion, isPreview, onCallToAction }: Props) {
  if (campaign.isDefault) return null;
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${campaign.name}. ${campaign.title}. ${campaign.subtitle}`}
      style={[styles.container, { backgroundColor: campaign.colors.background, borderColor: campaign.colors.border }]}
    >
      <Text accessibilityElementsHidden style={styles.emoji}>{campaign.artwork.value}</Text>
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: campaign.colors.accent }]}>{campaign.name}{isPreview ? ' · simulação' : ''}</Text>
        <Text style={[styles.title, { color: campaign.colors.text }]}>{campaign.title}</Text>
        <Text style={[styles.subtitle, { color: campaign.colors.text }]}>{campaign.subtitle}</Text>
        {campaign.promotion ? <Text style={[styles.promotion, { color: campaign.colors.accent }]}>{campaign.promotion.message} Confirmação pelo servidor.</Text> : null}
        {campaign.callToAction && onCallToAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${campaign.callToAction.label} — ${campaign.name}`}
            onPress={onCallToAction}
            style={({ pressed }) => [styles.button, { borderColor: campaign.colors.accent, opacity: pressed && !reduceMotion ? 0.75 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: campaign.colors.accent }]}>{campaign.callToAction.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start' },
  emoji: { fontSize: 38, marginRight: 14 }, content: { flex: 1 }, eyebrow: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 20, fontWeight: '800', marginTop: 4 }, subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4, opacity: 0.92 },
  promotion: { fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 8 },
  button: { minHeight: 44, borderWidth: 1, borderRadius: 12, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 14, marginTop: 12 },
  buttonText: { fontWeight: '800' },
});
