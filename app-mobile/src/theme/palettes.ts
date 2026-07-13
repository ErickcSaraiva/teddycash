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
  },
  
  // Tema de Natal (mantido para o seu sistema de Live-Ops)
  christmas: {
    background: '#180A0A', // Um fundo escuro mais avermelhado
    text: '#FFFFFF',
    card: '#2A1616',
    softText: '#A08080',
    primary: '#E53935',    // Vermelho Natal
    accent: '#43A047',     // Verde Árvore
    border: '#3D2020',
  }
};

// Função mágica que pega o nome do tema (ex: "default") e devolve as cores reais
export const getPalette = (themeName: string): ThemePalette => {
  return palettes[themeName] || palettes['default'];
};