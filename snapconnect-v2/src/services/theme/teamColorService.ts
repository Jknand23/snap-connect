/**
 * Team Color Service
 * Manages dynamic team color theming throughout the app
 * Applies team-specific color schemes based on user preferences
 * 
 * Updated with complete team coverage for all major leagues:
 * - MLB (30 teams)
 * - NBA (30 teams) 
 * - NFL (32 teams)
 * - NHL (32 teams)
 */

interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface TeamColorConfig {
  [teamKey: string]: TeamColors;
}

/**
 * Sports team color configurations
 * Organized by league and team abbreviation for better lookup performance
 */
const TEAM_COLORS: TeamColorConfig = {
  // =============================================================================
  // NFL TEAMS (32 teams)
  // =============================================================================
  
  // AFC East
  'buf_nfl': { primary: '#00338D', secondary: '#C60C30', accent: '#00338D' },
  'mia_nfl': { primary: '#008E97', secondary: '#FC4C02', accent: '#008E97' },
  'ne_nfl': { primary: '#002244', secondary: '#C60C30', accent: '#002244' },
  'nyj_nfl': { primary: '#125740', secondary: '#000000', accent: '#125740' },
  
  // AFC North
  'bal_nfl': { primary: '#241773', secondary: '#000000', accent: '#241773' },
  'cin_nfl': { primary: '#FB4F14', secondary: '#000000', accent: '#FB4F14' },
  'cle_nfl': { primary: '#311D00', secondary: '#FF3C00', accent: '#311D00' },
  'pit_nfl': { primary: '#FFB612', secondary: '#101820', accent: '#FFB612' },
  
  // AFC South
  'hou_nfl': { primary: '#03202F', secondary: '#A71930', accent: '#03202F' },
  'ind_nfl': { primary: '#002C5F', secondary: '#A2AAAD', accent: '#002C5F' },
  'jax_nfl': { primary: '#006778', secondary: '#9F792C', accent: '#006778' },
  'ten_nfl': { primary: '#0C2340', secondary: '#4B92DB', accent: '#0C2340' },
  
  // AFC West
  'den_nfl': { primary: '#FB4F14', secondary: '#002244', accent: '#FB4F14' },
  'kc_nfl': { primary: '#E31837', secondary: '#FFB612', accent: '#E31837' },
  'lv_nfl': { primary: '#000000', secondary: '#A5ACAF', accent: '#000000' },
  'lac_nfl': { primary: '#0080C6', secondary: '#FFC20E', accent: '#0080C6' },
  
  // NFC East
  'dal_nfl': { primary: '#003594', secondary: '#041E42', accent: '#003594' },
  'nyg_nfl': { primary: '#0B2265', secondary: '#A71930', accent: '#0B2265' },
  'phi_nfl': { primary: '#004C54', secondary: '#A5ACAF', accent: '#004C54' },
  'was_nfl': { primary: '#5A1414', secondary: '#FFB612', accent: '#5A1414' },
  
  // NFC North
  'chi_nfl': { primary: '#0B162A', secondary: '#C83803', accent: '#0B162A' },
  'det_nfl': { primary: '#0076B6', secondary: '#B0B7BC', accent: '#0076B6' },
  'gb_nfl': { primary: '#203731', secondary: '#FFB612', accent: '#203731' },
  'min_nfl': { primary: '#4F2683', secondary: '#FFC62F', accent: '#4F2683' },
  
  // NFC South
  'atl_nfl': { primary: '#A71930', secondary: '#000000', accent: '#A71930' },
  'car_nfl': { primary: '#0085CA', secondary: '#101820', accent: '#0085CA' },
  'no_nfl': { primary: '#D3BC8D', secondary: '#101820', accent: '#D3BC8D' },
  'tb_nfl': { primary: '#D50A0A', secondary: '#FF7900', accent: '#D50A0A' },
  
  // NFC West
  'ari_nfl': { primary: '#97233F', secondary: '#000000', accent: '#97233F' },
  'lar_nfl': { primary: '#003594', secondary: '#FFA300', accent: '#003594' },
  'sf_nfl': { primary: '#AA0000', secondary: '#B3995D', accent: '#AA0000' },
  'sea_nfl': { primary: '#002244', secondary: '#69BE28', accent: '#002244' },

  // =============================================================================
  // NBA TEAMS (30 teams)
  // =============================================================================
  
  // Eastern Conference - Atlantic Division
  'bos_nba': { primary: '#007A33', secondary: '#BA9653', accent: '#007A33' },
  'bkn_nba': { primary: '#000000', secondary: '#FFFFFF', accent: '#000000' },
  'nyk_nba': { primary: '#006BB6', secondary: '#F58426', accent: '#006BB6' },
  'phi_nba': { primary: '#006BB6', secondary: '#ED174C', accent: '#006BB6' },
  'tor_nba': { primary: '#CE1141', secondary: '#000000', accent: '#CE1141' },
  
  // Eastern Conference - Central Division
  'chi_nba': { primary: '#CE1141', secondary: '#000000', accent: '#CE1141' },
  'cle_nba': { primary: '#6F263D', secondary: '#FFB81C', accent: '#6F263D' },
  'det_nba': { primary: '#C8102E', secondary: '#1D42BA', accent: '#C8102E' },
  'ind_nba': { primary: '#FDBB30', secondary: '#002D62', accent: '#FDBB30' },
  'mil_nba': { primary: '#00471B', secondary: '#EEE1C6', accent: '#00471B' },
  
  // Eastern Conference - Southeast Division
  'atl_nba': { primary: '#E03A3E', secondary: '#C1D32F', accent: '#E03A3E' },
  'cha_nba': { primary: '#1D1160', secondary: '#00788C', accent: '#1D1160' },
  'mia_nba': { primary: '#98002E', secondary: '#F9A01B', accent: '#98002E' },
  'orl_nba': { primary: '#0077C0', secondary: '#C4CED4', accent: '#0077C0' },
  'was_nba': { primary: '#002B5C', secondary: '#E31837', accent: '#002B5C' },
  
  // Western Conference - Northwest Division
  'den_nba': { primary: '#0E2240', secondary: '#FEC524', accent: '#0E2240' },
  'min_nba': { primary: '#0C2340', secondary: '#236192', accent: '#0C2340' },
  'okc_nba': { primary: '#007AC1', secondary: '#EF3B24', accent: '#007AC1' },
  'por_nba': { primary: '#E03A3E', secondary: '#000000', accent: '#E03A3E' },
  'uta_nba': { primary: '#002B5C', secondary: '#00471B', accent: '#002B5C' },
  
  // Western Conference - Pacific Division
  'gsw_nba': { primary: '#1D428A', secondary: '#FFC72C', accent: '#1D428A' },
  'lac_nba': { primary: '#C8102E', secondary: '#1D428A', accent: '#C8102E' },
  'lal_nba': { primary: '#552583', secondary: '#FDB927', accent: '#552583' },
  'phx_nba': { primary: '#1D1160', secondary: '#E56020', accent: '#1D1160' },
  'sac_nba': { primary: '#5A2D81', secondary: '#63727A', accent: '#5A2D81' },
  
  // Western Conference - Southwest Division
  'dal_nba': { primary: '#00538C', secondary: '#002F65', accent: '#00538C' },
  'hou_nba': { primary: '#CE1141', secondary: '#000000', accent: '#CE1141' },
  'mem_nba': { primary: '#5D76A9', secondary: '#12173F', accent: '#5D76A9' },
  'no_nba': { primary: '#0C2340', secondary: '#C8102E', accent: '#0C2340' },
  'sa_nba': { primary: '#C4CED4', secondary: '#000000', accent: '#C4CED4' },

  // =============================================================================
  // MLB TEAMS (30 teams)
  // =============================================================================
  
  // American League East
  'bal_mlb': { primary: '#DF4601', secondary: '#000000', accent: '#DF4601' },
  'bos_mlb': { primary: '#BD3039', secondary: '#0C2340', accent: '#BD3039' },
  'nyy_mlb': { primary: '#132448', secondary: '#C4CED4', accent: '#132448' },
  'tb_mlb': { primary: '#092C5C', secondary: '#8FBCE6', accent: '#092C5C' },
  'tor_mlb': { primary: '#134A8E', secondary: '#1D2D5C', accent: '#134A8E' },
  
  // American League Central
  'chi_mlb': { primary: '#27251F', secondary: '#C4CED4', accent: '#27251F' },
  'cle_mlb': { primary: '#E31937', secondary: '#0C2340', accent: '#E31937' },
  'det_mlb': { primary: '#0C2340', secondary: '#FA4616', accent: '#0C2340' },
  'kc_mlb': { primary: '#004687', secondary: '#BD9B60', accent: '#004687' },
  'min_mlb': { primary: '#002B5C', secondary: '#D31145', accent: '#002B5C' },
  
  // American League West
  'hou_mlb': { primary: '#002D62', secondary: '#EB6E1F', accent: '#002D62' },
  'laa_mlb': { primary: '#BA0021', secondary: '#003263', accent: '#BA0021' },
  'oak_mlb': { primary: '#003831', secondary: '#EFB21E', accent: '#003831' },
  'sea_mlb': { primary: '#0C2C56', secondary: '#005C5C', accent: '#0C2C56' },
  'tex_mlb': { primary: '#003278', secondary: '#C0111F', accent: '#003278' },
  
  // National League East
  'atl_mlb': { primary: '#CE1141', secondary: '#13274F', accent: '#CE1141' },
  'mia_mlb': { primary: '#00A3E0', secondary: '#EF3340', accent: '#00A3E0' },
  'nym_mlb': { primary: '#002D72', secondary: '#FF5910', accent: '#002D72' },
  'phi_mlb': { primary: '#E81828', secondary: '#002D72', accent: '#E81828' },
  'wsh_mlb': { primary: '#AB0003', secondary: '#14225A', accent: '#AB0003' },
  
  // National League Central
  'chc_mlb': { primary: '#0E3386', secondary: '#CC3433', accent: '#0E3386' },
  'cin_mlb': { primary: '#C6011F', secondary: '#000000', accent: '#C6011F' },
  'mil_mlb': { primary: '#12284B', secondary: '#FFC52F', accent: '#12284B' },
  'pit_mlb': { primary: '#FDB827', secondary: '#27251F', accent: '#FDB827' },
  'stl_mlb': { primary: '#C41E3A', secondary: '#FEDB00', accent: '#C41E3A' },
  
  // National League West
  'ari_mlb': { primary: '#A71930', secondary: '#000000', accent: '#A71930' },
  'col_mlb': { primary: '#33006F', secondary: '#C4CED4', accent: '#33006F' },
  'lad_mlb': { primary: '#005A9C', secondary: '#EF3E42', accent: '#005A9C' },
  'sd_mlb': { primary: '#2F241D', secondary: '#FFC425', accent: '#2F241D' },
  'sf_mlb': { primary: '#FD5A1E', secondary: '#27251F', accent: '#FD5A1E' },

  // =============================================================================
  // NHL TEAMS (32 teams)
  // =============================================================================
  
  // Atlantic Division
  'bos_nhl': { primary: '#FFB81C', secondary: '#000000', accent: '#FFB81C' },
  'buf_nhl': { primary: '#002654', secondary: '#FCB514', accent: '#002654' },
  'det_nhl': { primary: '#CE1126', secondary: '#FFFFFF', accent: '#CE1126' },
  'fla_nhl': { primary: '#041E42', secondary: '#C8102E', accent: '#041E42' },
  'mtl_nhl': { primary: '#AF1E2D', secondary: '#192168', accent: '#AF1E2D' },
  'ott_nhl': { primary: '#C52032', secondary: '#C2912C', accent: '#C52032' },
  'tb_nhl': { primary: '#002868', secondary: '#FFFFFF', accent: '#002868' },
  'tor_nhl': { primary: '#003E7E', secondary: '#FFFFFF', accent: '#003E7E' },
  
  // Metropolitan Division
  'car_nhl': { primary: '#CC0000', secondary: '#000000', accent: '#CC0000' },
  'cbj_nhl': { primary: '#002654', secondary: '#CE1126', accent: '#002654' },
  'nj_nhl': { primary: '#CE1126', secondary: '#000000', accent: '#CE1126' },
  'nyi_nhl': { primary: '#00539B', secondary: '#F47D30', accent: '#00539B' },
  'nyr_nhl': { primary: '#0038A8', secondary: '#CE1126', accent: '#0038A8' },
  'phi_nhl': { primary: '#F74902', secondary: '#000000', accent: '#F74902' },
  'pit_nhl': { primary: '#000000', secondary: '#CFC493', accent: '#000000' },
  'was_nhl': { primary: '#041E42', secondary: '#C8102E', accent: '#041E42' },
  
  // Central Division
  'ari_nhl': { primary: '#8C2633', secondary: '#E2D6B5', accent: '#8C2633' },
  'chi_nhl': { primary: '#CF0A2C', secondary: '#000000', accent: '#CF0A2C' },
  'col_nhl': { primary: '#6F263D', secondary: '#236192', accent: '#6F263D' },
  'dal_nhl': { primary: '#006847', secondary: '#8F8F8C', accent: '#006847' },
  'min_nhl': { primary: '#154734', secondary: '#A6192E', accent: '#154734' },
  'nsh_nhl': { primary: '#FFB81C', secondary: '#041E42', accent: '#FFB81C' },
  'stl_nhl': { primary: '#002F87', secondary: '#FCB514', accent: '#002F87' },
  'wpg_nhl': { primary: '#041E42', secondary: '#004C97', accent: '#041E42' },
  
  // Pacific Division
  'ana_nhl': { primary: '#F47A38', secondary: '#B9975B', accent: '#F47A38' },
  'cgy_nhl': { primary: '#C8102E', secondary: '#F1BE48', accent: '#C8102E' },
  'edm_nhl': { primary: '#041E42', secondary: '#FF4C00', accent: '#041E42' },
  'la_nhl': { primary: '#111111', secondary: '#A2AAAD', accent: '#111111' },
  'sj_nhl': { primary: '#006D75', secondary: '#EA7200', accent: '#006D75' },
  'sea_nhl': { primary: '#001628', secondary: '#99D9D9', accent: '#001628' },
  'van_nhl': { primary: '#001F5B', secondary: '#00843D', accent: '#001F5B' },
  'vgk_nhl': { primary: '#B4975A', secondary: '#333F42', accent: '#B4975A' },
};

/**
 * Get team colors by team abbreviation and league
 */
function getTeamColors(abbreviation: string, league: string): TeamColors | null {
  const teamKey = `${abbreviation.toLowerCase()}_${league.toLowerCase()}`;
  return TEAM_COLORS[teamKey] || null;
}

/**
 * Get team colors by team ID (requires database lookup)
 */
async function getTeamColorsById(teamId: string): Promise<TeamColors | null> {
  // This would require importing the teams service to fetch team data
  // For now, return null - implement when needed
  return null;
}

/**
 * Apply team colors to the current theme
 */
function applyTeamColors(abbreviation: string, league: string): void {
  const colors = getTeamColors(abbreviation, league);
  
  if (colors && typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--team-primary', colors.primary);
    root.style.setProperty('--team-secondary', colors.secondary);
    root.style.setProperty('--team-accent', colors.accent);
  }
}

/**
 * Apply multiple team colors for mixed team scenarios
 * Creates a gradient or blended theme for users following multiple teams
 */
function applyMultiTeamColors(teams: Array<{abbreviation: string, league: string}>): void {
  if (teams.length === 0) return;
  
  if (teams.length === 1) {
    applyTeamColors(teams[0].abbreviation, teams[0].league);
    return;
  }

  // For multiple teams, use the first team's primary color
  // and create a gradient with the second team's color
  const primaryTeam = getTeamColors(teams[0].abbreviation, teams[0].league);
  const secondaryTeam = getTeamColors(teams[1].abbreviation, teams[1].league);
  
  if (primaryTeam && secondaryTeam && typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--team-primary', primaryTeam.primary);
    root.style.setProperty('--team-secondary', secondaryTeam.primary);
    root.style.setProperty('--team-accent', `${primaryTeam.primary}33`);
  }
}

/**
 * Get all available teams with colors
 */
function getAllTeamColors(): {[key: string]: TeamColors} {
  return TEAM_COLORS;
}

/**
 * Reset team colors to default theme
 */
function resetTeamColors(): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.removeProperty('--team-primary');
    root.style.removeProperty('--team-secondary');
    root.style.removeProperty('--team-accent');
  }
}

/**
 * Create team color CSS variables for a specific team
 */
function createTeamColorVars(abbreviation: string, league: string): Record<string, string> {
  const colors = getTeamColors(abbreviation, league);
  
  if (!colors) {
    return {};
  }
  
  return {
    '--team-primary': colors.primary,
    '--team-secondary': colors.secondary,
    '--team-accent': colors.accent,
  };
}

export {
  type TeamColors,
  getTeamColors,
  getTeamColorsById,
  applyTeamColors,
  applyMultiTeamColors,
  getAllTeamColors,
  resetTeamColors,
  createTeamColorVars,
}; 