/**
 * Roadmap Controller
 * Generates counselor-ready roadmap pages.
 */

const apifyService = require('../services/apify.service');
const { extractResumeWithOpenAI } = require('../services/openai.service');
const { generateRoadmapWithOpenAI } = require('../services/roadmap.service');
const { analyzeProfile } = require('../utils/profileAnalyzer');
const {
  extractResumeText,
  normalizeResumeText,
  buildResumeProfileData,
  buildResumeProfileDataFromStructured,
} = require('../utils/resumeParser');
const Roadmap = require('../models/Roadmap.model');

const buildLinkedInContext = (profile) => {
  if (!profile) return null;
  const skills = Array.isArray(profile.skills)
    ? profile.skills.map((skill) => skill.title || skill.name || skill).filter(Boolean)
    : [];
  const experiences = Array.isArray(profile.experiences)
    ? profile.experiences.slice(0, 5)
    : [];
  const education = Array.isArray(profile.educations)
    ? profile.educations.slice(0, 3)
    : [];

  return {
    fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
    headline: profile.headline || '',
    about: profile.about || profile.summary || '',
    skills,
    experiences: experiences.map((exp) => ({
      title: exp.title,
      company: exp.companyName,
      dates: exp.jobStartedOn ? `${exp.jobStartedOn} - ${exp.jobEndedOn || 'Present'}` : '',
      location: exp.jobLocation || '',
      bullets: exp.jobDescription ? [exp.jobDescription] : [],
    })),
    education: education.map((edu) => ({
      school: edu.schoolName || edu.school || '',
      degree: edu.degree || '',
      dates: edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : '',
    })),
  };
};

const mergeProfiles = (resume, linkedin) => {
  if (!resume && !linkedin) return null;
  if (!resume) return linkedin;
  if (!linkedin) return resume;

  // Merge logic: Prioritize LinkedIn for recent info, Resume for depth
  const skills = Array.from(new Set([...(resume.skills || []), ...(linkedin.skills || [])]));

  return {
    fullName: linkedin.fullName || resume.fullName,
    headline: linkedin.headline || resume.headline,
    about: linkedin.about || resume.about,
    summary: linkedin.about || resume.about,
    skills,
    experiences: linkedin.experiences && linkedin.experiences.length > 0
      ? linkedin.experiences
      : resume.experiences,
    education: linkedin.education && linkedin.education.length > 0
      ? linkedin.education
      : resume.education,
    resumeSections: resume.resumeSections || {}
  };
};

const deriveHeadline = (lead, resume, linkedin) => {
  return (
    lead.currentRole ||
    resume?.headline ||
    linkedin?.headline ||
    `${lead.name} Professional`
  );
};

const generateRoadmap = async (req, res) => {
  try {
    const {
      name,
      currentRole,
      totalExperience,
      domain,
      targetOutcome,
      linkedinUrl,
      linkedinText,
    } = req.body;

    // Name requirement removed to support simplified form
    // We will attempt to extract name from LinkedIn or Resume later

    if (!linkedinUrl && !linkedinText && !req.file) {
      return res.status(400).json({
        success: false,
        error: 'Provide a LinkedIn URL, resume, or LinkedIn text.',
      });
    }

    let resumeProfile = null;
    let structuredResume = null;
    let resumeText = '';
    let linkedinProfile = null;

    // Parallelize independent tasks: Resume Parsing and LinkedIn Scraping
    const tasks = [];

    // Task 1: Resume Processing
    if (req.file) {
      tasks.push((async () => {
        const resumeTextRaw = await extractResumeText(req.file);
        resumeText = normalizeResumeText(resumeTextRaw);

        if (process.env.OPENAI_API_KEY) {
          try {
            structuredResume = await extractResumeWithOpenAI(resumeText);
            resumeProfile = buildResumeProfileDataFromStructured(structuredResume);
          } catch (error) {
            console.warn('OpenAI resume parsing failed:', error.message);
          }
        }

        if (!resumeProfile) {
          resumeProfile = buildResumeProfileData(resumeText);
        }
      })());
    }

    // Task 2: LinkedIn Scraping
    if (linkedinUrl) {
      tasks.push((async () => {
        try {
          const rawProfile = await apifyService.scrapeProfile(linkedinUrl);
          linkedinProfile = buildLinkedInContext(rawProfile);
        } catch (error) {
          console.warn('LinkedIn scrape failed:', error.message);
        }
      })());
    }

    // Wait for both tasks to complete
    await Promise.all(tasks);

    // New: Merge and Analyze
    const unifiedProfile = mergeProfiles(resumeProfile, linkedinProfile);
    const analysis = analyzeProfile(unifiedProfile);

    const resolvedName = name || unifiedProfile?.fullName || 'Candidate';

    const lead = {
      name: resolvedName,
      currentRole: currentRole || resumeProfile?.headline || linkedinProfile?.headline || '',
      totalExperience: totalExperience || '',
      domain: domain || 'AI & Tech',
      targetOutcome: targetOutcome || 'Job Switch',
      headline: deriveHeadline(
        { name: resolvedName, currentRole },
        resumeProfile,
        linkedinProfile
      ),
    };

    const roadmapData = await generateRoadmapWithOpenAI({
      lead,
      resume: structuredResume || resumeProfile,
      linkedin: linkedinProfile,
      linkedinText,
    });

    const doc = await Roadmap.create({
      lead,
      inputs: {
        linkedinUrl: linkedinUrl || '',
        linkedinText: linkedinText || '',
        resumeFileName: req.file?.originalname || '',
        resumeUsed: Boolean(req.file),
        linkedinUsed: Boolean(linkedinUrl),
      },
      data: roadmapData,
    });

    const baseUrl =
      process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
    const shareUrl = `${baseUrl}/career-roadmap-LUWP?roadmapId=${doc._id}`;

    // Return analyzer results so frontend can sync
    const analyzerResults = {
      profileScore: analysis.profileScore,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      roadmap: roadmapData, // The roadmap generated
      skills: unifiedProfile?.skills || [],
      resume: req.file ? {
        fileName: req.file.originalname,
        sections: resumeProfile?.resumeSections,
        structured: structuredResume
      } : null
    };

    return res.json({
      success: true,
      id: doc._id,
      shareUrl,
      data: roadmapData,
      analyzerResults // For automatic population of Analyzer tool
    });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate roadmap',
    });
  }
};

const getRoadmapById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Roadmap.findById(id).lean();
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap not found',
      });
    }

    return res.json({
      success: true,
      data: doc.data,
      lead: doc.lead,
      inputs: doc.inputs,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch roadmap',
    });
  }
};

module.exports = {
  generateRoadmap,
  getRoadmapById,
};
