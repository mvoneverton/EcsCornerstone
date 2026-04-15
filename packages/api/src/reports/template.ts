/**
 * Report template data builder and HTML renderer.
 *
 * PLACEHOLDER — the production HTML is ECS_Cornerstone_Profile_Report_v2.html.
 * When that file is provided, replace buildReportHtml() with a function that
 * loads the template, injects the ReportData via string interpolation or a
 * lightweight template engine (e.g. Handlebars), and returns the filled HTML.
 *
 * The ReportData interface below is the stable data contract — the scoring
 * pipeline and template both depend on it.
 */

export type Profile = 'vanguard' | 'catalyst' | 'cultivator' | 'architect';

export interface ReportPerspective {
  perspective:      'self' | 'others' | 'work' | 'single';
  aPercentile:      number;
  rPercentile:      number;
  aScore800:        number;
  rScore800:        number;
  primaryProfile:   Profile;
  secondaryProfile: Profile | null;
}

export interface ReportData {
  respondent: {
    firstName:       string;
    lastName:        string;
    email:           string;
    currentPosition: string | null;
  };
  company: {
    name:    string;
    logoUrl: string | null;
  };
  assessmentType: 'pca' | 'wsa' | 'ja';
  completedAt:    string;   // ISO 8601
  perspectives:   ReportPerspective[];
  isValid:        boolean;
  validityFlags:  string[];
  position?: {
    title:                  string;
    consensusAPercentile:   number | null;
    consensusRPercentile:   number | null;
  };
}

// ── Profile metadata ──────────────────────────────────────────────────────────

const PROFILE_META: Record<Profile, {
  label:       string;
  color:       string;
  tagline:     string;
  traits:      string[];
  strengths:   string[];
  development: string[];
}> = {
  vanguard: {
    label:   'Vanguard',
    color:   '#1D4ED8',
    tagline: 'Decisive, direct, and results-driven.',
    traits:      ['Direct', 'Competitive', 'Goal-oriented', 'Independent'],
    strengths:   ['Drives results quickly', 'Makes tough decisions', 'Thrives under pressure'],
    development: ['Slowing down to listen', 'Building consensus', 'Showing patience with process'],
  },
  catalyst: {
    label:   'Catalyst',
    color:   '#D97706',
    tagline: 'Enthusiastic, persuasive, and inspiring.',
    traits:      ['Enthusiastic', 'Optimistic', 'Persuasive', 'Collaborative'],
    strengths:   ['Motivates others', 'Generates energy', 'Builds coalitions quickly'],
    development: ['Following through on details', 'Staying on task', 'Managing time boundaries'],
  },
  cultivator: {
    label:   'Cultivator',
    color:   '#059669',
    tagline: 'Patient, supportive, and relationship-focused.',
    traits:      ['Patient', 'Empathetic', 'Loyal', 'Consistent'],
    strengths:   ['Builds lasting relationships', 'Creates stable teams', 'Listens deeply'],
    development: ['Asserting positions', 'Embracing change', 'Speaking up in conflict'],
  },
  architect: {
    label:   'Architect',
    color:   '#7C3AED',
    tagline: 'Analytical, systematic, and precise.',
    traits:      ['Analytical', 'Methodical', 'Precise', 'Quality-focused'],
    strengths:   ['Produces high-quality work', 'Thinks critically', 'Plans thoroughly'],
    development: ['Making decisions with incomplete data', 'Accepting "good enough"', 'Showing warmth under pressure'],
  },
};

const PERSPECTIVE_LABELS: Record<string, string> = {
  self:   'How You See Yourself',
  others: 'How Others See You',
  work:   'Behavior at Work',
  single: 'Assessment Result',
};

const ASSESSMENT_LABELS: Record<string, string> = {
  pca: 'Personal Communication Assessment',
  wsa: 'Work Style Assessment',
  ja:  'Job Assessment',
};

const VALIDITY_FLAG_LABELS: Record<string, string> = {
  all_same_most:         'All 24 Most selections mapped to one profile — retake recommended.',
  large_perspective_gap: 'Significant divergence between perspectives — facilitator review suggested.',
  extreme_score:         'One or more scores are in the extreme range — discuss with facilitator.',
  incomplete:            'Assessment was incomplete at time of scoring.',
};

// ── Quadrant chart SVG ────────────────────────────────────────────────────────

function quadrantSvg(aPercentile: number, rPercentile: number, primary: Profile): string {
  const color  = PROFILE_META[primary].color;
  // Map percentile (0–100) → SVG coordinate (0–200), invert A axis (high A = top)
  const cx = (rPercentile / 100) * 200;
  const cy = ((100 - aPercentile) / 100) * 200;

  return `
    <svg width="220" height="220" viewBox="-10 -10 240 240" xmlns="http://www.w3.org/2000/svg"
         style="font-family:sans-serif">
      <!-- Quadrant backgrounds -->
      <rect x="0"   y="0"   width="100" height="100" fill="#EFF6FF" rx="2"/>
      <rect x="100" y="0"   width="100" height="100" fill="#FFFBEB" rx="2"/>
      <rect x="0"   y="100" width="100" height="100" fill="#F5F3FF" rx="2"/>
      <rect x="100" y="100" width="100" height="100" fill="#ECFDF5" rx="2"/>
      <!-- Axes -->
      <line x1="100" y1="0" x2="100" y2="200" stroke="#9CA3AF" stroke-width="1"/>
      <line x1="0" y1="100" x2="200" y2="100" stroke="#9CA3AF" stroke-width="1"/>
      <!-- Quadrant labels -->
      <text x="50"  y="50"  text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#1D4ED8" font-weight="600">Vanguard</text>
      <text x="150" y="50"  text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#D97706" font-weight="600">Catalyst</text>
      <text x="50"  y="150" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#7C3AED" font-weight="600">Architect</text>
      <text x="150" y="150" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#059669" font-weight="600">Cultivator</text>
      <!-- Axis labels -->
      <text x="100" y="-4" text-anchor="middle" font-size="9" fill="#6B7280">High Assertiveness</text>
      <text x="100" y="213" text-anchor="middle" font-size="9" fill="#6B7280">Low Assertiveness</text>
      <text x="-4"  y="100" text-anchor="middle" font-size="9" fill="#6B7280" transform="rotate(-90,-4,100)">Low Responsiveness</text>
      <text x="214" y="100" text-anchor="middle" font-size="9" fill="#6B7280" transform="rotate(90,214,100)">High Responsiveness</text>
      <!-- Score dot -->
      <circle cx="${cx}" cy="${cy}" r="8" fill="${color}" opacity="0.9"/>
      <circle cx="${cx}" cy="${cy}" r="4" fill="white"/>
    </svg>`;
}

// ── HTML builder ──────────────────────────────────────────────────────────────

export function buildReportHtml(data: ReportData): string {
  const respondentName = `${data.respondent.firstName} ${data.respondent.lastName}`;
  const primary        = data.perspectives[0]!.primaryProfile;
  const meta           = PROFILE_META[primary];

  // For PCA use the "Behavior at Work" perspective as the headline
  const headlinePerspective =
    data.perspectives.find((p) => p.perspective === 'work') ??
    data.perspectives[0]!;

  const perspectiveCards = data.perspectives.map((p) => {
    const pMeta = PROFILE_META[p.primaryProfile];
    return `
      <div class="card">
        <h3 class="perspective-label">${PERSPECTIVE_LABELS[p.perspective] ?? p.perspective}</h3>
        <div class="chart-row">
          ${quadrantSvg(p.aPercentile, p.rPercentile, p.primaryProfile)}
          <div class="score-table">
            <table>
              <tr><th></th><th>%ile</th><th>Score</th></tr>
              <tr>
                <td>Assertiveness</td>
                <td>${p.aPercentile.toFixed(1)}%</td>
                <td>${p.aScore800}</td>
              </tr>
              <tr>
                <td>Responsiveness</td>
                <td>${p.rPercentile.toFixed(1)}%</td>
                <td>${p.rScore800}</td>
              </tr>
            </table>
            <div class="profile-badge" style="background:${pMeta.color}20;border:2px solid ${pMeta.color};color:${pMeta.color}">
              <strong>${pMeta.label}</strong>
              ${p.secondaryProfile ? `<span class="secondary"> / ${PROFILE_META[p.secondaryProfile].label}</span>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  const validityHtml = !data.isValid ? `
    <div class="validity-banner">
      <strong>Facilitator Review Suggested</strong>
      <ul>${data.validityFlags.map((f) =>
        `<li>${VALIDITY_FLAG_LABELS[f] ?? f}</li>`
      ).join('')}</ul>
    </div>` : '';

  const positionSection = data.position ? `
    <div class="card">
      <h3>Position Benchmark — ${data.position.title}</h3>
      ${data.position.consensusAPercentile !== null ? `
        <table>
          <tr><th>Axis</th><th>Position Benchmark</th><th>Candidate Score</th></tr>
          <tr>
            <td>Assertiveness</td>
            <td>${data.position.consensusAPercentile?.toFixed(1)}%</td>
            <td>${headlinePerspective.aPercentile.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>Responsiveness</td>
            <td>${data.position.consensusRPercentile?.toFixed(1)}%</td>
            <td>${headlinePerspective.rPercentile.toFixed(1)}%</td>
          </tr>
        </table>` : '<p>Benchmark not yet finalised for this position.</p>'}
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>ECS Cornerstone — ${respondentName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; background: #fff; font-size: 13px; line-height: 1.5; }

    .page { width: 816px; min-height: 1056px; margin: 0 auto; padding: 48px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${meta.color}; padding-bottom: 20px; margin-bottom: 28px; }
    .header-left h1 { font-size: 22px; font-weight: 700; color: #111827; }
    .header-left .subtitle { font-size: 13px; color: #6B7280; margin-top: 4px; }
    .header-right { text-align: right; }
    .header-right .company { font-size: 14px; font-weight: 600; color: #374151; }
    .header-right .date { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
    .logo { max-height: 48px; max-width: 160px; object-fit: contain; }

    /* Respondent info */
    .respondent-block { background: #F9FAFB; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; display: flex; gap: 40px; }
    .respondent-block .field label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #9CA3AF; display: block; }
    .respondent-block .field span  { font-size: 14px; font-weight: 500; }

    /* Headline profile */
    .headline { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; padding: 20px; border-radius: 10px; background: ${meta.color}10; border-left: 5px solid ${meta.color}; }
    .headline .profile-name { font-size: 28px; font-weight: 700; color: ${meta.color}; }
    .headline .tagline { font-size: 14px; color: #374151; margin-top: 4px; }

    /* Cards */
    .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .card h3 { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 14px; border-bottom: 1px solid #F3F4F6; padding-bottom: 8px; }

    /* Perspective chart layout */
    .chart-row { display: flex; gap: 24px; align-items: flex-start; }
    .score-table table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
    .score-table th { background: #F3F4F6; padding: 6px 8px; text-align: left; font-weight: 600; color: #374151; }
    .score-table td { padding: 6px 8px; border-bottom: 1px solid #F3F4F6; }
    .profile-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; }
    .secondary { font-weight: 400; opacity: .7; }

    /* Profile description */
    .traits-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .traits-section h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #9CA3AF; margin-bottom: 6px; }
    .traits-section ul { list-style: disc; padding-left: 16px; font-size: 12px; color: #374151; }
    .traits-section li { margin-bottom: 3px; }

    /* Validity */
    .validity-banner { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .validity-banner strong { color: #92400E; font-size: 13px; }
    .validity-banner ul { margin-top: 6px; padding-left: 18px; font-size: 12px; color: #78350F; }

    /* Footer */
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF; display: flex; justify-content: space-between; }

    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background:#F3F4F6; padding:6px 10px; text-align:left; font-weight:600; }
    td { padding:6px 10px; border-bottom:1px solid #F3F4F6; }

    @media print { .page { padding: 0; } }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>${respondentName}</h1>
      <div class="subtitle">${ASSESSMENT_LABELS[data.assessmentType] ?? data.assessmentType}</div>
    </div>
    <div class="header-right">
      ${data.company.logoUrl
        ? `<img class="logo" src="${data.company.logoUrl}" alt="${data.company.name}"/>`
        : `<div class="company">${data.company.name}</div>`}
      <div class="date">Completed ${new Date(data.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  ${validityHtml}

  <!-- Respondent info -->
  <div class="respondent-block">
    <div class="field"><label>Name</label><span>${respondentName}</span></div>
    <div class="field"><label>Email</label><span>${data.respondent.email}</span></div>
    ${data.respondent.currentPosition
      ? `<div class="field"><label>Position</label><span>${data.respondent.currentPosition}</span></div>`
      : ''}
    <div class="field"><label>Assessment</label><span>${ASSESSMENT_LABELS[data.assessmentType]}</span></div>
  </div>

  <!-- Headline profile -->
  <div class="headline">
    <div>
      <div class="profile-name">${meta.label}${headlinePerspective.secondaryProfile ? ` / ${PROFILE_META[headlinePerspective.secondaryProfile].label}` : ''}</div>
      <div class="tagline">${meta.tagline}</div>
    </div>
  </div>

  <!-- Per-perspective scores -->
  ${perspectiveCards}

  <!-- Profile description -->
  <div class="card">
    <h3>Profile Detail — ${meta.label}</h3>
    <div class="traits-grid">
      <div class="traits-section">
        <h4>Key Traits</h4>
        <ul>${meta.traits.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>
      <div class="traits-section">
        <h4>Natural Strengths</h4>
        <ul>${meta.strengths.map((s) => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="traits-section">
        <h4>Development Areas</h4>
        <ul>${meta.development.map((d) => `<li>${d}</li>`).join('')}</ul>
      </div>
    </div>
  </div>

  ${positionSection}

  <!-- Footer -->
  <div class="footer">
    <span>ECS Cornerstone — Confidential</span>
    <span>Generated ${new Date(data.completedAt).toISOString()}</span>
  </div>

</div>
</body>
</html>`;
}
