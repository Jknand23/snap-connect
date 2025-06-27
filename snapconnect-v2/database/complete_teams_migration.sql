-- Complete Teams Migration for SnapConnect V2
-- Adds all teams from MLB (30), NBA (30), NFL (32), and NHL (32)
-- Total: 124 teams across 4 major North American sports leagues

-- Insert all MLB teams (30 teams)
INSERT INTO public.teams (name, abbreviation, league, city, primary_color, secondary_color, logo_url) 
SELECT * FROM (VALUES
  -- American League East
  ('Tampa Bay Rays', 'TB', 'MLB', 'St. Petersburg', '#092C5C', '#8FBCE6', ''),
  ('Toronto Blue Jays', 'TOR', 'MLB', 'Toronto', '#134A8E', '#1D2D5C', ''),
  ('Baltimore Orioles', 'BAL', 'MLB', 'Baltimore', '#DF4601', '#000000', ''),
  
  -- American League Central
  ('Chicago White Sox', 'CWS', 'MLB', 'Chicago', '#27251F', '#C4CED4', ''),
  ('Cleveland Guardians', 'CLE', 'MLB', 'Cleveland', '#E31937', '#0C2340', ''),
  ('Detroit Tigers', 'DET', 'MLB', 'Detroit', '#0C2340', '#FA4616', ''),
  ('Kansas City Royals', 'KC', 'MLB', 'Kansas City', '#004687', '#BD9B60', ''),
  ('Minnesota Twins', 'MIN', 'MLB', 'Minneapolis', '#002B5C', '#D31145', ''),
  
  -- American League West
  ('Houston Astros', 'HOU', 'MLB', 'Houston', '#002D62', '#EB6E1F', ''),
  ('Los Angeles Angels', 'LAA', 'MLB', 'Anaheim', '#BA0021', '#003263', ''),
  ('Oakland Athletics', 'OAK', 'MLB', 'Oakland', '#003831', '#EFB21E', ''),
  ('Seattle Mariners', 'SEA', 'MLB', 'Seattle', '#0C2C56', '#005C5C', ''),
  ('Texas Rangers', 'TEX', 'MLB', 'Arlington', '#003278', '#C0111F', ''),
  
  -- National League East
  ('Atlanta Braves', 'ATL', 'MLB', 'Atlanta', '#CE1141', '#13274F', ''),
  ('Miami Marlins', 'MIA', 'MLB', 'Miami', '#00A3E0', '#EF3340', ''),
  ('New York Mets', 'NYM', 'MLB', 'New York', '#002D72', '#FF5910', ''),
  ('Philadelphia Phillies', 'PHI', 'MLB', 'Philadelphia', '#E81828', '#002D72', ''),
  ('Washington Nationals', 'WSH', 'MLB', 'Washington', '#AB0003', '#14225A', ''),
  
  -- National League Central
  ('Chicago Cubs', 'CHC', 'MLB', 'Chicago', '#0E3386', '#CC3433', ''),
  ('Cincinnati Reds', 'CIN', 'MLB', 'Cincinnati', '#C6011F', '#000000', ''),
  ('Milwaukee Brewers', 'MIL', 'MLB', 'Milwaukee', '#12284B', '#FFC52F', ''),
  ('Pittsburgh Pirates', 'PIT', 'MLB', 'Pittsburgh', '#FDB827', '#27251F', ''),
  ('St. Louis Cardinals', 'STL', 'MLB', 'St. Louis', '#C41E3A', '#FEDB00', ''),
  
  -- National League West
  ('Arizona Diamondbacks', 'ARI', 'MLB', 'Phoenix', '#A71930', '#000000', ''),
  ('Colorado Rockies', 'COL', 'MLB', 'Denver', '#33006F', '#C4CED4', ''),
  ('San Diego Padres', 'SD', 'MLB', 'San Diego', '#2F241D', '#FFC425', ''),
  ('San Francisco Giants', 'SF', 'MLB', 'San Francisco', '#FD5A1E', '#27251F', '')
) AS teams_data(name, abbreviation, league, city, primary_color, secondary_color, logo_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teams 
  WHERE teams.name = teams_data.name
);

-- Insert all NBA teams (30 teams)
INSERT INTO public.teams (name, abbreviation, league, city, primary_color, secondary_color, logo_url) 
SELECT * FROM (VALUES
  -- Eastern Conference - Atlantic Division
  ('Brooklyn Nets', 'BKN', 'NBA', 'Brooklyn', '#000000', '#FFFFFF', ''),
  ('New York Knicks', 'NYK', 'NBA', 'New York', '#006BB6', '#F58426', ''),
  ('Philadelphia 76ers', 'PHI', 'NBA', 'Philadelphia', '#006BB6', '#ED174C', ''),
  ('Toronto Raptors', 'TOR', 'NBA', 'Toronto', '#CE1141', '#000000', ''),
  
  -- Eastern Conference - Central Division
  ('Chicago Bulls', 'CHI', 'NBA', 'Chicago', '#CE1141', '#000000', ''),
  ('Cleveland Cavaliers', 'CLE', 'NBA', 'Cleveland', '#6F263D', '#FFB81C', ''),
  ('Detroit Pistons', 'DET', 'NBA', 'Detroit', '#C8102E', '#1D42BA', ''),
  ('Indiana Pacers', 'IND', 'NBA', 'Indianapolis', '#FDBB30', '#002D62', ''),
  ('Milwaukee Bucks', 'MIL', 'NBA', 'Milwaukee', '#00471B', '#EEE1C6', ''),
  
  -- Eastern Conference - Southeast Division
  ('Atlanta Hawks', 'ATL', 'NBA', 'Atlanta', '#E03A3E', '#C1D32F', ''),
  ('Charlotte Hornets', 'CHA', 'NBA', 'Charlotte', '#1D1160', '#00788C', ''),
  ('Miami Heat', 'MIA', 'NBA', 'Miami', '#98002E', '#F9A01B', ''),
  ('Orlando Magic', 'ORL', 'NBA', 'Orlando', '#0077C0', '#C4CED4', ''),
  ('Washington Wizards', 'WAS', 'NBA', 'Washington', '#002B5C', '#E31837', ''),
  
  -- Western Conference - Northwest Division
  ('Denver Nuggets', 'DEN', 'NBA', 'Denver', '#0E2240', '#FEC524', ''),
  ('Minnesota Timberwolves', 'MIN', 'NBA', 'Minneapolis', '#0C2340', '#236192', ''),
  ('Oklahoma City Thunder', 'OKC', 'NBA', 'Oklahoma City', '#007AC1', '#EF3B24', ''),
  ('Portland Trail Blazers', 'POR', 'NBA', 'Portland', '#E03A3E', '#000000', ''),
  ('Utah Jazz', 'UTA', 'NBA', 'Salt Lake City', '#002B5C', '#00471B', ''),
  
  -- Western Conference - Pacific Division
  ('Golden State Warriors', 'GSW', 'NBA', 'San Francisco', '#1D428A', '#FFC72C', ''),
  ('Los Angeles Clippers', 'LAC', 'NBA', 'Los Angeles', '#C8102E', '#1D428A', ''),
  ('Phoenix Suns', 'PHX', 'NBA', 'Phoenix', '#1D1160', '#E56020', ''),
  ('Sacramento Kings', 'SAC', 'NBA', 'Sacramento', '#5A2D81', '#63727A', ''),
  
  -- Western Conference - Southwest Division
  ('Dallas Mavericks', 'DAL', 'NBA', 'Dallas', '#00538C', '#002F65', ''),
  ('Houston Rockets', 'HOU', 'NBA', 'Houston', '#CE1141', '#000000', ''),
  ('Memphis Grizzlies', 'MEM', 'NBA', 'Memphis', '#5D76A9', '#12173F', ''),
  ('New Orleans Pelicans', 'NO', 'NBA', 'New Orleans', '#0C2340', '#C8102E', ''),
  ('San Antonio Spurs', 'SA', 'NBA', 'San Antonio', '#C4CED4', '#000000', '')
) AS teams_data(name, abbreviation, league, city, primary_color, secondary_color, logo_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teams 
  WHERE teams.name = teams_data.name
);

-- Insert all NFL teams (32 teams)
INSERT INTO public.teams (name, abbreviation, league, city, primary_color, secondary_color, logo_url) 
SELECT * FROM (VALUES
  -- AFC East
  ('Miami Dolphins', 'MIA', 'NFL', 'Miami Gardens', '#008E97', '#FC4C02', ''),
  ('New England Patriots', 'NE', 'NFL', 'Foxborough', '#002244', '#C60C30', ''),
  ('New York Jets', 'NYJ', 'NFL', 'East Rutherford', '#125740', '#000000', ''),
  
  -- AFC North
  ('Baltimore Ravens', 'BAL', 'NFL', 'Baltimore', '#241773', '#000000', ''),
  ('Cincinnati Bengals', 'CIN', 'NFL', 'Cincinnati', '#FB4F14', '#000000', ''),
  ('Cleveland Browns', 'CLE', 'NFL', 'Cleveland', '#311D00', '#FF3C00', ''),
  ('Pittsburgh Steelers', 'PIT', 'NFL', 'Pittsburgh', '#FFB612', '#101820', ''),
  
  -- AFC South
  ('Houston Texans', 'HOU', 'NFL', 'Houston', '#03202F', '#A71930', ''),
  ('Indianapolis Colts', 'IND', 'NFL', 'Indianapolis', '#002C5F', '#A2AAAD', ''),
  ('Jacksonville Jaguars', 'JAX', 'NFL', 'Jacksonville', '#006778', '#9F792C', ''),
  ('Tennessee Titans', 'TEN', 'NFL', 'Nashville', '#0C2340', '#4B92DB', ''),
  
  -- AFC West
  ('Denver Broncos', 'DEN', 'NFL', 'Denver', '#FB4F14', '#002244', ''),
  ('Las Vegas Raiders', 'LV', 'NFL', 'Las Vegas', '#000000', '#A5ACAF', ''),
  ('Los Angeles Chargers', 'LAC', 'NFL', 'Los Angeles', '#0080C6', '#FFC20E', ''),
  
  -- NFC East
  ('Dallas Cowboys', 'DAL', 'NFL', 'Arlington', '#003594', '#041E42', ''),
  ('New York Giants', 'NYG', 'NFL', 'East Rutherford', '#0B2265', '#A71930', ''),
  ('Philadelphia Eagles', 'PHI', 'NFL', 'Philadelphia', '#004C54', '#A5ACAF', ''),
  ('Washington Commanders', 'WAS', 'NFL', 'Landover', '#5A1414', '#FFB612', ''),
  
  -- NFC North
  ('Chicago Bears', 'CHI', 'NFL', 'Chicago', '#0B162A', '#C83803', ''),
  ('Detroit Lions', 'DET', 'NFL', 'Detroit', '#0076B6', '#B0B7BC', ''),
  ('Green Bay Packers', 'GB', 'NFL', 'Green Bay', '#203731', '#FFB612', ''),
  ('Minnesota Vikings', 'MIN', 'NFL', 'Minneapolis', '#4F2683', '#FFC62F', ''),
  
  -- NFC South
  ('Atlanta Falcons', 'ATL', 'NFL', 'Atlanta', '#A71930', '#000000', ''),
  ('Carolina Panthers', 'CAR', 'NFL', 'Charlotte', '#0085CA', '#101820', ''),
  ('New Orleans Saints', 'NO', 'NFL', 'New Orleans', '#D3BC8D', '#101820', ''),
  ('Tampa Bay Buccaneers', 'TB', 'NFL', 'Tampa', '#D50A0A', '#FF7900', ''),
  
  -- NFC West
  ('Arizona Cardinals', 'ARI', 'NFL', 'Glendale', '#97233F', '#000000', ''),
  ('Los Angeles Rams', 'LAR', 'NFL', 'Los Angeles', '#003594', '#FFA300', ''),
  ('San Francisco 49ers', 'SF', 'NFL', 'Santa Clara', '#AA0000', '#B3995D', ''),
  ('Seattle Seahawks', 'SEA', 'NFL', 'Seattle', '#002244', '#69BE28', '')
) AS teams_data(name, abbreviation, league, city, primary_color, secondary_color, logo_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teams 
  WHERE teams.name = teams_data.name
);

-- Insert all NHL teams (32 teams)
INSERT INTO public.teams (name, abbreviation, league, city, primary_color, secondary_color, logo_url) 
SELECT * FROM (VALUES
  -- Atlantic Division
  ('Boston Bruins', 'BOS', 'NHL', 'Boston', '#FFB81C', '#000000', ''),
  ('Buffalo Sabres', 'BUF', 'NHL', 'Buffalo', '#002654', '#FCB514', ''),
  ('Detroit Red Wings', 'DET', 'NHL', 'Detroit', '#CE1126', '#FFFFFF', ''),
  ('Florida Panthers', 'FLA', 'NHL', 'Sunrise', '#041E42', '#C8102E', ''),
  ('Montreal Canadiens', 'MTL', 'NHL', 'Montreal', '#AF1E2D', '#192168', ''),
  ('Ottawa Senators', 'OTT', 'NHL', 'Ottawa', '#C52032', '#C2912C', ''),
  ('Tampa Bay Lightning', 'TB', 'NHL', 'Tampa', '#002868', '#FFFFFF', ''),
  ('Toronto Maple Leafs', 'TOR', 'NHL', 'Toronto', '#003E7E', '#FFFFFF', ''),
  
  -- Metropolitan Division
  ('Carolina Hurricanes', 'CAR', 'NHL', 'Raleigh', '#CC0000', '#000000', ''),
  ('Columbus Blue Jackets', 'CBJ', 'NHL', 'Columbus', '#002654', '#CE1126', ''),
  ('New Jersey Devils', 'NJ', 'NHL', 'Newark', '#CE1126', '#000000', ''),
  ('New York Islanders', 'NYI', 'NHL', 'Elmont', '#00539B', '#F47D30', ''),
  ('New York Rangers', 'NYR', 'NHL', 'New York', '#0038A8', '#CE1126', ''),
  ('Philadelphia Flyers', 'PHI', 'NHL', 'Philadelphia', '#F74902', '#000000', ''),
  ('Pittsburgh Penguins', 'PIT', 'NHL', 'Pittsburgh', '#000000', '#CFC493', ''),
  ('Washington Capitals', 'WAS', 'NHL', 'Washington', '#041E42', '#C8102E', ''),
  
  -- Central Division
  ('Arizona Coyotes', 'ARI', 'NHL', 'Tempe', '#8C2633', '#E2D6B5', ''),
  ('Chicago Blackhawks', 'CHI', 'NHL', 'Chicago', '#CF0A2C', '#000000', ''),
  ('Colorado Avalanche', 'COL', 'NHL', 'Denver', '#6F263D', '#236192', ''),
  ('Dallas Stars', 'DAL', 'NHL', 'Dallas', '#006847', '#8F8F8C', ''),
  ('Minnesota Wild', 'MIN', 'NHL', 'St. Paul', '#154734', '#A6192E', ''),
  ('Nashville Predators', 'NSH', 'NHL', 'Nashville', '#FFB81C', '#041E42', ''),
  ('St. Louis Blues', 'STL', 'NHL', 'St. Louis', '#002F87', '#FCB514', ''),
  ('Winnipeg Jets', 'WPG', 'NHL', 'Winnipeg', '#041E42', '#004C97', ''),
  
  -- Pacific Division
  ('Anaheim Ducks', 'ANA', 'NHL', 'Anaheim', '#F47A38', '#B9975B', ''),
  ('Calgary Flames', 'CGY', 'NHL', 'Calgary', '#C8102E', '#F1BE48', ''),
  ('Edmonton Oilers', 'EDM', 'NHL', 'Edmonton', '#041E42', '#FF4C00', ''),
  ('Los Angeles Kings', 'LA', 'NHL', 'Los Angeles', '#111111', '#A2AAAD', ''),
  ('San Jose Sharks', 'SJ', 'NHL', 'San Jose', '#006D75', '#EA7200', ''),
  ('Seattle Kraken', 'SEA', 'NHL', 'Seattle', '#001628', '#99D9D9', ''),
  ('Vancouver Canucks', 'VAN', 'NHL', 'Vancouver', '#001F5B', '#00843D', ''),
  ('Vegas Golden Knights', 'VGK', 'NHL', 'Las Vegas', '#B4975A', '#333F42', '')
) AS teams_data(name, abbreviation, league, city, primary_color, secondary_color, logo_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teams 
  WHERE teams.name = teams_data.name
);

-- Create index on league column for better performance
CREATE INDEX IF NOT EXISTS idx_teams_league ON public.teams(league);

-- Create index on abbreviation for lookups
CREATE INDEX IF NOT EXISTS idx_teams_abbreviation ON public.teams(abbreviation);

-- Verify the complete team integration
SELECT 
  league,
  COUNT(*) as team_count
FROM public.teams 
GROUP BY league 
ORDER BY league; 