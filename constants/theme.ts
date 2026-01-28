// VAULT - Obsidian Lux Theme
// Monochromatic luxury: Black, Grey, White, Gold, Silver

export const theme = {
  colors: {
    // Black Palette
    black: {
      pure: '#000000',
      rich: '#050505',
      soft: '#0a0a0a',
      card: '#0f0f0f',
      elevated: '#141414',
    },
    
    // Grey Scale
    grey: {
      900: '#1a1a1a',
      800: '#2a2a2a',
      700: '#3a3a3a',
      600: '#4a4a4a',
      500: '#666666',
      400: '#888888',
      300: '#aaaaaa',
      200: '#cccccc',
      100: '#e5e5e5',
    },
    
    // White
    white: {
      pure: '#ffffff',
      soft: '#f5f5f5',
      muted: '#e0e0e0',
      60: 'rgba(255, 255, 255, 0.6)',
      40: 'rgba(255, 255, 255, 0.4)',
      20: 'rgba(255, 255, 255, 0.2)',
      10: 'rgba(255, 255, 255, 0.1)',
      5: 'rgba(255, 255, 255, 0.05)',
    },
    
    // Gold - Primary Accent
    gold: {
      primary: '#D4AF37',
      light: '#F4E4BA',
      dark: '#B8960C',
      muted: '#A89650',
      glow: 'rgba(212, 175, 55, 0.4)',
      subtle: 'rgba(212, 175, 55, 0.1)',
    },
    
    // Silver - Secondary Accent
    silver: {
      primary: '#C0C0C0',
      light: '#E8E8E8',
      dark: '#A8A8A8',
    },
    
    // Bronze - Tertiary
    bronze: {
      primary: '#CD853F',
      dark: '#8B5A2B',
    },
    
    // Copper - Quaternary
    copper: {
      primary: '#B87333',
      light: '#D4956A',
      dark: '#8B4513',
      glow: 'rgba(184, 115, 51, 0.4)',
      subtle: 'rgba(184, 115, 51, 0.1)',
    },
    
    // Brass - Quinary
    brass: {
      primary: '#B5A642',
      light: '#D4C76A',
      dark: '#8B7500',
      glow: 'rgba(181, 166, 66, 0.4)',
      subtle: 'rgba(181, 166, 66, 0.1)',
    },
    
    // Semantic (using gold/grey instead of green/red)
    semantic: {
      positive: '#D4AF37', // Gold for gains
      negative: '#666666', // Grey for losses
      warning: '#D4AF37',
      info: '#C0C0C0',
    },
  },
  
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
      '4xl': 28,
      '5xl': 32,
      '6xl': 40,
      hero: 44,
    },
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      wider: 1,
      widest: 2,
      ultra: 3,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },
  
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    gold: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    goldSubtle: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export type Theme = typeof theme;
export default theme;
