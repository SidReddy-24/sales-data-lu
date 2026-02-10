/**
 * Profile Analyzer Utility
 * Analyzes LinkedIn profile data and generates score + suggestions
 */

/**
 * Analyze LinkedIn profile and generate score + recommendations
 * @param {Object} profileData - Raw profile data from Apify
 * @returns {Object} - Analysis result with score, strengths, and improvements
 */
function analyzeProfile(profileData) {
  if (!profileData || typeof profileData !== 'object') {
    return {
      profileScore: 0,
      strengths: [],
      improvements: ['Profile data is missing or invalid'],
      issues: ['Invalid profile data'],
    };
  }

  const strengths = [];
  const improvements = [];
  const issues = [];
  let score = 0;

  // 1. Headline Analysis (0-15 points)
  const headline = profileData.headline || '';
  const headlineLength = headline.trim().length;

  if (headlineLength === 0) {
    issues.push('Missing headline');
    improvements.push('Add a compelling headline that describes your professional identity');
  } else if (headlineLength < 50) {
    score += 5;
    improvements.push('Expand your headline to be more descriptive (aim for 50-120 characters)');
  } else if (headlineLength <= 120) {
    score += 15;
    strengths.push('Well-crafted headline');
  } else {
    score += 10;
    improvements.push('Consider shortening your headline for better readability');
  }

  // 2. About/Summary Section (0-20 points)
  const about = profileData.summary || profileData.about || '';
  const aboutLength = about.trim().length;

  if (aboutLength === 0) {
    issues.push('Missing About section');
    improvements.push('Add an About section to showcase your professional story');
  } else if (aboutLength < 200) {
    score += 5;
    improvements.push('Expand your About section (aim for 200-2000 characters)');
  } else if (aboutLength <= 2000) {
    score += 20;
    strengths.push('Comprehensive About section');
  } else {
    score += 15;
    improvements.push('Consider condensing your About section for better readability');
  }

  // 3. Skills Analysis (0-20 points)
  const skills = profileData.skills || [];
  const skillCount = Array.isArray(skills) ? skills.length : 0;

  if (skillCount === 0) {
    issues.push('No skills listed');
    improvements.push('Add relevant skills to your profile');
  } else if (skillCount < 5) {
    score += 5;
    improvements.push('Add more skills (aim for at least 10-15 relevant skills)');
  } else if (skillCount <= 20) {
    score += 20;
    strengths.push(`Good skill coverage (${skillCount} skills)`);
  } else {
    score += 15;
    improvements.push('Consider focusing on your top 15-20 most relevant skills');
  }

  // 4. Experience Analysis (0-25 points)
  const experiences = profileData.experiences || profileData.positions || [];
  const experienceCount = Array.isArray(experiences) ? experiences.length : 0;

  if (experienceCount === 0) {
    issues.push('No work experience listed');
    improvements.push('Add your work experience to showcase your career journey');
  } else if (experienceCount === 1) {
    score += 10;
    improvements.push('Add more work experience entries if applicable');
  } else if (experienceCount <= 5) {
    score += 25;
    strengths.push(`Well-documented experience (${experienceCount} positions)`);
  } else {
    score += 20;
    improvements.push('Consider highlighting your most relevant experiences');
  }

  // 5. Education Analysis (0-10 points)
  const education = profileData.education || profileData.educations || [];
  const educationCount = Array.isArray(education) ? education.length : 0;

  if (educationCount === 0) {
    improvements.push('Add your educational background');
  } else {
    score += 10;
    strengths.push('Education section completed');
  }

  // 6. Certifications Analysis (0-10 points)
  const certifications = profileData.certifications || [];
  const certCount = Array.isArray(certifications) ? certifications.length : 0;

  if (certCount === 0) {
    improvements.push('Add relevant certifications to boost credibility');
  } else if (certCount < 3) {
    score += 5;
    improvements.push('Consider adding more certifications');
  } else {
    score += 10;
    strengths.push(`Strong certification portfolio (${certCount} certifications)`);
  }

  score = Math.min(100, Math.max(0, score));

  if (score < 50) {
    improvements.push('Focus on completing all profile sections for a stronger presence');
  }

  return {
    profileScore: Math.round(score),
    strengths: strengths.length > 0 ? strengths : ['Profile has basic information'],
    improvements: improvements.length > 0 ? improvements : ['Profile looks good!'],
    issues: issues.length > 0 ? issues : [],
  };
}

const normalizeSkills = (profileData) => {
  const skillsRaw = profileData?.skills || [];
  if (!Array.isArray(skillsRaw)) {
    return [];
  }
  return skillsRaw
    .map((skill) => {
      if (typeof skill === 'string') {
        return skill;
      }
      if (skill && typeof skill === 'object') {
        return skill.title || skill.name || skill.skill || '';
      }
      return '';
    })
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0);
};

const extractCurrentExperience = (profileData) => {
  const experiences = Array.isArray(profileData?.experiences)
    ? profileData.experiences
    : Array.isArray(profileData?.positions)
    ? profileData.positions
    : [];

  if (experiences.length === 0) {
    return null;
  }

  const activeExperience =
    experiences.find((exp) => exp?.jobStillWorking) ||
    experiences.find((exp) => !exp?.jobEndedOn) ||
    experiences[0];

  return activeExperience || null;
};

const inferTargetRole = (headline = '', skills = []) => {
  const headlineLower = headline.toLowerCase();
  const skillSet = new Set(skills.map((skill) => skill.toLowerCase()));

  if (headlineLower.includes('product manager') || skillSet.has('product management')) {
    return 'Product Manager';
  }
  if (
    headlineLower.includes('ai') ||
    headlineLower.includes('ml') ||
    skillSet.has('artificial intelligence (ai)') ||
    skillSet.has('large language models (llm)') ||
    skillSet.has('ai agents')
  ) {
    return 'AI Systems Engineer';
  }

  return 'Technology Professional';
};

const buildProfileSummary = ({ profileData, currentExperience, skills }) => {
  const totalExperienceYears =
    typeof profileData?.totalExperienceYears === 'number'
      ? profileData.totalExperienceYears
      : null;
  const experienceLabel =
    totalExperienceYears === null
      ? 'early-career'
      : totalExperienceYears < 2
      ? 'early-career'
      : totalExperienceYears < 5
      ? 'mid-level'
      : 'experienced';

  const currentRole =
    currentExperience?.title || profileData?.jobTitle || profileData?.headline || 'professional';
  const company = currentExperience?.companyName || profileData?.companyName || '';
  const topSkills = skills.slice(0, 4);
  const roleText = company ? `${currentRole} at ${company}` : currentRole;

  const skillText =
    topSkills.length > 0 ? `Your skills in ${topSkills.join(', ')} support this path.` : '';

  return `You are an ${experienceLabel} ${roleText} focused on building practical, high-impact solutions. ${skillText} The next step is to deepen system design, reliability, and measurable outcomes.`;
};

const buildCurrentProfileAnalysis = ({ skills, currentExperience }) => {
  const skillSet = new Set(skills.map((skill) => skill.toLowerCase()));
  const hasLeadership =
    currentExperience?.title?.toLowerCase().includes('lead') ||
    currentExperience?.title?.toLowerCase().includes('manager');

  const analysis = [
    {
      category: 'AI/ML Engineering Skills',
      strengths: [],
      gaps: [],
    },
    {
      category: 'Technical Understanding',
      strengths: [],
      gaps: [],
    },
    {
      category: 'Business & Analytics',
      strengths: [],
      gaps: [],
    },
    {
      category: 'Communication & Leadership',
      strengths: [],
      gaps: [],
    },
    {
      category: 'Domain Knowledge',
      strengths: [],
      gaps: [],
    },
  ];

  const aiStrengths = [];
  if (skillSet.has('artificial intelligence (ai)')) aiStrengths.push('AI systems experience');
  if (skillSet.has('large language models (llm)')) aiStrengths.push('LLM exposure');
  if (skillSet.has('ai agents')) aiStrengths.push('Agentic AI workflows');
  if (aiStrengths.length === 0 && skills.length > 0) aiStrengths.push('Hands-on AI tooling');
  analysis[0].strengths = aiStrengths;
  analysis[0].gaps = ['Evaluation frameworks', 'Reliability testing', 'Cost optimization'];

  const techStrengths = [];
  if (skillSet.has('fastapi')) techStrengths.push('API development with FastAPI');
  if (skillSet.has('python (programming language)')) techStrengths.push('Python engineering');
  if (techStrengths.length === 0 && skills.length > 0) techStrengths.push('Core engineering skills');
  analysis[1].strengths = techStrengths;
  analysis[1].gaps = ['System design fundamentals', 'Scalability and infra tradeoffs'];

  const bizStrengths = [];
  if (skillSet.has('data visualization') || skillSet.has('power bi')) {
    bizStrengths.push('Data visualization and reporting');
  }
  if (skillSet.has('strategic planning and execution')) {
    bizStrengths.push('Strategic planning exposure');
  }
  if (bizStrengths.length === 0) bizStrengths.push('Exposure to real-world business workflows');
  analysis[2].strengths = bizStrengths;
  analysis[2].gaps = ['Product metrics', 'ROI-driven experimentation'];

  const commStrengths = [];
  if (hasLeadership) commStrengths.push('Team leadership and coordination');
  if (skillSet.has('project execution and monitoring')) commStrengths.push('Project execution');
  if (commStrengths.length === 0) commStrengths.push('Cross-team collaboration');
  analysis[3].strengths = commStrengths;
  analysis[3].gaps = ['Structured documentation', 'Stakeholder alignment'];

  const domainStrengths = [];
  if (currentExperience?.companyIndustry) {
    domainStrengths.push(`${currentExperience.companyIndustry} domain exposure`);
  }
  if (domainStrengths.length === 0) domainStrengths.push('Domain exposure through live roles');
  analysis[4].strengths = domainStrengths;
  analysis[4].gaps = ['Broader industry case studies', 'Portfolio proof'];

  return analysis;
};

const buildPhases = (targetRole) => [
  {
    title: 'Phase 1: Strengthen Foundations',
    objective: 'Build core engineering, system design, and reliability habits.',
    bullets: [
      'Learn scalable architecture basics: queues, caching, rate limiting.',
      'Add observability with logs, metrics, and tracing.',
      'Write concise design docs for key workflows.',
    ],
    actions: [
      'Rebuild one API with retries, logging, and error taxonomy.',
      'Create a short design doc for a production-ready agent workflow.',
      'Add automated tests for critical model outputs.',
    ],
  },
  {
    title: 'Phase 2: Build Production-Ready AI',
    objective: 'Ship AI systems that are evaluated, monitored, and measurable.',
    bullets: [
      'Implement evaluation pipelines for quality and safety.',
      'Track latency, cost per request, and failure rates.',
      'Deploy with CI/CD and containerization.',
    ],
    actions: [
      'Build a RAG pipeline with retrieval evaluation.',
      'Add dashboards for latency and token usage.',
      'Publish a hosted demo with real metrics.',
    ],
  },
  {
    title: `Phase 3: Differentiate as a ${targetRole}`,
    objective: 'Choose a specialization and build clear portfolio proof.',
    bullets: [
      'Pick a niche: agentic AI, RAG infrastructure, or automation.',
      'Ship a portfolio project with measurable impact.',
      'Publish technical write-ups and demos.',
    ],
    actions: [
      'Launch a public repo and case study.',
      'Contribute to an open-source AI project.',
      'Present your work in a community demo.',
    ],
  },
];

const buildDecisionMatrix = ({ skills, currentExperience }) => {
  const skillSet = new Set(skills.map((skill) => skill.toLowerCase()));
  const hasAI =
    skillSet.has('artificial intelligence (ai)') ||
    skillSet.has('large language models (llm)') ||
    skillSet.has('ai agents');
  const hasAnalytics = skillSet.has('data visualization') || skillSet.has('power bi');
  const hasLeadership =
    currentExperience?.title?.toLowerCase().includes('lead') ||
    currentExperience?.title?.toLowerCase().includes('manager');

  const rows = [
    {
      criteria: 'AI/ML Engineering',
      rating: hasAI ? 3.5 : 2.5,
      comments: hasAI ? 'Strong hands-on AI exposure.' : 'Needs deeper AI focus.',
    },
    {
      criteria: 'System Design',
      rating: 2.5,
      comments: 'Needs scalable architecture and infra depth.',
    },
    {
      criteria: 'Business Impact',
      rating: hasAnalytics ? 3.5 : 3,
      comments: hasAnalytics
        ? 'Analytics exposure, needs product metrics.'
        : 'Needs ROI-driven experimentation.',
    },
    {
      criteria: 'Communication & Leadership',
      rating: hasLeadership ? 4 : 3.5,
      comments: hasLeadership
        ? 'Leadership exposure through team roles.'
        : 'Collaboration strength, build stakeholder alignment.',
    },
    {
      criteria: 'Domain Knowledge',
      rating: currentExperience?.companyIndustry ? 3 : 2.5,
      comments: currentExperience?.companyIndustry
        ? 'Domain exposure, broaden use cases.'
        : 'Needs broader domain exposure.',
    },
  ];

  const mapAlignment = (rating) => {
    if (rating >= 4) return 'High';
    if (rating >= 3.5) return 'Moderate-High';
    if (rating >= 3) return 'Moderate';
    if (rating >= 2.5) return 'Low-Moderate';
    return 'Low';
  };

  return rows.map((row) => ({
    ...row,
    alignment: mapAlignment(row.rating),
  }));
};

const buildProgramFit = ({ targetRole, skills, currentExperience }) => {
  const topSkills = skills.slice(0, 3);
  const company = currentExperience?.companyName || '';
  const domain = currentExperience?.companyIndustry || '';
  const domainText = domain ? `${domain} domain exposure` : 'real-world domain exposure';
  const skillText =
    topSkills.length > 0
      ? `Your strengths in ${topSkills.join(', ')} give you a solid base.`
      : 'Your hands-on experience gives you a solid base.';

  return {
    title: 'How This Roadmap Fits You',
    summary: `You already have ${domainText} ${company ? `at ${company}` : ''}. ${skillText} This roadmap focuses on system design, reliability, and measurable outcomes to help you grow into a ${targetRole}.`,
    bullets: [
      'Structured practice on system design and evaluation frameworks.',
      'Clear milestones to turn projects into measurable impact.',
      'Portfolio-ready outcomes to support interviews and promotions.',
    ],
  };
};

const estimateGenAiScoreGain = (score = 0, improvementsCount = 0) => {
  let baseGain = 0;
  if (score < 60) baseGain = 25;
  else if (score < 75) baseGain = 15;
  else if (score < 90) baseGain = 8;
  else baseGain = 4;

  const improvementBonus = Math.min(5, Math.max(0, improvementsCount - 2));
  const totalGain = baseGain + improvementBonus;
  return Math.min(100 - score, totalGain);
};

const buildGenAiImpact = ({ analysis, skills, targetRole }) => {
  const beforeScore = analysis?.profileScore ?? 0;
  const improvementsCount = analysis?.improvements?.length ?? 0;
  const scoreGain = estimateGenAiScoreGain(beforeScore, improvementsCount);
  const afterScore = Math.min(100, beforeScore + scoreGain);

  const topSkills = skills.slice(0, 4);
  const skillText = topSkills.length > 0 ? topSkills.join(', ') : 'key skills';

  return {
    beforeScore,
    afterScore,
    scoreGain,
    benefits: [
      `Sharper positioning for ${targetRole} roles with AI-optimized branding.`,
      'Stronger keyword alignment to improve recruiter search visibility.',
      'Clearer impact statements that highlight outcomes and leadership.',
    ],
    skillBoosts: [
      `Reframe ${skillText} with proof-driven examples and outcomes.`,
      'Add missing skills based on job descriptions you target.',
      'Generate concise project summaries that show depth and impact.',
    ],
  };
};

const generateRoadmap = (profileData, analysisData = null) => {
  if (!profileData || typeof profileData !== 'object') {
    return null;
  }

  const skills = normalizeSkills(profileData);
  const currentExperience = extractCurrentExperience(profileData);
  const headline = profileData.headline || '';
  const targetRole = inferTargetRole(headline, skills);
  const fullName =
    profileData.fullName ||
    `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() ||
    'Professional';

  const currentRole =
    currentExperience?.title || profileData.jobTitle || profileData.headline || 'Professional';
  const company = currentExperience?.companyName || profileData.companyName || '';
  const location =
    currentExperience?.jobLocation ||
    profileData.jobLocation ||
    profileData.addressWithCountry ||
    profileData.addressWithoutCountry ||
    '';

  const profileSummary = buildProfileSummary({ profileData, currentExperience, skills });
  const profileAnalysis = buildCurrentProfileAnalysis({ skills, currentExperience });
  const phases = buildPhases(targetRole);
  const decisionMatrix = buildDecisionMatrix({ skills, currentExperience });
  const programFit = buildProgramFit({ targetRole, skills, currentExperience });
  const genAiImpact = buildGenAiImpact({ analysis: analysisData, skills, targetRole });

  const trajectory = [
    {
      period: 'Year 0-2',
      title: `${targetRole} - Foundation Builder`,
      expectedSalary: 'INR 12-20 LPA',
      impactJourney:
        'Own end-to-end delivery of AI features, improve reliability, and showcase measurable outcomes.',
    },
    {
      period: 'Year 2-4',
      title: `${targetRole} - Impact Creator`,
      expectedSalary: 'INR 20-35 LPA',
      impactJourney:
        'Lead system architecture decisions, optimize cost and latency, and deliver AI at scale.',
    },
  ];

  return {
    title: `${fullName}'s Career Roadmap`,
    targetRole,
    profile: {
      fullName,
      currentRole: company ? `${currentRole} at ${company}` : currentRole,
      location,
      headline,
      summary: profileSummary,
    },
    analysis: profileAnalysis,
    phases,
    trajectory,
    decisionMatrix,
    careerOutcomes: [
      'Growing demand for AI systems engineers across SaaS and automation.',
      'Specialization plus measurable outcomes creates strong differentiation.',
      'Production-grade AI skills are highly valued in hiring.',
    ],
    jobMarketVolatility: [
      'AI roles are competitive but expanding across industries.',
      'Clear specialization and portfolio proof reduce volatility.',
    ],
    programFit,
    genAiImpact,
    finalTip:
      'Position yourself as someone who ships reliable, measurable AI systems, not just prototypes.',
    skills,
  };
};

module.exports = {
  analyzeProfile,
  generateRoadmap,
};
