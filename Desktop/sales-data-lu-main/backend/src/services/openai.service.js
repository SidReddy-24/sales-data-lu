/**
 * OpenAI Service
 * Uses GPT model to extract structured resume data.
 */

const OpenAI = require('openai');

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

const extractResponseText = (response) => {
  return response.choices[0].message.content || '';
};

const sanitizeList = (items = [], limit = 20) => {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const cleaned = [];
  items.forEach((item) => {
    const text = String(item || '').trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push(text);
    }
  });
  return cleaned.slice(0, limit);
};

const extractResumeWithOpenAI = async (resumeText) => {
  const client = getClient();
  if (!client) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  // Increase char limit for better context, gpt-4o can handle it
  const maxChars = 20000; 
  const trimmedText = resumeText.slice(0, maxChars);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert resume parser. Your task is to extract structured data from a resume text with extreme precision. \n' +
          'Follow these rules strictly:\n' +
          '1. **Contact Info**: Extract emails, phone numbers, and LinkedIn/portfolio links accurately. Do NOT put them in the body text or skills.\n' +
          '2. **Skills**: specific technical and soft skills. Avoid generic terms. Keep them as short phrases.\n' +
          '3. **Experience**: Extract job titles, company names, dates, and locations. For the description (bullets), extract the key responsibilities and achievements. Ensure the dates are in a consistent format (e.g., "Jan 2020 - Present").\n' +
          '4. **Education**: Extract degree, school, and dates.\n' +
          '5. **Summary**: Create a professional summary if one is not explicitly provided, or refine the existing one to be professional and concise (2-4 sentences).\n' +
          '6. **Projects**: Extract project names and brief descriptions if available.\n' +
          '7. **Missing Data**: If a field is missing, leave it as an empty string or empty array. Do not halluincate data.\n' +
          '8. **Output Format**: Return ONLY valid JSON adhering to the provided schema.',
      },
      {
        role: 'user',
        content: `Resume text:\n"""${trimmedText}"""`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'resume_extract',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            fullName: { type: 'string', description: "The candidate's full name." },
            headline: { type: 'string', description: "Professional headline (e.g. 'Senior Software Engineer')." },
            summary: { type: 'string', description: "Professional summary of the candidate." },
            contact: {
              type: 'object',
              additionalProperties: false,
              properties: {
                emails: { type: 'array', items: { type: 'string' } },
                phones: { type: 'array', items: { type: 'string' } },
                links: { type: 'array', items: { type: 'string' } },
                location: { type: 'string' },
              },
              required: ['emails', 'phones', 'links', 'location'],
            },
            skills: { type: 'array', items: { type: 'string' } },
            languages: { type: 'array', items: { type: 'string' } },
            experience: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  company: { type: 'string' },
                  dates: { type: 'string' },
                  location: { type: 'string' },
                  bullets: { type: 'array', items: { type: 'string' } },
                },
                required: ['title', 'company', 'dates', 'location', 'bullets'],
              },
            },
            education: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  school: { type: 'string' },
                  degree: { type: 'string' },
                  dates: { type: 'string' },
                },
                required: ['school', 'degree', 'dates'],
              },
            },
            projects: { type: 'array', items: { type: 'string' } },
            certifications: { type: 'array', items: { type: 'string' } },
            references: { type: 'array', items: { type: 'string' } },
          },
          required: [
            'fullName',
            'headline',
            'summary',
            'contact',
            'skills',
            'languages',
            'experience',
            'education',
            'projects',
            'certifications',
            'references',
          ],
        },
      },
    },
    temperature: 0.1, // Lower temperature for more deterministic/precise extraction
  });

  const text = extractResponseText(completion);
  if (!text) {
    throw new Error('OpenAI response was empty');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error('Failed to parse OpenAI response');
  }

  return {
    ...parsed,
    skills: sanitizeList(parsed.skills, 30),
    languages: sanitizeList(parsed.languages, 10),
    projects: sanitizeList(parsed.projects, 10),
    certifications: sanitizeList(parsed.certifications, 10),
    references: sanitizeList(parsed.references, 5),
    contact: {
      emails: sanitizeList(parsed.contact?.emails, 3),
      phones: sanitizeList(parsed.contact?.phones, 3),
      links: sanitizeList(parsed.contact?.links, 5),
      location: String(parsed.contact?.location || '').trim(),
    },
    experience: (parsed.experience || []).slice(0, 15),
    education: (parsed.education || []).slice(0, 5),
  };
};

module.exports = {
  extractResumeWithOpenAI,
};
