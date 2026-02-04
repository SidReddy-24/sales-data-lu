/**
 * Resume LaTeX Builder
 * Generates LaTeX resume text for compilation/rendering.
 */

const escapeLatex = (text = '') =>
  String(text)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\^/g, '\\^{}')
    .replace(/~/g, '\\~{}')
    .trim();

const joinInline = (items = []) =>
  items.filter(Boolean).map(escapeLatex).join(' \\quad ');

const toItemize = (items = []) => {
  if (!items || items.length === 0) {
    return '\\textit{Not provided.}';
  }
  return [
    '\\begin{itemize}[leftmargin=*]',
    ...items.map((item) => `\\item ${escapeLatex(item)}`),
    '\\end{itemize}',
  ].join('\n');
};

const renderExperience = (experience = []) => {
  if (!experience || experience.length === 0) {
    return '\\textit{Not provided.}';
  }

  return experience
    .map((exp) => {
      const header = [
        escapeLatex(exp.title),
        escapeLatex(exp.company),
        escapeLatex(exp.location),
        escapeLatex(exp.dates),
      ]
        .filter(Boolean)
        .join(' \\quad ');
      const bullets = toItemize(exp.bullets || []);
      return `${header}\n${bullets}`;
    })
    .join('\n\n');
};

const renderEducation = (education = []) => {
  if (!education || education.length === 0) {
    return '\\textit{Not provided.}';
  }

  return education
    .map((edu) => {
      const parts = [
        escapeLatex(edu.degree),
        escapeLatex(edu.school),
        escapeLatex(edu.dates),
      ].filter(Boolean);
      return parts.join(' \\quad ');
    })
    .join('\\par\n');
};

const buildLatexResume = ({ data, analysis, variant = 'original' }) => {
  const fullName = escapeLatex(data.fullName || 'Professional');
  const headline = escapeLatex(data.headline || '');
  const summary = escapeLatex(data.summary || '');

  const contact = data.contact || {};
  const contactLine = joinInline([
    contact.location,
    contact.emails?.[0],
    contact.phones?.[0],
    contact.links?.[0],
  ]);

  const latexSections = [
    '\\documentclass[11pt]{article}',
    '\\usepackage[margin=1in]{geometry}',
    '\\usepackage{enumitem}',
    '\\usepackage[T1]{fontenc}',
    '\\begin{document}',
    `\\begin{center}\\LARGE\\textbf{${fullName}}\\end{center}`,
    headline ? `\\begin{center}${headline}\\end{center}` : '',
    contactLine ? `\\begin{center}${contactLine}\\end{center}` : '',
    '\\section*{Professional Summary}',
    summary || '\\textit{Not provided.}',
    '\\section*{Core Skills}',
    data.skills?.length ? joinInline(data.skills) : '\\textit{Not provided.}',
    data.languages?.length ? `\\par Languages: ${joinInline(data.languages)}` : '',
    '\\section*{Experience}',
    renderExperience(data.experience),
    '\\section*{Education}',
    renderEducation(data.education),
  ];

  if (data.projects?.length) {
    latexSections.push('\\section*{Projects}', toItemize(data.projects));
  }
  if (data.certifications?.length) {
    latexSections.push('\\section*{Certifications}', toItemize(data.certifications));
  }

  if (variant === 'improved' && analysis) {
    latexSections.push(
      '\\section*{Impact Highlights}',
      toItemize(analysis.strengths || []),
      '\\section*{Growth Opportunities}',
      toItemize(analysis.improvements || [])
    );
  }

  latexSections.push('\\end{document}');

  return latexSections.filter(Boolean).join('\n');
};

const buildStructuredFromSections = (profileData) => {
  const sections = profileData.resumeSections || {};
  const experience = (sections.experience || []).map((item) => ({
    title: item,
    company: '',
    dates: '',
    location: '',
    bullets: [],
  }));
  const education = (sections.education || []).map((item) => ({
    school: item,
    degree: '',
    dates: '',
  }));

  return {
    fullName: profileData.fullName,
    headline: profileData.headline,
    summary: profileData.summary,
    contact: sections.contact || {},
    skills: sections.skills || [],
    languages: sections.languages || [],
    experience,
    education,
    projects: sections.projects || [],
    certifications: sections.certifications || [],
    references: sections.references || [],
  };
};

module.exports = {
  buildLatexResume,
  buildStructuredFromSections,
};
