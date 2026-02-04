/**
 * LinkedIn Controller
 * Handles LinkedIn profile analysis requests
 */

const apifyService = require('../services/apify.service');
const { analyzeProfile, generateRoadmap } = require('../utils/profileAnalyzer');
const UserProfile = require('../models/UserProfile.model');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { extractResumeWithOpenAI } = require('../services/openai.service');
const {
  buildLatexResume,
  buildStructuredFromSections,
} = require('../utils/resumeLatex');

const truncateText = (text, limit = 4000) => {
  if (!text) return '';
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n...`;
};

const normalizeResumeText = (text) =>
  text
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const extractResumeText = async (file) => {
  const fileName = file.originalname?.toLowerCase() || '';
  const mimeType = file.mimetype || '';

  if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
    const data = await pdfParse(file.buffer);
    return data.text || '';
  }

  if (
    mimeType.includes('wordprocessingml') ||
    fileName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || '';
  }

  throw new Error('Unsupported file type. Please upload a PDF or DOCX resume.');
};

const SECTION_HEADERS = [
  { key: 'summary', regex: /^(summary|profile|professional summary|objective)\b/i },
  { key: 'experience', regex: /^(experience|work experience|employment|professional experience)\b/i },
  { key: 'education', regex: /^(education|academics)\b/i },
  { key: 'skills', regex: /^(skills|technical skills|core skills)\b/i },
  { key: 'projects', regex: /^(projects|project experience)\b/i },
  { key: 'certifications', regex: /^(certifications|certificates|licenses)\b/i },
  { key: 'languages', regex: /^(languages?)\b/i },
  { key: 'contact', regex: /^(contact|contact details|personal details)\b/i },
  { key: 'references', regex: /^(references?|referees)\b/i },
];

const cleanLine = (line) =>
  line
    .replace(/^[•\-\u2022]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const isContactLine = (line) =>
  /[@]|https?:\/\/|linkedin\.com\/in\//i.test(line) ||
  /\+?\d[\d\s().-]{7,}\d/.test(line);

const splitSections = (lines) => {
  const sections = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    contact: [],
    references: [],
    other: [],
  };

  let current = 'other';
  lines.forEach((rawLine) => {
    const line = cleanLine(rawLine);
    if (!line) return;

    const headerMatch = SECTION_HEADERS.find((entry) => entry.regex.test(line));
    if (headerMatch) {
      current = headerMatch.key;
      return;
    }

    sections[current].push(line);
  });

  return sections;
};

const extractName = (lines) => {
  const candidate = lines.find(
    (line) =>
      line.length <= 60 &&
      !isContactLine(line) &&
      !SECTION_HEADERS.some((entry) => entry.regex.test(line)) &&
      !/\d/.test(line) &&
      line.split(' ').length <= 6
  );
  return candidate || 'Professional';
};

const extractHeadline = (lines, name) => {
  const roleKeywords = /(engineer|developer|designer|manager|analyst|lead|intern|specialist|consultant)/i;
  const headlineCandidate = lines.find(
    (line) =>
      line !== name &&
      line.length <= 80 &&
      !isContactLine(line) &&
      !SECTION_HEADERS.some((entry) => entry.regex.test(line)) &&
      roleKeywords.test(line)
  );
  return headlineCandidate || `${name} Professional`;
};

const normalizeSkillToken = (token) => token.replace(/[;:]/g, '').trim();

const isValidSkill = (skill) => {
  if (!skill || skill.length < 2 || skill.length > 40) return false;
  if (isContactLine(skill)) return false;
  if (/^\d+$/.test(skill)) return false;
  return true;
};

const extractSkills = (sections) => {
  const skillLines = sections.skills || [];
  if (skillLines.length === 0) return [];

  const tokens = skillLines
    .join(' ')
    .split(/[•,|]/)
    .map(normalizeSkillToken)
    .filter(isValidSkill);

  const deduped = [];
  const seen = new Set();
  tokens.forEach((token) => {
    const key = token.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(token);
    }
  });

  return deduped.slice(0, 25);
};

const extractLanguages = (sections) => {
  const languageLines = sections.languages || [];
  if (languageLines.length === 0) return [];
  return languageLines
    .join(' ')
    .split(/[•,|]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
    .slice(0, 10);
};

const extractContact = (lines) => {
  const emails = [];
  const phones = [];
  const links = [];

  lines.forEach((line) => {
    const emailMatch = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
    if (emailMatch) {
      emailMatch.forEach((email) => emails.push(email));
    }
    const phoneMatch = line.match(/\+?\d[\d\s().-]{7,}\d/g);
    if (phoneMatch) {
      phoneMatch.forEach((phone) => phones.push(phone.trim()));
    }
    if (/linkedin\.com\/in\//i.test(line)) {
      links.push(line.trim());
    }
  });

  const unique = (arr) => Array.from(new Set(arr));
  return {
    emails: unique(emails),
    phones: unique(phones),
    links: unique(links),
  };
};

const buildResumeProfileData = (resumeText) => {
  const cleaned = normalizeResumeText(resumeText);
  const rawLines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
  const sections = splitSections(rawLines);

  const fullName = extractName(rawLines);
  const headline = extractHeadline(rawLines, fullName);

  const firstHeadingIndex = rawLines.findIndex((line) =>
    SECTION_HEADERS.some((entry) => entry.regex.test(line))
  );
  const preHeadingLines =
    firstHeadingIndex === -1 ? rawLines : rawLines.slice(0, firstHeadingIndex);
  const summaryText =
    sections.summary.join(' ') ||
    preHeadingLines.filter((line) => !isContactLine(line)).slice(0, 4).join(' ');

  const skills = extractSkills(sections);
  const languages = extractLanguages(sections);
  const languageSet = new Set(languages.map((lang) => lang.toLowerCase()));
  const filteredSkills = skills.filter((skill) => !languageSet.has(skill.toLowerCase()));

  const experienceLines = sections.experience || [];
  const experienceMarkers = experienceLines.filter((line) =>
    /(20\d{2}|present|current)/i.test(line)
  );
  const experienceCount = Math.max(1, experienceMarkers.length || (experienceLines.length > 0 ? 2 : 1));
  const experiences = Array.from({ length: experienceCount }, (_, idx) => ({
    title: experienceMarkers[idx] || `Experience ${idx + 1}`,
  }));

  const educationLines = sections.education || [];
  const education = educationLines.length > 0 ? [{ title: educationLines[0] }] : [];

  const contact = extractContact(rawLines);

  return {
    fullName,
    headline,
    summary: summaryText.slice(0, 1200),
    about: summaryText.slice(0, 1200),
    skills: filteredSkills,
    experiences,
    education,
    resumeSections: {
      contact,
      summary: sections.summary,
      skills: filteredSkills,
      languages,
      experience: experienceLines.slice(0, 20),
      education: educationLines.slice(0, 10),
      projects: (sections.projects || []).slice(0, 10),
      certifications: (sections.certifications || []).slice(0, 10),
      references: (sections.references || []).slice(0, 5),
    },
  };
};

const buildResumeProfileDataFromStructured = (structured) => {
  const summary = structured.summary || '';
  const skills = structured.skills || [];
  const languages = structured.languages || [];
  const experience = structured.experience || [];
  const education = structured.education || [];

  const experienceLines = experience.map((item) =>
    [item.title, item.company, item.dates, item.location].filter(Boolean).join(' • ')
  );

  const educationLines = education.map((item) =>
    [item.degree, item.school, item.dates].filter(Boolean).join(' • ')
  );

  return {
    fullName: structured.fullName || 'Professional',
    headline: structured.headline || `${structured.fullName || 'Professional'} Resume`,
    summary,
    about: summary,
    skills,
    experiences: experience.length > 0 ? experience : [{ title: 'Experience 1' }],
    education: educationLines.length > 0 ? [{ title: educationLines[0] }] : [],
    resumeSections: {
      contact: structured.contact || {},
      summary: summary ? [summary] : [],
      skills,
      languages,
      experience: experienceLines,
      education: educationLines,
      projects: structured.projects || [],
      certifications: structured.certifications || [],
      references: structured.references || [],
    },
  };
};

const buildGenAiResume = ({ profileData, analysis }) => {
  const name = profileData.fullName || 'Professional';
  const headline = profileData.headline || `${name} | AI-Enhanced Resume`;
  const topSkills = (profileData.skills || []).slice(0, 10);
  const languages = profileData.resumeSections?.languages || [];
  const experienceLines = profileData.resumeSections?.experience || [];
  const educationLines = profileData.resumeSections?.education || [];
  const projectLines = profileData.resumeSections?.projects || [];
  const certificationLines = profileData.resumeSections?.certifications || [];
  const strengths = analysis?.strengths || [];
  const improvements = analysis?.improvements || [];

  return [
    `${name}`,
    headline,
    '',
    'PROFESSIONAL SUMMARY',
    `${profileData.summary || 'Impact-driven professional with a focus on delivering measurable outcomes.'}`,
    '',
    'CORE SKILLS',
    topSkills.length > 0 ? topSkills.join(' • ') : 'Add role-aligned skills and keywords.',
    languages.length > 0 ? `Languages: ${languages.join(', ')}` : '',
    '',
    'EXPERIENCE HIGHLIGHTS',
    experienceLines.length > 0
      ? experienceLines.slice(0, 5).map((item) => `• ${item}`).join('\n')
      : '• Add recent roles with achievements and outcomes.',
    '',
    'EDUCATION',
    educationLines.length > 0
      ? educationLines.slice(0, 3).map((item) => `• ${item}`).join('\n')
      : '• Add your education details.',
    projectLines.length > 0
      ? `\nPROJECTS\n${projectLines.slice(0, 3).map((item) => `• ${item}`).join('\n')}`
      : '',
    certificationLines.length > 0
      ? `\nCERTIFICATIONS\n${certificationLines.slice(0, 3).map((item) => `• ${item}`).join('\n')}`
      : '',
    '',
    'IMPACT HIGHLIGHTS',
    strengths.length > 0 ? strengths.map((item) => `• ${item}`).join('\n') : '• Highlight measurable wins and leadership.',
    '',
    'GROWTH OPPORTUNITIES',
    improvements.length > 0 ? improvements.map((item) => `• ${item}`).join('\n') : '• Fill missing sections to raise profile strength.',
  ].join('\n');
};

/**
 * Analyze LinkedIn profile
 * POST /api/linkedin/analyze
 */
const analyzeLinkedInProfile = async (req, res) => {
  try {
    // Debug: Log incoming request body
    console.log('Request Body:', req.body);

    // =====================
    // VALIDATION: Empty body check
    // =====================
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body is empty. Use Body → JSON in Thunder Client',
        hint: {
          method: 'POST',
          url: 'http://localhost:3000/api/linkedin/analyze',
          headers: { 'Content-Type': 'application/json' },
          body: { linkedinUrl: 'https://www.linkedin.com/in/username/' },
        },
      });
    }

    const { linkedinUrl } = req.body;

    // =====================
    // VALIDATION: linkedinUrl required
    // =====================
    if (!linkedinUrl) {
      return res.status(400).json({
        success: false,
        error: 'linkedinUrl is required. Please send linkedinUrl inside Body → JSON',
        example: {
          linkedinUrl: 'https://www.linkedin.com/in/username/',
        },
      });
    }

    // Validate URL format
    if (!apifyService.validateLinkedInUrl(linkedinUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid LinkedIn URL format. Expected format: https://www.linkedin.com/in/username',
      });
    }

    // Check if profile already exists in database (cache for 24 hours)
    const existingProfile = await UserProfile.findOne({
      linkedinUrl: linkedinUrl.trim(),
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (existingProfile) {
      const hoursSinceCreation =
        (Date.now() - existingProfile.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation < 24) {
        const cachedRoadmap = existingProfile.rawApifyData
          ? generateRoadmap(existingProfile.rawApifyData, {
              profileScore: existingProfile.profileScore,
              strengths: existingProfile.strengths,
              improvements: existingProfile.improvements,
            })
          : null;
        return res.json({
          success: true,
          data: {
            profileScore: existingProfile.profileScore,
            strengths: existingProfile.strengths,
            improvements: existingProfile.improvements,
            roadmap: cachedRoadmap,
            skills: cachedRoadmap?.skills || [],
          },
          cached: true,
        });
      }
    }

    // Scrape profile from Apify
    console.log(`Scraping LinkedIn profile: ${linkedinUrl}`);
    const rawProfileData = await apifyService.scrapeProfile(linkedinUrl);

    // Analyze profile
    const analysis = analyzeProfile(rawProfileData);
    const roadmap = generateRoadmap(rawProfileData, analysis);

    // Save to database
    const userProfile = new UserProfile({
      linkedinUrl: linkedinUrl.trim(),
      rawApifyData: rawProfileData,
      profileScore: analysis.profileScore,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      issues: analysis.issues,
    });

    await userProfile.save();

    // Return success response
    return res.json({
      success: true,
      data: {
        profileScore: analysis.profileScore,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        roadmap,
        skills: roadmap?.skills || [],
      },
    });
  } catch (error) {
    console.error('Error analyzing LinkedIn profile:', error);

    if (error.message.includes('Invalid LinkedIn URL')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.message.includes('quota exceeded') ||
      error.message.includes('rate limit')
    ) {
      return res.status(429).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('not found') || error.message.includes('private')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.message.includes('Apify actor requires') ||
      error.message.includes('Apify actor access forbidden')
    ) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get analysis history for a LinkedIn URL
 * GET /api/linkedin/history/:url
 */
const getAnalysisHistory = async (req, res) => {
  try {
    const { url } = req.params;
    const decodedUrl = decodeURIComponent(url);

    if (!apifyService.validateLinkedInUrl(decodedUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid LinkedIn URL format',
      });
    }

    const profiles = await UserProfile.find({
      linkedinUrl: decodedUrl.trim(),
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('profileScore strengths improvements createdAt')
      .lean();

    return res.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Analyze Resume
 * POST /api/linkedin/analyze-resume
 */
const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Resume file is required. Upload a PDF or DOCX file.',
      });
    }

    const resumeTextRaw = await extractResumeText(req.file);
    const resumeText = normalizeResumeText(resumeTextRaw);

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from the resume. Please upload a clearer PDF/DOCX.',
      });
    }

    let profileData;
    let structuredResume = null;

    if (process.env.OPENAI_API_KEY) {
      try {
        structuredResume = await extractResumeWithOpenAI(resumeText);
        profileData = buildResumeProfileDataFromStructured(structuredResume);
      } catch (error) {
        console.warn('OpenAI resume parsing failed, falling back to heuristic parsing:', error.message);
      }
    }

    if (!profileData) {
      profileData = buildResumeProfileData(resumeText);
    }
    const analysis = analyzeProfile(profileData);
    const roadmap = generateRoadmap(profileData, analysis);
    const improvedResume = buildGenAiResume({ profileData, analysis });

    const structuredForLatex =
      structuredResume || buildStructuredFromSections(profileData);
    const latexOriginal = buildLatexResume({
      data: structuredForLatex,
      analysis,
      variant: 'original',
    });
    const latexImproved = buildLatexResume({
      data: structuredForLatex,
      analysis,
      variant: 'improved',
    });

    return res.json({
      success: true,
      data: {
        profileScore: analysis.profileScore,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        roadmap,
        skills: roadmap?.skills || [],
        resume: {
          fileName: req.file.originalname,
          originalText: truncateText(resumeText, 4000),
          improvedText: truncateText(improvedResume, 3000),
          sections: profileData.resumeSections,
          structured: structuredResume,
          latexOriginal,
          latexImproved,
        },
      },
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze resume',
    });
  }
};

module.exports = {
  analyzeLinkedInProfile,
  analyzeResume,
  getAnalysisHistory,
};
