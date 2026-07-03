// O ThemeContext hoje só entrega o NOME do tema vindo do backend
// (ex: "default"). Este arquivo mapeia esse nome para uma paleta de
// cores concreta. Se o backend mandar um tema que ainda não existe
// aqui, cai no fallback "default" — nunca quebra a tela.

export type ThemePalette = {
  background: string;
  card: string;
  cardAlt: string;
  primary: string;
  primaryText: string;
  accent: string;
  text: string;
  softText: string;
  danger: string;
  success: string;
};

const PALETTES: Record<string, ThemePalette> = {
  default: {
    background: '#F2F5FF',
    card: '#FFFFFF',
    cardAlt: '#E8EAFF',
    primary: '#3D5AFE',
    primaryText: '#FFFFFF',
    accent: '#F5A96B',
    text: '#1F2937',
    softText: '#6B7280',
    danger: '#EF4444',
    success: '#22C55E',
  },
  // Exemplo de como um tema sazonal entraria no dia em que o
  // backend passar a devolver "particles"/"theme" diferentes.
  dark: {
    background: '#0F1113',
    card: '#15181A',
    cardAlt: '#0C0D0E',
    primary: '#8AC6FF',
    primaryText: '#0F1113',
    accent: '#F5A96B',
    text: '#FFFFFF',
    softText: '#BFC7CD',
    danger: '#F87171',
    success: '#4ADE80',
  },
};

export function getPalette(themeName: string): ThemePalette {
  return PALETTES[themeName] ?? PALETTES.default;
}