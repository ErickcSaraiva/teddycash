import React, { createContext, useContext, useState, useEffect } from 'react';

// Aqui definimos a estrutura do teu Live-Ops, agora com o estado de 'loading'
type ThemeContextData = {
  theme: string;
  particles: string;
  isLoading: boolean;
};

// Criamos o contexto já com valores iniciais seguros
const ThemeContext = createContext<ThemeContextData>({
  theme: 'default',
  particles: 'none',
  isLoading: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState('default');
  const [particles, setParticles] = useState('none');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // O FUTURO É AGORA: Fazendo a chamada real ao teu Backend Node.js!
    // NOTA: Se fores testar no telemóvel físico, troca 'localhost' pelo IP do teu computador.
    fetch('http://192.168.101.13:8000/settings/current-theme')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setTheme(data.theme);
          setParticles(data.particles);
        }
      })
      .catch(error => {
        console.error("Erro ao carregar o Live-Ops. A usar tema default.", error);
      })
      .finally(() => {
        setIsLoading(false); // Avisa a aplicação que já terminámos de buscar os dados
      });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, particles, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

// O teu Custom Hook incrível! Vamos usá-lo no App.tsx
export const useTheme = () => useContext(ThemeContext);