import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import {
  resolveCampaignDate, selectSeasonalCampaign, type ResolvedSeasonalTheme,
} from '../theme/seasonalCampaigns';

type ThemeContextData = {
  theme: 'default';
  particles: 'none';
  isLoading: boolean;
  campaign: ResolvedSeasonalTheme;
  reduceMotion: boolean;
  isCampaignPreview: boolean;
};

const ThemeContext = createContext<ThemeContextData>({
  theme: 'default', particles: 'none', isLoading: true,
  campaign: selectSeasonalCampaign(), reduceMotion: false, isCampaignPreview: false,
});

const previewDate = __DEV__ ? process.env.EXPO_PUBLIC_CAMPAIGN_PREVIEW_DATE : undefined;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [now, setNow] = useState(() => resolveCampaignDate(previewDate));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const motionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !previewDate) setNow(new Date());
    });
    const timer = previewDate ? undefined : setInterval(() => setNow(new Date()), 60_000);
    return () => {
      motionSubscription.remove(); appStateSubscription.remove();
      if (timer) clearInterval(timer);
    };
  }, []);

  const value = useMemo<ThemeContextData>(() => ({
    theme: 'default', particles: 'none', isLoading: false,
    campaign: selectSeasonalCampaign(now), reduceMotion, isCampaignPreview: Boolean(previewDate),
  }), [now, reduceMotion]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
