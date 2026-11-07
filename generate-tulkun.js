const fs = require('fs');

const GITHUB_USERNAME = 'DrushtiV';

// Vibrant hex mappings for programming languages
const LANGUAGE_COLORS = {
  Python: '#3572A5',
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  HTML: '#E34C26',
  CSS: '#563D7C',
  Rust: '#DEA584',
  Cplusplus: '#F34B7D',
  Java: '#B07219',
  Go: '#00ADD8'
};

async function fetchGitHubData() {
  const headers = { 'User-Agent': 'Node.js' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

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

  const now = new Date();
  const hoursSinceLastCommit = lastCommitDate ? (now - lastCommitDate) / (1000 * 60 * 60) : 999;
  const isResting = hoursSinceLastCommit > 48;

  return { langCounts, recentCommits, isResting };
}

function buildSVG(data) {
  const { langCounts, recentCommits, isResting } = data;

  const sortedLangs = Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a]);
  const primaryColor = LANGUAGE_COLORS[sortedLangs[0]] || '#3572A5'; // Main body (e.g. Python blue)
  const headColor = LANGUAGE_COLORS[sortedLangs[1]] || '#F7DF1E';    // Head visor (e.g. JS yellow)
  const bellyColor = LANGUAGE_COLORS[sortedLangs[2]] || '#E34C26';   // Accent markings (e.g. HTML orange)

  const scale = isResting ? 0.8 : Math.min(1.35, 0.95 + recentCommits * 0.03);
  const glowOpacity = isResting ? 0.2 : Math.min(0.95, 0.4 + recentCommits * 0.08);
  const swimSpeed = isResting ? '12s' : `${Math.max(2.8, 6.0 - recentCommits * 0.15)}s`;

  // Dynamic ocean flora based on commit activity
  let plantsHTML = '';
  const plantCount = Math.min(14, 3 + Math.floor(recentCommits / 2));
  for (let i = 0; i < plantCount; i++) {
    const xPos = 40 + i * 55;
    const height = 180 + (i % 3) * 35;
    plantsHTML += `
      <path d="M${xPos} 320 C${xPos - 20} ${height + 40}, ${xPos + 25} ${height - 20}, ${xPos - 5} ${height - 60}" 
            stroke="url(#plantGrad)" stroke-width="4.5" fill="none" opacity="0.75" />
    `;
  }

  // Companion Baby Tulkun (Unlocks with higher commits)
  let babyHTML = '';
  if (recentCommits > 6) {
    babyHTML = `
      <g transform="translate(130, 190) scale(0.42)" class="swimming-companion">
        <path d="M 40 50 Q 120 10 210 50 Q 120 90 40 50 Z" fill="${headColor}" />
        <path d="M 70 50 Q 130 85 200 50 Q 130 65 70 50 Z" fill="${primaryColor}" />
        <polygon points="120,55 60,110 140,75" fill="${primaryColor}" opacity="0.9"/>
        <polygon points="40,50 0,10 0,90" fill="${bellyColor}" />
        <circle cx="185" cy="42" r="5" fill="#FFFFFF" />
      </g>
    `;
  }

  return `
  <svg width="850" height="340" viewBox="0 0 850 340" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Deep Ocean Background Gradient -->
      <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0a0d14"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#060911"/>
      </linearGradient>

      <!-- Ocean Plants Gradient -->
      <linearGradient id="plantGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#064e3b"/>
        <stop offset="100%" stop-color="#34d399"/>
      </linearGradient>

      <!-- Metallic Body Shader -->
      <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="40%" stop-color="${primaryColor}"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>

      <!-- Head Visor Gradient -->
      <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${headColor}"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>

      <!-- Bioluminescent Glow Filter -->
      <filter id="creatureGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComponentTransfer in="blur" result="glow">
          <feFuncA type="linear" slope="${glowOpacity}"/>
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <style>
      .ocean-bg { fill: url(#oceanGrad); }
      .tulkun-shadow { filter: url(#creatureGlow); }
      .swimming-main { animation: floatSwim ${swimSpeed} ease-in-out infinite alternate; }
      .swimming-companion { animation: floatSwim ${swimSpeed} ease-in-out infinite alternate; animation-delay: -1.8s; }
      .tail-beat { transform-origin: 50px 60px; animation: tailWag 1.8s ease-in-out infinite alternate; }

      @keyframes floatSwim {
        0% { transform: translate(260px, ${isResting ? '90px' : '40px'}) rotate(0deg); }
        50% { transform: translate(290px, ${isResting ? '100px' : '20px'}) rotate(${isResting ? '1deg' : '-2deg'}); }
        100% { transform: translate(310px, ${isResting ? '95px' : '35px'}) rotate(${isResting ? '2deg' : '-3.5deg'}); }
      }

      @keyframes tailWag {
        0% { transform: rotate(-5deg); }
        100% { transform: rotate(8deg); }
      }
    </style>

    <!-- Canvas Background -->
    <rect width="850" height="340" rx="14" class="ocean-bg" stroke="#1e293b" stroke-width="2"/>

    <!-- Dynamic Ocean Plants -->
    <g>${plantsHTML}</g>

    <!-- Companion Tulkun -->
    ${babyHTML}

    <!-- Main High-Detail Realistic Tulkun -->
    <g class="swimming-main tulkun-shadow" transform="translate(260, 40) scale(${scale})">
      <!-- Main Body Core -->
      <path d="M 50 60 Q 150 -10 270 50 Q 150 120 50 60 Z" fill="url(#bodyGrad)" stroke="#334155" stroke-width="2"/>
      
      <!-- Underbelly & Ridge Textures -->
      <path d="M 80 60 Q 160 105 250 55 Q 160 75 80 60 Z" fill="#f8fafc" opacity="0.88"/>
      <path d="M 120 62 Q 160 90 210 58" stroke="${bellyColor}" stroke-width="3.5" fill="none" stroke-dasharray="6,4"/>

      <!-- Head Crest & Visor (Language 2 Color) -->
      <path d="M 200 24 Q 240 20 270 50 Q 220 40 200 24 Z" fill="url(#headGrad)"/>
      <ellipse cx="230" cy="38" rx="8" ry="4" fill="#ffffff" opacity="0.7"/>

      <!-- Bioluminescent Dots along the Torso -->
      <circle cx="170" cy="45" r="3.5" fill="#38bdf8"/>
      <circle cx="150" cy="47" r="3" fill="#38bdf8"/>
      <circle cx="130" cy="50" r="2.5" fill="#38bdf8"/>

      <!-- Large Pectoral Fin -->
      <g transform="rotate(${isResting ? '15' : '-5'}, 150, 60)">
        <path d="M 150 60 L 90 145 C 110 145, 150 120, 175 75 Z" fill="url(#bodyGrad)" stroke="#475569" stroke-width="1.5"/>
        <path d="M 140 65 L 95 135" stroke="${bellyColor}" stroke-width="2" opacity="0.8"/>
      </g>

      <!-- Rear Secondary Fins -->
      <polygon points="100,60 65,95 110,72" fill="${primaryColor}" opacity="0.9"/>
      <polygon points="100,55 70,25 110,48" fill="${primaryColor}" opacity="0.9"/>

      <!-- Articulated Tail Fin -->
      <g class="tail-beat">
        <path d="M 55 60 L 5 10 C 15 45, 15 75, 5 110 Z" fill="url(#bodyGrad)" stroke="#334155" stroke-width="1.5"/>
        <path d="M 45 60 L 15 25 M 45 60 L 15 95" stroke="${headColor}" stroke-width="2" opacity="0.7"/>
      </g>

      <!-- Eye (Dark when resting, luminous when active) -->
      <circle cx="245" cy="44" r="4.5" fill="${isResting ? '#475569' : '#0284c7'}"/>
      <circle cx="246" cy="43" r="1.5" fill="#ffffff"/>
    </g>

    <!-- Status Metadata Banner -->
    <text x="25" y="315" fill="#94a3b8" font-family="monospace" font-size="12">
      @${GITHUB_USERNAME} • ${recentCommits} Commits (${isResting ? 'Resting Mode 💤' : 'Active Swimming ⚡'})
    </text>
  </svg>
  `;
}

async function run() {
  const data = await fetchGitHubData();
  const svgContent = buildSVG(data);
  fs.writeFileSync('tulkun-ecosystem.svg', svgContent);
  console.log('Successfully generated high-detail tulkun-ecosystem.svg!');
}

run();
