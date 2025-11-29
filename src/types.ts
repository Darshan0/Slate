export type ResumeHeader = {
  name: string;
  title: string;
  email: string;
  phone: string;
  links: Array<ResumeLink | string>;
};

export type ResumeLink = {
  label: string;
  url: string;
};

export type ResumeSkill = {
  category: string;
  items: string;
};

export type ResumeJob = {
  company: string;
  location: string;
  role: string;
  date: string;
  details: string[];
};

export type ResumeEducation = {
  degree: string;
  school: string;
  date: string;
};

export type ResumeData = {
  header: ResumeHeader;
  summary: string;
  skills: ResumeSkill[];
  experience: ResumeJob[];
  education: ResumeEducation;
};

export type BuilderConfig = {
  fontFamily: string;
  baseFontSize: number;
  primaryColor: string;
  secondaryColor: string;
  skillsColumns: number;
  scale: number;
};

export type FontOption = {
  name: string;
  family: string;
};

export type ATSReport = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
};

export type AiStatus = 'idle' | 'processing' | 'done';

export type ModelStatus = {
  loading: boolean;
  selected: string | null;
  error: string | null;
  options: string[];
};

export type SectionId = 'summary' | 'skills' | 'experience' | 'education';
