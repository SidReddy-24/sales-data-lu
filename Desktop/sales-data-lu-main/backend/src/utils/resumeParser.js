/**
 * Resume Parser Utilities
 * Extracts text and parses resume sections.
 */

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

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
  const experienceCount = Math.max(
    1,
    experienceMarkers.length || (experienceLines.length > 0 ? 2 : 1)
  );
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

module.exports = {
  normalizeResumeText,
  extractResumeText,
  buildResumeProfileData,
  buildResumeProfileDataFromStructured,
};
