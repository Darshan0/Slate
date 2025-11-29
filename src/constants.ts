import { ResumeData, BuilderConfig, FontOption } from './types';

export const INITIAL_DATA: ResumeData = {
  header: {
    name: "Your Name",
    title: "Your Title",
    email: "you@example.com",
    phone: "+1 (555) 123-4567",
    links: [
      { label: "LinkedIn", url: "" },
      { label: "GitHub", url: "" },
      { label: "Medium", url: "" }
    ]
  },
  summary: "Briefly describe your experience, strengths, and what you are looking for in your next role.",
  skills: [
    { category: "Languages", items: "JavaScript, TypeScript, Python" },
    { category: "Frameworks", items: "React, Node.js, Express" },
    { category: "Cloud & Tools", items: "AWS, Docker, Git, CI/CD" }
  ],
  experience: [
    {
      company: "Company One",
      location: "City, Country",
      role: "Job Title",
      date: "Start – End",
      details: [
        "Summarize a key accomplishment with impact.",
        "Highlight a responsibility or project you owned."
      ]
    },
    {
      company: "Company Two",
      location: "City, Country",
      role: "Job Title",
      date: "Start – End",
      details: [
        "Share a measurable improvement you delivered.",
        "Call out tools/tech used in the role."
      ]
    }
  ],
  education: [
    {
      degree: "Degree or Certification",
      school: "School or University",
      date: "Year – Year"
    }
  ]
};

export const INITIAL_CONFIG: BuilderConfig = {
  fontFamily: 'Montserrat',
  baseFontSize: 12,
  primaryColor: '#3f51b5',
  secondaryColor: '#374151',
  skillsColumns: 1,
  scale: 1
};

export const FONTS: FontOption[] = [
  { name: 'Montserrat', family: "'Montserrat', sans-serif" },
  { name: 'Roboto', family: "'Roboto', sans-serif" },
  { name: 'Lato', family: "'Lato', sans-serif" },
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
  { name: 'Merriweather', family: "'Merriweather', serif" },
];

export const STORAGE_KEYS = {
  data: 'resume-builder:data',
  config: 'resume-builder:config',
  geminiKey: 'resume-builder:gemini-key'
};
