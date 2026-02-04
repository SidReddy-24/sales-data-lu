/**
 * Roadmap Service
 * Generates counselor-ready roadmap JSON using OpenAI.
 */

const OpenAI = require('openai');

const PROGRAM_CURRICULUM = `
12-week AI Program Curriculum (base)
Weeks 1-3: AI as a Work Assistant, Thinking in Tasks, not Prompts, AI for Structured Thinking, Decision Support using AI,How LLMs Behave (Practical),AI Risk, Cost & Reliability.
Weeks 4-6: AI for Writing & Structure, AI for Presentations, Asking the Right Data Questions, Visualizing Insights, AI Video & Voice, Knowledge Transfer Systems.
Weeks 7-9: Automation Thinking, AI inside Workflows, AI Agents Basics, Human-in-the-Loop Design, Vibe Coding, APIs & Data Flow.
Weeks 10-12: Problem selection, ROI framing, System design, Capstone Architecture(project), Integration, Testing, Iteration, Working Product(Project), Demo storytelling, Resume & LinkedIn, Interview narratives, Live Demo + Portfolio (Projects).
`;

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

const extractResponseText = (response) => {
  return response.choices[0].message.content || '';
};

const generateRoadmapWithOpenAI = async ({ lead, resume, linkedin, linkedinText }) => {
  const client = getClient();
  if (!client) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const inputPayload = {
    lead,
    resume,
    linkedin,
    linkedinText: linkedinText || '',
  };

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a roadmap generator for sales counselors. \n' +
          '**Data Merging Task**: You will receiving a `resume` object and a `linkedin` object (optional). \n' +
          '1. **INTEGRATE**: Combine information from both sources to create a unified profile. \n' +
          '   - Use LinkedIn for the most recent roles/titles if resume is outdated.\n' +
          '   - Use Resume for detailed project descriptions and older history.\n' +
          '   - Consolidate all skills found in both.\n' +
          '2. **GENERATE**: Based on this unified profile, output premium, positive, highly personalized content. Reference specific skills/tools/projects from the input. Avoid generic phrasing.',
      },
      {
        role: 'user',
        content:
          `Generate a Career Roadmap + Course Fitment JSON for a lead using this input:\n` +
          `${JSON.stringify(inputPayload, null, 2)}\n\n` +
          `Program curriculum base (use this to map phases):\n${PROGRAM_CURRICULUM}\n\n` +
          'Rules:\n' +
          '- Output must be valid JSON only (no markdown, no extra text).\n' +
          '- Be specific: cite 3+ concrete tools/skills/projects from the input across sections.\n' +
          '- Always be positive: emphasize closeness to goal.\n' +
          '- Readiness percent between 60 and 90; confidenceLine should mention targetRole.\n' +
          '- Strengths: exactly 3. Gaps: 3-5. Next roles: 5-8.\n' +
          '- For each next role: include a 2-3 sentence description explaining what the job entails (responsibilities, day-to-day work).\n' +
          '- For each next role: include 4-6 relevant companies that hire for this role (mix of product companies, startups, enterprises).\n' +
          '- Course phases: 4-5 phases spanning 12 weeks (Weeks 1-3, 4-6, 7-9, 10-12).\n' +
          '- Course phases must map to gaps (use gap phrases in closesGaps).\n' +
          '- Salary ranges in INR LPA: entry/mid should be like "₹8" and "₹14" (no LPA), note mentions market ranges.\n' +
          '- Projects: 4-6 total; include domain-aligned examples and showcase tips.\n' +
          '- If any input field is missing, infer based on resume/LinkedIn context and target outcome.\n',
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'roadmap_creator',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            profile: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                headline: { type: 'string' },
                currentRole: { type: 'string' },
                totalExperience: { type: 'string' },
                domain: { type: 'string' },
                targetOutcome: { type: 'string' },
                targetRole: { type: 'string' },
              },
              required: [
                'name',
                'headline',
                'currentRole',
                'totalExperience',
                'domain',
                'targetOutcome',
                'targetRole',
              ],
            },
            snapshot: {
              type: 'object',
              additionalProperties: false,
              properties: {
                whereYouStand: { type: 'string' },
                readinessPercent: { type: 'number' },
                ctaLine: { type: 'string' },
                confidenceLine: { type: 'string' },
              },
              required: ['whereYouStand', 'readinessPercent', 'ctaLine', 'confidenceLine'],
            },
            currentState: {
              type: 'object',
              additionalProperties: false,
              properties: {
                role: { type: 'string' },
                skillsByCategory: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    tools: { type: 'array', items: { type: 'string' } },
                    concepts: { type: 'array', items: { type: 'string' } },
                    projects: { type: 'array', items: { type: 'string' } },
                    softSkills: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['tools', 'concepts', 'projects', 'softSkills'],
                },
                strengths: { type: 'array', items: { type: 'string' } },
                gaps: { type: 'array', items: { type: 'string' } },
              },
              required: ['role', 'skillsByCategory', 'strengths', 'gaps'],
            },
            nextRoles: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  role: { type: 'string' },
                  description: { type: 'string' },
                  whyFit: { type: 'string' },
                  companies: { type: 'array', items: { type: 'string' } },
                  missingSkills: { type: 'array', items: { type: 'string' } },
                  salaryRange: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      entry: { type: 'string' },
                      mid: { type: 'string' },
                      note: { type: 'string' },
                    },
                    required: ['entry', 'mid', 'note'],
                  },
                },
                required: ['role', 'description', 'whyFit', 'companies', 'missingSkills', 'salaryRange'],
              },
            },
            courseFitment: {
              type: 'object',
              additionalProperties: false,
              properties: {
                phases: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      title: { type: 'string' },
                      weeks: { type: 'string' },
                      learn: { type: 'array', items: { type: 'string' } },
                      closesGaps: { type: 'array', items: { type: 'string' } },
                      outputs: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['title', 'weeks', 'learn', 'closesGaps', 'outputs'],
                  },
                },
              },
              required: ['phases'],
            },
            projectsOutcome: {
              type: 'object',
              additionalProperties: false,
              properties: {
                totalProjects: { type: 'string' },
                examples: { type: 'array', items: { type: 'string' } },
                showcase: { type: 'array', items: { type: 'string' } },
              },
              required: ['totalProjects', 'examples', 'showcase'],
            },
            closing: {
              type: 'object',
              additionalProperties: false,
              properties: {
                ifNothing: { type: 'string' },
                ifComplete: { type: 'string' },
                deltaPotential: { type: 'string' },
                cta: { type: 'string' },
              },
              required: ['ifNothing', 'ifComplete', 'deltaPotential', 'cta'],
            },
          },
          required: [
            'profile',
            'snapshot',
            'currentState',
            'nextRoles',
            'courseFitment',
            'projectsOutcome',
            'closing',
          ],
        },
      },
    },
    temperature: 0.3,
  });

  const text = extractResponseText(completion);
  if (!text) {
    throw new Error('OpenAI response was empty');
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Failed to parse roadmap JSON');
  }
};

module.exports = {
  generateRoadmapWithOpenAI,
};
