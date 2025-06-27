/**
 * Team Color Service
 * Manages dynamic team color theming throughout the app
 * Applies team-specific color schemes based on user preferences
 */

interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface TeamColorConfig {
  [teamId: string]: TeamColors;
}

/**
 * Sports team color configurations
 * Organized by league and team
 */
const TEAM_COLORS: TeamColorConfig = {
  // NFL Teams
  'cowboys': {
    primary: '#003594',
    secondary: '#869397',
    accent: '#003594',
  },
  'patriots': {
    primary: '#002244',
    secondary: '#C60C30',
    accent: '#B0B7BC',
  },
  'packers': {
    primary: '#203731',
    secondary: '#FFB612',
    accent: '#203731',
  },
  'chiefs': {
    primary: '#E31837',
    secondary: '#FFB81C',
    accent: '#E31837',
  },
  'steelers': {
    primary: '#FFB612',
    secondary: '#101820',
    accent: '#A5ACAF',
  },
  'giants': {
    primary: '#0B2265',
    secondary: '#A71930',
    accent: '#A5ACAF',
  },

  // NBA Teams
  'lakers': {
    primary: '#552583',
    secondary: '#FDB927',
    accent: '#552583',
  },
  'warriors': {
    primary: '#1D428A',
    secondary: '#FFC72C',
    accent: '#1D428A',
  },
  'celtics': {
    primary: '#007A33',
    secondary: '#BA9653',
    accent: '#963821',
  },
  'heat': {
    primary: '#98002E',
    secondary: '#F9A01B',
    accent: '#98002E',
  },
  'bulls': {
    primary: '#CE1141',
    secondary: '#000000',
    accent: '#CE1141',
  },
  'knicks': {
    primary: '#006BB6',
    secondary: '#F58426',
    accent: '#006BB6',
  },

  // MLB Teams
  'yankees': {
    primary: '#132448',
    secondary: '#C4CED4',
    accent: '#132448',
  },
  'dodgers': {
    primary: '#005A9C',
    secondary: '#EF3E42',
    accent: '#005A9C',
  },
  'redsox': {
    primary: '#BD3039',
    secondary: '#0C2340',
    accent: '#BD3039',
  },
  'cubs': {
    primary: '#0E3386',
    secondary: '#CC3433',
    accent: '#0E3386',
  },
  'astros': {
    primary: '#002D62',
    secondary: '#EB6E1F',
    accent: '#002D62',
  },
  'angels': {
    primary: '#BA0021',
    secondary: '#003263',
    accent: '#BA0021',
  },
};

/**
 * Apply team colors to CSS variables
 * Updates the global CSS custom properties for team theming
 */
function applyTeamColors(teamId: string): void {
  const colors = TEAM_COLORS[teamId.toLowerCase()];
  
  if (!colors) {
    console.warn(`Team colors not found for: ${teamId}`);
    return;
  }

  // Apply to CSS custom properties
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--team-primary', colors.primary);
    root.style.setProperty('--team-secondary', colors.secondary);
    root.style.setProperty('--team-accent', `${colors.primary}33`); // 20% opacity
  }
}

/**
 * Get team colors for a specific team
 */
function getTeamColors(teamId: string): TeamColors | null {
  return TEAM_COLORS[teamId.toLowerCase()] || null;
}

/**
 * Apply multiple team colors for mixed team scenarios
 * Creates a gradient or blended theme for users following multiple teams
 */
function applyMultiTeamColors(teamIds: string[]): void {
  if (teamIds.length === 0) return;
  
  if (teamIds.length === 1) {
    applyTeamColors(teamIds[0]);
    return;
  }

  // For multiple teams, use the first team's primary color
  // and create a gradient with the second team's color
  const primaryTeam = TEAM_COLORS[teamIds[0].toLowerCase()];
  const secondaryTeam = TEAM_COLORS[teamIds[1].toLowerCase()];
  
  if (primaryTeam && secondaryTeam && typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--team-primary', primaryTeam.primary);
    root.style.setProperty('--team-secondary', secondaryTeam.primary);
    root.style.setProperty('--team-accent', `${primaryTeam.primary}33`);
  }
}

/**
 * Reset to default theme colors
 */
function resetToDefaultColors(): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--team-primary', '#3B82F6');
    root.style.setProperty('--team-secondary', '#1E40AF');
    root.style.setProperty('--team-accent', '#DBEAFE');
  }
}

/**
 * Get contrast color for readability
 * Returns white or black based on the background color brightness
 */
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return white for dark colors, black for light colors
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

/**
 * Generate team color variants for different UI states
 */
function generateTeamColorVariants(teamId: string): {
  primary: string;
  secondary: string;
  accent: string;
  hover: string;
  active: string;
  text: string;
} | null {
  const colors = getTeamColors(teamId);
  if (!colors) return null;

  return {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    hover: adjustColorBrightness(colors.primary, -20),
    active: adjustColorBrightness(colors.primary, -40),
    text: getContrastColor(colors.primary),
  };
}

/**
 * Adjust color brightness
 * Helper function to create hover and active states
 */
function adjustColorBrightness(hexColor: string, percent: number): string {
  const num = parseInt(hexColor.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

export {
  applyTeamColors,
  getTeamColors,
  applyMultiTeamColors,
  resetToDefaultColors,
  getContrastColor,
  generateTeamColorVariants,
  TEAM_COLORS,
  type TeamColors,
}; 