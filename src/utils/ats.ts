import { ResumeData, ATSReport } from '../types';

export const safeParseJson = <T,>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const STOP_WORDS = new Set([
  'and','or','the','a','an','to','of','in','for','with','on','at','by','from','as','is','are','be','this','that','it','you','your','our','their','they','we','i','will','can','able','about','over','into','per','performs','using'
]);

const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/g)
    .map(t => t.trim())
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
};

export const extractResumeKeywords = (resume: ResumeData): string[] => {
  const buckets: string[] = [];
  if (resume.header) {
    buckets.push(resume.header.title);
  }
  if (resume.summary) buckets.push(resume.summary);
  resume.skills?.forEach(skill => {
    buckets.push(skill.category);
    buckets.push(skill.items);
  });
  resume.experience?.forEach(job => {
    buckets.push(job.company, job.role, job.location, job.date);
    job.details?.forEach(detail => buckets.push(detail));
  });
  if (resume.education) {
    buckets.push(resume.education.degree, resume.education.school);
  }
  const tokens = buckets.flatMap(tokenize);
  return Array.from(new Set(tokens));
};

export const computeAtsReport = (jobDescription: string, resume: ResumeData): ATSReport => {
  const jdTokens = Array.from(new Set(tokenize(jobDescription)));
  const resumeTokens = new Set(extractResumeKeywords(resume));
  const matched = jdTokens.filter(token => resumeTokens.has(token));
  const missing = jdTokens.filter(token => !resumeTokens.has(token));
  const score = jdTokens.length === 0 ? 0 : Math.round((matched.length / jdTokens.length) * 100);
  const summary = jdTokens.length === 0 
    ? 'Provide a job description to see your ATS alignment.' 
    : `Matching ${matched.length} of ${jdTokens.length} target keywords.`;
  return {
    score,
    matchedKeywords: matched.slice(0, 25),
    missingKeywords: missing.slice(0, 25),
    summary
  };
};

export const buildAiPrompt = (resume: ResumeData, jobDescription: string, missing: string[]) => {
  return `
You are acting as both an ATS optimizer and a senior recruiter from Google/Meta/Amazon.
Rewrite the resume to maximize relevance and clarity while staying truthful and concise.
Rules:
- Keep the same JSON structure: header, summary, skills, experience, education.
- Keep bullet lists concise and impact-focused with metrics where available.
- Integrate missing/target keywords naturally (no stuffing).
- Do NOT invent roles, dates, or companies; only rephrase and emphasize what exists.
- Output ONLY JSON (no markdown fences, no commentary).

Job Description:
${jobDescription}

Missing / target keywords to weave in:
${missing.join(', ')}

Resume JSON to improve:
${JSON.stringify(resume, null, 2)}
`;
};

export const extractJsonFromText = (text: string): string | null => {
  if (!text) return null;
  const direct = safeParseJson<any>(text);
  if (direct) return text;
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    const trimmed = fenceMatch[1].trim();
    if (safeParseJson<any>(trimmed)) return trimmed;
  }
  const braceIndex = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (braceIndex !== -1 && lastBrace > braceIndex) {
    const candidate = text.slice(braceIndex, lastBrace + 1);
    if (safeParseJson<any>(candidate)) return candidate;
  }
  return null;
};
