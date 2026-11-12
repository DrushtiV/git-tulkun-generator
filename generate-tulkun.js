const fs = require('fs');

const GITHUB_USERNAME = 'DrushtiV';

const LANGUAGE_COLORS = {
  Python: '#3572A5',
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  HTML: '#E34C26',
  CSS: '#563D7C',
  Rust: '#DEA584',
  'C++': '#F34B7D',
  Java: '#B07219',
  Go: '#00ADD8',
  Jupyter: '#DA5B0B'
};

async function fetchGitHubData() {
  const headers = { 'User-Agent': 'Node.js' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  let langCounts = {};
  let totalRepos = 0;
  let lastPushDate = null;

  try {
    const reposRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`, { headers });
    const repos = await reposRes.json();
    if (Array.isArray(repos)) {
      totalRepos = repos.length;
      if (repos[0]?.pushed_at) lastPushDate = new Date(repos[0].pushed_at);
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
  try {
    const eventsRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`, { headers });
    const events = await eventsRes.json();
    if (Array.isArray(events)) {
      const pushEvents = events.filter(e => e.type === 'PushEvent');
      recentCommits = pushEvents.reduce((acc, ev) => acc + (ev.payload?.commits?.length || 1), 0);
      if (pushEvents[0]?.created_at) {
        const d = new Date(pushEvents[0].created_at);
        if (!lastPushDate || d > lastPushDate) lastPushDate = d;
      }
    }
  } catch (err) {
    console.error('Error fetching events:', err);
  }

  const now = new Date();
  const hoursInactive = lastPushDate ? (now - lastPushDate) / (1000 * 60 * 60) : 0;
  const isResting = hoursInactive > 120;
  const activityScore = Math.max(recentCommits, Math.min(totalRepos, 12));

  return { langCounts, recentCommits, totalRepos, activityScore, isResting };
}

// Renders a crisp pixel-art top-down Showa Koi
function renderPixelKoi(primaryPatch, secondaryPatch, finTint, scale, isShadow = false) {
  // 28x44 pixel grid representing a top-down curved Koi
  // Legend:
  // . = transparent
  // W = pearl white body
  // S = ice-blue shading
  // K = deep sumi black patch
  // R = primary language patch (e.g., coral red / python blue)
  // Y = secondary language patch (e.g., JS gold)
  // F = translucent ice-blue fin
  // E = eye
  const grid = [
    "...........FF...............",
    "..........FFFF..............",
    "..........FFFFF........FF...",
    ".........FFFFFFF......FFFF..",
    ".........FFFFFFFF....FFFFF..",
    ".........FFFFFFFFF..FFFFFF..",
    "..........FFFFFFFFFFFFFFFF..",
    "..........FFFFFFFFFFFFFFF...",
    "...........FFFFFFFFFFFFF....",
    "............FFFFFFFFFFF.....",
    ".............WWWWWWWWW......",
    ".............WKKKKKKWW......",
    "..............WKKKKWSS......",
    "..............WWWWWSSS......",
    "...............WRRWWSS......",
    "...............WRRWKSS......",
    "...............WWKKKSS......",
    "...............WKKKKSS......",
    "..............WWKKKKSS......",
    "............FFWWWWWWSS......",
    "...........FFFWWYYYWWSS.....",
    "..........FFFFWYYYYWWSS.....",
    ".........FFFFFWWYYKKWSS.....",
    ".........FFFFFWWKKKKWSS.....",
    "........FFFFFFWWKKKKWSS.....",
    "........FFFFFFWWKKKKWSS.....",
    "........FFFFFWWWWKKWWSS.....",
    "........FFFFFWWWWWWWWSS.....",
    ".........FFFWWWWWWWWSSS.....",
    "..........FFWWRRRRRWSSS.....",
    "...........WWWRRRRRRWSS.....",
    "..........EWWWRRRRRRWWSE....",
    "..........WWWRRRRRRRWWSS....",
    "..........WWWWWRRRRWWWSS....",
    "..........WWWWWWWWWWWWSS....",
    "...........WWWWWWWWWWSS.....",
    "............WWWWWWWWSS......",
    "..........F..WWWWWWSS..F....",
    ".........F....WWWWSS....F...",
    "........F................F.."
  ];

  const palette = isShadow
    ? { W: '#062c54', S: '#062c54', K: '#062c54', R: '#062c54', Y: '#062c54', F: '#062c54', E: '#062c54' }
    : {
        W: '#f8fafc',
        S: '#bae6fd',
        K: '#0f172a',
        R: primaryPatch,
        Y: secondaryPatch,
        F: finTint,
        E: '#020617'
      };

  const pSize = 5 * scale;
  let rects = '';
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const ch = grid[y][x];
      if (ch !== '.' && palette[ch]) {
        rects += `<rect x="${x * pSize}" y="${y * pSize}" width="${pSize}" height="${pSize}" fill="${palette[ch]}" />`;
      }
    }
  }
  return rects;
}

function buildSVG(data) {
  const { langCounts, totalRepos, activityScore, isResting } = data;

  const sortedLangs = Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a]);
  const lang1Color = LANGUAGE_COLORS[sortedLangs[0]] || '#e34c26'; // Coral Red / Python Blue
  const lang2Color = LANGUAGE_COLORS[sortedLangs[1]] || '#f7df1e'; // JS Yellow / Gold
  const scale = isResting ? 0.85 : Math.min(1.25, 0.95 + activityScore * 0.02);
  const swimSpeed = isResting ? '10s' : `${Math.max(3.5, 6.5 - activityScore * 0.15)}s`;

  // Pixelated pond water grid pattern + lily pads based on commits
  let lilyPads = '';
  const padCount = Math.min(6, 2 + Math.floor(activityScore / 3));
  const padCoords = [
    [95, 75], [730, 90], [110, 260], [710, 255], [220, 55], [620, 275]
  ];
  for (let i = 0; i < padCount; i++) {
    const [px, py] = padCoords[i];
    lilyPads += `
      <g transform="translate(${px}, ${py})" shape-rendering="crispEdges" opacity="0.85">
        <rect x="-15" y="-10" width="30" height="20" fill="#15803d"/>
        <rect x="-10" y="-15" width="20" height="30" fill="#15803d"/>
        <rect x="-10" y="-10" width="15" height="15" fill="#22c55e"/>
        <rect x="0" y="0" width="10" height="5" fill="#0d6efd"/>
      </g>
    `;
  }

  // Companion Baby Pixel Koi (spawns when active)
  const babyKoi = activityScore >= 4 ? `
    <g class="baby-swim">
      <g transform="translate(14, 14)" opacity="0.45">${renderPixelKoi(lang2Color, lang1Color, '#7dd3fc', 0.45, true)}</g>
      <g>${renderPixelKoi(lang2Color, lang1Color, '#bae6fd', 0.45, false)}</g>
    </g>
  ` : '';

  return `<svg width="850" height="340" viewBox="0 0 850 340" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Pixel-grid blue pond texture matching reference -->
      <pattern id="pixelPond" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#0b69b8"/>
        <rect x="0" y="0" width="5" height="5" fill="#0e76cd"/>
      </pattern>
    </defs>

    <style>
      .koi-swim {
        animation: koiGlide ${swimSpeed} ease-in-out infinite alternate;
      }
      .baby-swim {
        animation: babyGlide ${swimSpeed} ease-in-out infinite alternate;
      }
      @keyframes koiGlide {
        0%   { transform: translate(345px, ${isResting ? '85px' : '55px'}) rotate(-12deg); }
        50%  { transform: translate(365px, ${isResting ? '90px' : '42px'}) rotate(-8deg); }
        100% { transform: translate(385px, ${isResting ? '88px' : '52px'}) rotate(-15deg); }
      }
      @keyframes babyGlide {
        0%   { transform: translate(195px, 165px) rotate(-18deg); }
        100% { transform: translate(220px, 150px) rotate(-10deg); }
      }
    </style>

    <!-- Textured Blue Pond Backdrop -->
    <rect width="850" height="340" rx="14" fill="url(#pixelPond)" stroke="#074a85" stroke-width="3"/>

    <!-- Water Ripples -->
    <ellipse cx="425" cy="170" rx="220" ry="95" fill="none" stroke="#7dd3fc" stroke-width="2" stroke-dasharray="8,6" opacity="0.25">
      <animate attributeName="rx" values="200;245;200" dur="5s" repeatCount="indefinite"/>
      <animate attributeName="ry" values="85;110;85" dur="5s" repeatCount="indefinite"/>
    </ellipse>

    ${lilyPads}
    ${babyKoi}

    <!-- Main Top-Down Pixel Showa Koi -->
    <g class="koi-swim" shape-rendering="crispEdges">
      <!-- Cast Pond Shadow -->
      <g transform="translate(22, 24)" opacity="0.55">
        ${renderPixelKoi(lang1Color, lang2Color, '#7dd3fc', scale, true)}
      </g>
      <!-- Koi Body & Translucent Fins -->
      <g>
        ${renderPixelKoi(lang1Color, lang2Color, '#bae6fd', scale, false)}
      </g>
    </g>

    <!-- Crisp Pixel Status Footer -->
    <rect x="16" y="302" width="818" height="24" rx="6" fill="#062c54" opacity="0.82"/>
    <text x="28" y="318" fill="#e0f2fe" font-family="monospace" font-size="12" font-weight="bold">
      @${GITHUB_USERNAME} • ${totalRepos} Repos • Colors: ${sortedLangs.slice(0, 3).join(', ') || 'Python, JS, HTML'} • ${isResting ? 'Resting 💤' : 'Swimming ⚡'}
    </text>
  </svg>`;
}

async function run() {
  const data = await fetchGitHubData();
  const svgContent = buildSVG(data);
  fs.writeFileSync('tulkun-ecosystem.svg', svgContent);
  console.log('Generated Pixel-Art Showa Koi SVG!');
}

run();
