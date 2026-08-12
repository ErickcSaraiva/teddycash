export interface ThemePalette {
  background: string;
  text: string;
  card: string;
  softText: string;
  primary: string;
  accent: string;
  border: string;
}

export const palettes: Record<string, ThemePalette> = {
  // Agora o tema "default" oficial do TeddyCash é o Dark com Roxo!
  default: {
    background: '#121214', // Fundo principal super escuro da sua tela de login
    text: '#FFFFFF',       // Títulos e textos em destaque (Branco)
    card: '#202024',       // Fundo dos cards e campos (Cinza escuro, como os botões de login)
    softText: '#8D8D99',   // Textos descritivos e subtítulos (Cinza médio)
    primary: '#8257E5',    // O Roxo vibrante (usado no topo e no link "Criar agora")
    accent: '#FFB800',     // Amarelo/Dourado (Para as moedas e detalhes do Teddy)
    border: '#323238',     // Linhas sutis, como a da divisão "ou"
  }
};

// Função mágica que pega o nome do tema (ex: "default") e devolve as cores reais
export const getPalette = (themeName: string): ThemePalette => {
  return palettes[themeName] || palettes['default'];
};
