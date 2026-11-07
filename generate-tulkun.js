const fs = require('fs');

const GITHUB_USERNAME = 'DrushtiV';

// Mapping programming languages to colors
const LANGUAGE_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Rust: '#dea584',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Go: '#00ADD8',
  C: '#555555',
  'C++': '#f34b7d',
  Java: '#b07219',
  PHP: '#4F5D95',
  Ruby: '#701516'
};

async function fetchGitHubData() {
  const headers = { 'User-Agent': 'Node.js' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  // Fetch repositories for programming language stats
  let langCounts = {};
  try {
    const reposRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`, { headers });
    const repos = await reposRes.json();
    if (Array.isArray(repos)) {
      repos.forEach(repo => {
        if (repo.language) {
          langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        }
      });
    }
  } catch (err) {
    console.error('Error fetching repos:', err);
  }

  // Fetch user public activity events
  let recentCommits = 0;
  let lastCommitDate = null;
  try {
    const eventsRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public`, { headers });
    const events = await eventsRes.json();
    if (Array.isArray(events)) {
      const pushEvents = events.filter(e => e.type === 'PushEvent');
      if (pushEvents.length > 0) {
        lastCommitDate = new Date(pushEvents[0].created_at);
        recentCommits = pushEvents.reduce((acc, ev) => acc + (ev.payload.commits ? ev.payload.commits.length : 1), 0);
      }
    }
  } catch (err) {
    console.error('Error fetching events:', err);
  }

  // Check if in Rest Mode (no commits for > 48 hours)
  const now = new Date();
  const hoursSinceLastCommit = lastCommitDate ? (now - lastCommitDate) / (1000 * 60 * 60) : 999;
  const isResting = hoursSinceLastCommit > 48;

  return { langCounts, recentCommits, isResting };
}

function buildSVG(data) {
  const { langCounts, recentCommits, isResting } = data;

  // 1. Language Color Selection
  const sortedLangs = Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a]);
  const primaryColor = LANGUAGE_COLORS[sortedLangs[0]] || '#8A2BE2';
  const secondaryColor = LANGUAGE_COLORS[sortedLangs[1]] || '#00FFFF';
  const accentColor = LANGUAGE_COLORS[sortedLangs[2]] || '#FF007F';

  // 2. Growth, Glow & Motion dynamics
  const scale = isResting ? 0.75 : Math.min(1.4, 0.85 + recentCommits * 0.04);
  const glowOpacity = isResting ? 0.2 : Math.min(1.0, 0.3 + recentCommits * 0.1);
  const swimSpeed = isResting ? '14s' : `${Math.max(2.5, 6.5 - recentCommits * 0.2)}s`;

  // 3. Ocean Floor Seaweed (Grows with commits)
  let plantsHTML = '';
  const plantCount = Math.min(12, Math.floor(recentCommits / 2));
  for (let i = 0; i < plantCount; i++) {
    const xPos = 50 + i * 60;
    plantsHTML += `<path d="M${xPos} 290 Q${xPos + 12} 240 ${xPos} 200 T${xPos + 6} 150" stroke="#2E8B57" stroke-width="4" fill="none" opacity="0.8"/>`;
  }

  // 4. Companion Baby Tulkun (Spawns when commits > 8)
  let babyHTML = '';
  if (recentCommits > 8) {
    babyHTML = `
      <g transform="translate(120, 190) scale(0.35)" class="swimming" style="animation-delay: -2s;">
        <ellipse cx="120" cy="60" rx="90" ry="40" fill="${secondaryColor}" />
        <path d="M 40 60 Q 120 110 200 60 Z" fill="${accentColor}" />
        <circle cx="180" cy="50" r="5" fill="#FFFFFF" />
      </g>
    `;
  }

  return `<svg width="800" height="300" xmlns="http://www.w3.org/2000/svg">
    <style>
      .ocean { fill: #0d1117; }
      .tulkun-glow { filter: drop-shadow(0px 0px 14px ${primaryColor}); opacity: ${glowOpacity}; }
      .swimming { animation: swim ${swimSpeed} ease-in-out infinite alternate; }
      @keyframes swim {
        0% { transform: translate(0px, ${isResting ? '45px' : '0px'}) rotate(0deg); }
        100% { transform: translate(35px, ${isResting ? '55px' : '-18px'}) rotate(${isResting ? '1deg' : '-4deg'}); }
      }
    </style>

    <rect width="800" height="300" class="ocean" rx="12" />
    <g>${plantsHTML}</g>
    ${babyHTML}

    <!-- Main Dynamic Tulkun -->
    <g class="swimming tulkun-glow" transform="translate(300, 80) scale(${scale})">
      <!-- Body -->
      <ellipse cx="120" cy="60" rx="90" ry="40" fill="${primaryColor}" />
      <!-- Underbelly & Fins -->
      <path d="M 40 60 Q 120 110 200 60 Z" fill="${secondaryColor}" />
      <polygon points="120,60 70,130 140,80" fill="${accentColor}" />
      <polygon points="30,60 0,15 0,105" fill="${secondaryColor}" />
      <!-- Eye -->
      <circle cx="180" cy="50" r="5" fill="${isResting ? '#666666' : '#FFFFFF'}" />
    </g>
  </svg>`;
}

async function run() {
  const data = await fetchGitHubData();
  const svgContent = buildSVG(data);
  fs.writeFileSync('tulkun-ecosystem.svg', svgContent);
  console.log('Successfully generated tulkun-ecosystem.svg!');
}

run();
