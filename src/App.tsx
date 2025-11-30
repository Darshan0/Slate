import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeData, BuilderConfig, FontOption, ResumeLink, ATSReport, AiStatus, ModelStatus, SectionId, ResumeHeader } from './types';
import { INITIAL_DATA, INITIAL_CONFIG, FONTS, STORAGE_KEYS } from './constants';
import { A4_HEIGHT_MM, GAP_HEIGHT_MM, A4_HEIGHT_PX, VISUAL_PAGE_HEIGHT_PX, PAGE_MARGIN_TOP_PX, PAGE_BOTTOM_BUFFER_PX } from './utils/layout';
import { computeAtsReport, buildAiPrompt, extractJsonFromText, safeParseJson } from './utils/ats';
import { Stage, Layer, Rect, Text } from 'react-konva';

declare global {
  interface Window {
    html2pdf?: any;
  }
}

// --- Icons (UI Only) ---
const DownloadIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const EditIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const PaletteIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="13.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="10.5" r="2.5" />
    <circle cx="8.5" cy="7.5" r="2.5" />
    <circle cx="6.5" cy="12.5" r="2.5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const AlertCircleIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const MailIcon = ({ size = 14, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <polyline points="3 7 12 13 21 7" />
  </svg>
);

const PhoneIcon = ({ size = 14, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.11 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2L8.09 9.91a16 16 0 0 0 6 6l1.38-1.38a2 2 0 0 1 2-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const LinkIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l2.42-2.42a5 5 0 0 0-7.07-7.07l-1.57 1.57" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-2.42 2.42a5 5 0 0 0 7.07 7.07l1.57-1.57" />
  </svg>
);

const LinkedInIcon = ({ size = 14, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8.34 18H5.67v-8h2.67ZM7 8.34a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1Zm11 9.66h-2.67v-3.93c0-1.04-.38-1.75-1.33-1.75-.72 0-1.15.48-1.34.95-.07.16-.09.39-.09.62V18H9.9s.04-6.74 0-8h2.67v1.13c.36-.56 1-.14 1.5-.73.57-.66 1.37-.97 2.2-.97 1.59 0 2.73 1.04 2.73 3.28Z" />
  </svg>
);

const GitHubIcon = ({ size = 14, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.23-.01-.82-.01-1.6-2.5.54-3.03-1.2-3.03-1.2a2.38 2.38 0 0 0-1-1.31c-.82-.56.06-.55.06-.55a1.87 1.87 0 0 1 1.37.92 1.9 1.9 0 0 0 2.57.74 1.9 1.9 0 0 1 .57-1.19c-2-.23-4.1-1-4.1-4.37a3.43 3.43 0 0 1 .92-2.38 3.18 3.18 0 0 1 .09-2.35s.76-.24 2.5.9a8.6 8.6 0 0 1 4.56 0c1.73-1.14 2.5-.9 2.5-.9.33.74.36 1.58.1 2.35a3.43 3.43 0 0 1 .92 2.38c0 3.39-2.1 4.14-4.1 4.36a2.13 2.13 0 0 1 .6 1.66c0 1.2-.01 2.17-.01 2.47 0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
  </svg>
);

const MediumIcon = ({ size = 14, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4 7.5c0-.33.1-.64.3-.9L3 5V4h4l3 6.5L12.9 4H17v1l-1 1.5v7.57l1 1.43v1h-4v-1l1-1.43V8.1l-3.08 7.4h-.52L6.2 7.58V14l1 1.43V16H4v-.57L5 14V7.5Z" />
    <circle cx="19" cy="11" r="1" />
  </svg>
);

const ShieldCheckIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3l7 3v5c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-3z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const LayoutGridIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

// --- Default Data ---
declare global {
  interface Window {
    html2pdf?: any;
  }
}

const formatJson = (value: ResumeData) => JSON.stringify(value, null, 2);

const loadStoredData = (): ResumeData | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.data);
  if (!raw) return null;
  return safeParseJson<ResumeData>(raw);
};

const loadStoredConfig = (): Partial<BuilderConfig> | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.config);
  if (!raw) return null;
  return safeParseJson<BuilderConfig>(raw);
};

const loadSessionApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(STORAGE_KEYS.geminiKey) || '';
};


const validateResumeData = (value: ResumeData): string | null => {
  const header = (value as any).header;
  if (!header || typeof header !== 'object') return 'Missing "header" object.';
  const requiredHeaderFields: Array<keyof ResumeHeader> = ['name', 'title', 'email', 'phone', 'links'];
  const missingHeader = requiredHeaderFields.find((key) => header[key] === undefined || header[key] === null);
  if (missingHeader) return `Header is missing "${missingHeader}".`;
  if (!Array.isArray(header.links)) return '"header.links" must be an array.';
  const badLink = header.links.find((link: any) => {
    if (typeof link === 'string') return false;
    if (!link?.label || link?.url === undefined || link?.url === null) return true;
    if (typeof link.url === 'string' && !link.url.trim()) return false; // allow empty optional urls
    return false;
  });
  if (badLink) return '"header.links" items must be strings or objects with "label" and "url".';

  if (typeof (value as any).summary !== 'string') return '"summary" must be a string.';

  const skills = (value as any).skills;
  if (!Array.isArray(skills)) return '"skills" must be an array.';
  const badSkill = skills.find((skill: any) => typeof skill?.category !== 'string' || typeof skill?.items !== 'string');
  if (badSkill) return 'Each skill needs "category" and "items" strings.';

  const experience = (value as any).experience;
  if (!Array.isArray(experience)) return '"experience" must be an array.';
  const badJob = experience.find((job: any) => !job?.company || !job?.role || !Array.isArray(job?.details));
  if (badJob) return 'Each experience needs "company", "role", and a "details" array.';

  const education = (value as any).education;
  if (!Array.isArray(education)) return '"education" must be an array.';
  const badEdu = education.find((edu: any) => !edu?.degree || !edu?.school);
  if (badEdu) return 'Each education needs "degree" and "school".';

  return null;
};

const normalizeResumeData = (value: ResumeData): ResumeData => {
  const experienceArr = Array.isArray(value.experience) ? value.experience : [];
  const cleanedExperience = experienceArr.map((job: any) => ({
    company: job?.company ?? '',
    role: job?.role ?? '',
    location: job?.location ?? '',
    date: job?.date ?? '',
    details: Array.isArray(job?.details) ? job.details : []
  }));
  const education = (value as any).education;
  const educationArr = Array.isArray(education)
    ? education
    : education
    ? [education]
    : [{ degree: '', school: '', date: '' }];
  const cleanedEducation = educationArr.map((edu: any) => ({
    degree: edu?.degree ?? '',
    school: edu?.school ?? '',
    date: edu?.date ?? ''
  }));
  return { ...value, education: cleanedEducation, experience: cleanedExperience };
};

export default function ResumeBuilder() {
  const storedData = loadStoredData();
  const normalizedStored = storedData ? normalizeResumeData(storedData) : null;
  const initialData = normalizedStored && !validateResumeData(normalizedStored)
    ? normalizedStored
    : normalizeResumeData(INITIAL_DATA);
  const initialConfig = { ...INITIAL_CONFIG, ...(loadStoredConfig() ?? {}) };

  const [jsonInput, setJsonInput] = useState(() => formatJson(initialData));
  const [data, setData] = useState<ResumeData>(initialData);
  const [config, setConfig] = useState<BuilderConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<'json' | 'design' | 'ats' | 'layout'>('json'); 
  const [dataViewMode, setDataViewMode] = useState<'json' | 'ui'>('ui');
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [atsReport, setAtsReport] = useState<ATSReport>(() => computeAtsReport('', initialData));
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => loadSessionApiKey());
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ loading: false, selected: null, error: null, options: [] });
  const [showAllMatched, setShowAllMatched] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState<'LinkedIn' | 'GitHub' | 'Medium' | 'Custom'>('LinkedIn');
  const [customLinkLabel, setCustomLinkLabel] = useState('');
  const [uiFormTab, setUiFormTab] = useState<'info' | 'skills'>('info');
  const UI_INPUT_CLASS = "w-full p-3 border border-gray-200 rounded focus:outline-none focus:border-[#3f51b5]";
  const UI_TEXTAREA_CLASS = "w-full p-3 border border-gray-200 rounded focus:outline-none focus:border-[#3f51b5]";
  const UI_MULTILINE_INPUT_CLASS = `${UI_INPUT_CLASS} min-h-[44px] resize-none leading-snug`;
  const EMPTY_DATA: ResumeData = {
    header: { name: '', title: '', email: '', phone: '', links: [] },
    summary: '',
    skills: [],
    experience: [],
    education: []
  };
  const LAYOUT_ITEM_HEIGHT = 40;
  const LAYOUT_ROW_GAP = 10;
  const LAYOUT_HORIZONTAL_PADDING = 12;
  const LAYOUT_TOP_PADDING = 16;
  const LAYOUT_BOTTOM_PADDING = 40;
  const LAYOUT_CARD_COLOR = '#ffffff';
  const LAYOUT_CARD_BORDER = '#d6deea';
  const LAYOUT_CARD_SHADOW = '#304ffe';
  const LAYOUT_ACCENT_COLOR = '#304ffe';
  const layoutRowSpacing = LAYOUT_ITEM_HEIGHT + LAYOUT_ROW_GAP;

  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(['summary', 'skills', 'experience', 'education']);
  const [sectionPositions, setSectionPositions] = useState<Record<SectionId, number>>({
    summary: LAYOUT_TOP_PADDING,
    skills: LAYOUT_TOP_PADDING + layoutRowSpacing,
    experience: LAYOUT_TOP_PADDING + layoutRowSpacing * 2,
    education: LAYOUT_TOP_PADDING + layoutRowSpacing * 3
  });
  const [stageWidth, setStageWidth] = useState(420);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const resumeRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const layoutCanvasRef = useRef<HTMLDivElement | null>(null);

  const linkItems: ResumeLink[] = (data.header?.links || []).map((link) => {
    if (typeof link === 'string') {
      const safeUrl = link.startsWith('http') ? link : '#';
      return { label: link, url: safeUrl };
    }
    return link;
  });

  useEffect(() => {
    if (window.html2pdf) {
      setPdfReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    script.onload = () => setPdfReady(true);
    script.onerror = () => setPdfReady(false);
    document.body.appendChild(script);
    return () => {
      setPdfReady(false);
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(data));
    } catch (e) {
      console.warn('Unable to persist resume data', e);
    }
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
    } catch (e) {
      console.warn('Unable to persist builder config', e);
    }
  }, [config]);

  useEffect(() => {
    setAtsReport(computeAtsReport(jobDescription, data));
  }, [jobDescription, data]);

  useEffect(() => {
    try {
      if (apiKey) {
        sessionStorage.setItem(STORAGE_KEYS.geminiKey, apiKey);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.geminiKey);
      }
    } catch (e) {
      console.warn('Unable to persist API key in sessionStorage', e);
    }
  }, [apiKey]);

  useEffect(() => {
    // Ensure positions exist for all sections
    setSectionPositions((prev) => {
      const next = { ...prev };
      sectionOrder.forEach((id, idx) => {
        if (next[id] === undefined) next[id] = LAYOUT_TOP_PADDING + idx * layoutRowSpacing;
      });
      return next;
    });
  }, [sectionOrder]);

  // Re-normalize positions when layout sizing changes so cards stay visible
  useEffect(() => {
    setSectionPositions((prev) => {
      const stageHeight = LAYOUT_TOP_PADDING + sectionOrder.length * layoutRowSpacing + LAYOUT_BOTTOM_PADDING;
      const minY = LAYOUT_TOP_PADDING;
      const maxY = stageHeight - LAYOUT_ITEM_HEIGHT - LAYOUT_BOTTOM_PADDING;
      const next: Record<SectionId, number> = { ...prev };
      sectionOrder.forEach((id, idx) => {
        const fallback = LAYOUT_TOP_PADDING + idx * layoutRowSpacing;
        const current = next[id] ?? fallback;
        next[id] = Math.min(maxY, Math.max(minY, current));
      });
      return next;
    });
  }, [layoutRowSpacing, LAYOUT_TOP_PADDING, LAYOUT_BOTTOM_PADDING, sectionOrder]);

  useEffect(() => {
    if (!layoutCanvasRef.current) return;
    const measure = () => {
      const width = layoutCanvasRef.current?.clientWidth || 420;
      setStageWidth(Math.max(320, Math.min(width, 800)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(layoutCanvasRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const syncViewport = () => {
      if (typeof window === 'undefined') return;
      const narrow = window.innerWidth < 1024;
      setIsMobileLayout(narrow);
      if (!narrow) {
        setIsEditorOpen(true);
      }
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    if (isMobileLayout) {
      setIsEditorOpen(false);
    }
  }, [isMobileLayout]);

const refreshModelSelection = async (key: string) => {
    setModelStatus({ loading: true, selected: null, error: null, options: [] });
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key.trim()}`);
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Failed to list models (${resp.status})`);
      }
      const json = await resp.json();
      const models: Array<{ name: string; supportedGenerationMethods?: string[] }> = json?.models || [];
      const generative = models.filter(m => m.supportedGenerationMethods?.includes('generateContent'));
      // Prefer flash models to reduce quota usage, else first available
      const preferred = generative.find(m => m.name?.toLowerCase().includes('flash')) || generative[0];
      const fallback = models.length ? models[0] : null;
      const selected = preferred?.name || fallback?.name || null;
      const options = generative.map(m => m.name).filter(Boolean);
      if (!selected) throw new Error('No models available for this API key.');
      setModelStatus({ loading: false, selected, error: null, options });
      return selected;
    } catch (err: any) {
      console.error(err);
      setModelStatus({ loading: false, selected: null, error: err?.message || 'Unable to list models.', options: [] });
      return null;
    }
  };

  const handleAiRefine = async () => {
    if (!jobDescription.trim()) {
      setAiMessage('Add a job description first to generate suggestions.');
      setActiveTab('ats');
      return;
    }
    const missing = atsReport.missingKeywords;
    if (!apiKey.trim()) {
      setAiMessage('Add your Gemini API key to run AI refine (stored only for this session).');
      setActiveTab('ats');
      return;
    }

    setAiStatus('processing');
    setAiMessage(null);

    try {
      const selectedModel = modelStatus.selected || await refreshModelSelection(apiKey);
      if (!selectedModel) {
        setAiMessage('Unable to resolve a supported model. Check your API key or permissions.');
        setAiStatus('done');
        window.setTimeout(() => setAiStatus('idle'), 1200);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: selectedModel });
      const prompt = buildAiPrompt(data, jobDescription, missing);
      const result = await model.generateContent(prompt);
      const content = result?.response?.text()?.trim();
      const extracted = content ? extractJsonFromText(content) : null;
      const parsed = extracted ? safeParseJson<ResumeData>(extracted) : null;
      if (!parsed || validateResumeData(parsed)) {
        throw new Error('AI response was not valid resume JSON. Please try again or switch model.');
      }

      setData(parsed);
      setJsonInput(formatJson(parsed));
      setAiMessage('AI refined the resume. Review and adjust as needed.');
    } catch (err: any) {
      console.error(err);
      setAiMessage(err?.message || 'Unable to refine with AI. Please try again.');
    } finally {
      setAiStatus('done');
      window.setTimeout(() => setAiStatus('idle'), 1200);
    }
  };

  // --- Layout Calculation ---
  const recalculateLayout = () => {
    if (!contentRef.current || !resumeRef.current) return;

    // We now target .resume-element which are granular (headers, lis, ps)
    const elements = contentRef.current.querySelectorAll('.resume-element');
    if (elements.length === 0) return;

    // 1. Reset all margins to allow natural flow
    elements.forEach((el) => {
      (el as HTMLElement).style.marginTop = '0px';
    });

    // 2. Get container position
    const pageContainerRect = resumeRef.current.getBoundingClientRect();
    
    // 3. Iterate and check positions
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      
      // Get LIVE position (important because previous iterations might have moved content down)
      const rect = el.getBoundingClientRect();
      const relativeTop = rect.top - pageContainerRect.top;
      const relativeBottom = relativeTop + rect.height;

      // Current Page Calculation
      const pageIndex = Math.floor(relativeTop / VISUAL_PAGE_HEIGHT_PX);
      const pageStart = pageIndex * VISUAL_PAGE_HEIGHT_PX;
      const pageEnd = pageStart + A4_HEIGHT_PX; 
      const safeLimit = pageEnd - PAGE_BOTTOM_BUFFER_PX;

      // Check if THIS specific small element crosses the safe limit
      if (relativeBottom > safeLimit) {
        
        // Calculate where the content area of the NEXT page begins
        const nextPageStartIndex = pageIndex + 1;
        const nextPageContentStart = (nextPageStartIndex * VISUAL_PAGE_HEIGHT_PX) + PAGE_MARGIN_TOP_PX;
        
        // Calculate margin needed to push THIS element to the next page
        const pushAmount = nextPageContentStart - relativeTop;
        
        if (pushAmount > 0) {
             el.style.marginTop = `${pushAmount}px`;
        }
      }
    }
  };

  // --- Layout Effects ---
  useLayoutEffect(() => {
    // Run layout calculation when data/config changes
    window.requestAnimationFrame(() => {
       recalculateLayout();
    });
  }, [data, config]); 

  // Add ResizeObserver
  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
       window.requestAnimationFrame(() => {
         if (!Array.isArray(entries) || !entries.length) return;
         recalculateLayout();
      });
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonInput(value);
    if (!value.trim()) {
      setData(EMPTY_DATA);
      setError(null);
      return;
    }
    const parsed = safeParseJson<ResumeData>(value);
    if (!parsed) {
      setError("Invalid JSON format. Please check your syntax.");
      return;
    }
    const validationMessage = validateResumeData(parsed);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setData(parsed);
    setError(null);
  };

  const syncData = (next: ResumeData) => {
    setData(next);
    setJsonInput(formatJson(next));
    setError(null);
  };

  const handleConfigChange = (key: keyof BuilderConfig, value: BuilderConfig[keyof BuilderConfig]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFormatJson = () => {
    const parsed = safeParseJson<ResumeData>(jsonInput);
    if (!parsed) {
      setError("Invalid JSON format. Please check your syntax.");
      return;
    }
    const validationMessage = validateResumeData(parsed);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setJsonInput(formatJson(parsed));
    setData(parsed);
    setError(null);
  };

  const handleReset = () => {
    setData(INITIAL_DATA);
    setConfig(INITIAL_CONFIG);
    setJsonInput(formatJson(INITIAL_DATA));
    setJobDescription('');
    setAtsReport(computeAtsReport('', INITIAL_DATA));
    setSectionOrder(['summary', 'skills', 'experience', 'education']);
    setSectionPositions({
      summary: 0,
      skills: 90,
      experience: 180,
      education: 270
    });
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.data);
      localStorage.removeItem(STORAGE_KEYS.config);
    }
  };

  const applyInlineFormat = (command: 'bold' | 'italic' | 'underline' | 'createLink') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    if (command === 'createLink') {
      const url = window.prompt('Enter URL');
      if (!url) return;
      document.execCommand('createLink', false, url);
    } else {
      document.execCommand(command, false);
    }
  };

  const renderSection = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'summary':
        return (
          <div key="summary" className="mb-6">
            <h3 className="resume-element text-sm font-bold uppercase tracking-widest border-b-2 pb-1 mb-2" style={{ color: '#111827', borderColor: config.primaryColor }}>
              Professional Summary
            </h3>
            <p
              className="resume-element text-xs leading-5 text-justify font-medium outline-none"
              style={{ color: config.secondaryColor }}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = { ...data, summary: e.currentTarget.innerHTML };
                syncData(next);
              }}
              dangerouslySetInnerHTML={{ __html: data.summary }}
            />
          </div>
        );
      case 'skills':
        return (
          <div key="skills" className="mb-6">
            <h3 className="resume-element text-sm font-bold uppercase tracking-widest border-b-2 pb-1 mb-3" style={{ color: '#111827', borderColor: config.primaryColor }}>
              Technical Skills
            </h3>
            <div 
              className="grid gap-x-4 gap-y-2" 
              style={{ gridTemplateColumns: `repeat(${config.skillsColumns}, minmax(0, 1fr))` }}
            >
              {data.skills.map((skill, i) => (
                <div key={i} className="resume-element flex flex-col text-xs border-b border-gray-100 pb-1 last:border-0">
                  <span
                    className="font-bold mb-1 outline-none"
                    style={{ color: '#1f2937' }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const next = [...data.skills];
                      next[i] = { ...skill, category: e.currentTarget.innerHTML };
                      syncData({ ...data, skills: next });
                    }}
                    dangerouslySetInnerHTML={{ __html: skill.category }}
                  />
                  <span
                    className="leading-snug outline-none"
                    style={{ color: config.secondaryColor }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const next = [...data.skills];
                      next[i] = { ...skill, items: e.currentTarget.innerHTML };
                      syncData({ ...data, skills: next });
                    }}
                    dangerouslySetInnerHTML={{ __html: skill.items }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      case 'experience':
        return (
          <div key="experience">
            <h3 className="resume-element text-sm font-bold uppercase tracking-widest border-b-2 pb-1 mb-4" style={{ color: '#111827', borderColor: config.primaryColor }}>
              Professional Experience
            </h3>
            <div className="flex flex-col gap-6">
              {data.experience.map((job, i) => (
                <div key={i} className="relative" style={{ breakInside: 'avoid' }}>
                  <div className="resume-element flex justify-between items-baseline mb-1">
                    <div className="flex flex-col">
                      <span
                        className="text-sm font-bold outline-none"
                        style={{ color: '#111827' }}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const next = [...data.experience];
                          next[i] = { ...job, company: e.currentTarget.innerHTML };
                          syncData({ ...data, experience: next });
                        }}
                        dangerouslySetInnerHTML={{ __html: job.company }}
                      />
                      <span
                        className="text-xs font-semibold outline-none"
                        style={{ color: config.primaryColor }}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const next = [...data.experience];
                          next[i] = { ...job, role: e.currentTarget.innerHTML };
                          syncData({ ...data, experience: next });
                        }}
                        dangerouslySetInnerHTML={{ __html: job.role }}
                      />
                    </div>
                    <div className="text-right">
                      <span
                        className="text-xs font-bold block outline-none"
                        style={{ color: config.secondaryColor }}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const next = [...data.experience];
                          next[i] = { ...job, date: e.currentTarget.innerHTML };
                          syncData({ ...data, experience: next });
                        }}
                        dangerouslySetInnerHTML={{ __html: job.date }}
                      />
                      <span
                        className="text-[10px] font-medium opacity-80 outline-none"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const next = [...data.experience];
                          next[i] = { ...job, location: e.currentTarget.innerHTML };
                          syncData({ ...data, experience: next });
                        }}
                        dangerouslySetInnerHTML={{ __html: job.location }}
                      />
                    </div>
                  </div>
                  <ul className="list-disc ml-4 space-y-1 mt-1">
                    {job.details.map((detail, j) => (
                      <li
                        key={j}
                        className="resume-element text-xs leading-snug pl-1 marker:text-gray-400 font-medium outline-none"
                        style={{ color: config.secondaryColor }}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const lines = [...job.details];
                          lines[j] = e.currentTarget.innerHTML;
                          const nextExp = [...data.experience];
                          nextExp[i] = { ...job, details: lines };
                          syncData({ ...data, experience: nextExp });
                        }}
                        dangerouslySetInnerHTML={{ __html: detail }}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      case 'education':
        return (
          <div key="education" className="mt-6">
            <h3 className="resume-element text-sm font-bold uppercase tracking-widest border-b-2 pb-1 mb-3" style={{ color: '#111827', borderColor: config.primaryColor }}>
              Education
            </h3>
            <div className="space-y-3">
              {data.education.map((edu, i) => (
                <div key={i} className="resume-element flex justify-between items-end pb-2">
                  <div>
                    <span
                      className="text-sm font-bold block outline-none"
                      style={{ color: '#111827' }}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const next = [...data.education];
                        next[i] = { ...edu, degree: e.currentTarget.innerHTML };
                        syncData({ ...data, education: next });
                      }}
                      dangerouslySetInnerHTML={{ __html: edu.degree }}
                    />
                    <span
                      className="text-xs font-medium outline-none"
                      style={{ color: config.secondaryColor }}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const next = [...data.education];
                        next[i] = { ...edu, school: e.currentTarget.innerHTML };
                        syncData({ ...data, education: next });
                      }}
                      dangerouslySetInnerHTML={{ __html: edu.school }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold outline-none"
                    style={{ color: config.secondaryColor }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const next = [...data.education];
                      next[i] = { ...edu, date: e.currentTarget.innerHTML };
                      syncData({ ...data, education: next });
                    }}
                    dangerouslySetInnerHTML={{ __html: edu.date }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSectionDragMove = (id: SectionId, y: number) => {
    setSectionPositions(prev => ({ ...prev, [id]: y }));
  };

  const handleSectionDragEnd = (id: SectionId, y: number) => {
    const updated = { ...sectionPositions, [id]: y };
    const sorted = [...sectionOrder].sort((a, b) => (updated[a] ?? 0) - (updated[b] ?? 0));
    const normalized: Record<SectionId, number> = sorted.reduce((acc, sid, idx) => {
      acc[sid] = LAYOUT_TOP_PADDING + idx * layoutRowSpacing;
      return acc;
    }, {} as Record<SectionId, number>);
    setSectionOrder(sorted);
    setSectionPositions(normalized);
  };

  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: '', role: '', location: '', date: '', details: [''] }
      ]
    }));
  };

  const removeExperience = (index: number) => {
    setData(prev => {
      const next = prev.experience.filter((_, i) => i !== index);
      if (!next.length) {
        next.push({
          company: '', role: '', date: '', details: [''],
          location: ''
        });
      }
      return { ...prev, experience: next };
    });
  };

  const updateExperienceField = (index: number, key: 'company' | 'role' | 'date' | 'location', value: string) => {
    setData(prev => {
      const next = [...prev.experience];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, experience: next };
    });
  };

  const updateExperienceDetail = (index: number, detailIndex: number, value: string) => {
    setData(prev => {
      const next = [...prev.experience];
      const details = [...(next[index]?.details || [])];
      details[detailIndex] = value;
      next[index] = { ...next[index], details };
      return { ...prev, experience: next };
    });
  };

  const removeExperienceDetail = (index: number, detailIndex: number) => {
    setData(prev => {
      const next = [...prev.experience];
      const details = [...(next[index]?.details || [])].filter((_, i) => i !== detailIndex);
      next[index] = { ...next[index], details: details.length ? details : [''] };
      return { ...prev, experience: next };
    });
  };

  const addExperienceDetail = (index: number) => {
    setData(prev => {
      const next = [...prev.experience];
      const details = [...(next[index]?.details || [])];
      details.push('');
      next[index] = { ...next[index], details };
      return { ...prev, experience: next };
    });
  };

  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', school: '', date: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    setData(prev => {
      const next = prev.education.filter((_, i) => i !== index);
      return { ...prev, education: next.length ? next : [{ degree: '', school: '', date: '' }] };
    });
  };

  const updateEducationField = (index: number, key: 'degree' | 'school' | 'date', value: string) => {
    setData(prev => {
      const next = [...prev.education];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, education: next };
    });
  };

  const normalizedLinks = (): ResumeLink[] => {
    return (data.header.links || []).map((link) => {
      if (typeof link === 'string') return { label: 'Link', url: link };
      return link;
    });
  };

  const resolveLinkIcon = (label: string) => {
    const key = label.toLowerCase();
    if (key.includes('linkedin')) return <LinkedInIcon size={12} className="text-[#0a66c2]" />;
    if (key.includes('github')) return <GitHubIcon size={12} className="text-gray-800" />;
    if (key.includes('medium')) return <MediumIcon size={12} className="text-gray-700" />;
    return <LinkIcon size={12} className="text-[#3f51b5]" />;
  };

  const updateLinkField = (index: number, key: 'label' | 'url', value: string) => {
    const links = normalizedLinks();
    links[index] = { ...links[index], [key]: value };
    setData(prev => ({ ...prev, header: { ...prev.header, links } }));
  };

  const addLink = (label: string) => {
    const links = normalizedLinks();
    links.push({ label, url: 'https://' });
    setData(prev => ({ ...prev, header: { ...prev.header, links } }));
  };

  const removeLink = (index: number) => {
    const links = normalizedLinks().filter((_, i) => i !== index);
    setData(prev => ({ ...prev, header: { ...prev.header, links } }));
  };

  const hasResumeContent = useMemo(() => {
    const header = data.header || { name: '', title: '', email: '', phone: '', links: [] };
    const headerHas = [header.name, header.title, header.email, header.phone].some((v) => v?.toString().trim());
    const linksHas = (header.links || []).some((l) => {
      if (typeof l === 'string') return l.trim();
      return (l.label || '').trim() || (l.url || '').trim();
    });
    const summaryHas = (data.summary || '').trim().length > 0;
    const skillsHas = (data.skills || []).some((s) => (s.category || '').trim() || (s.items || '').trim());
    const expHas = (data.experience || []).some((job) => {
      const base = [job.company, job.role, job.date, job.location].some((v) => v?.toString().trim());
      const details = (job.details || []).some((d) => (d || '').trim());
      return base || details;
    });
    const eduHas = (data.education || []).some((edu) => (edu.degree || '').trim() || (edu.school || '').trim() || (edu.date || '').trim());
    return headerHas || linksHas || summaryHas || skillsHas || expHas || eduHas;
  }, [data]);

  const handleDownload = async () => {
    if (!resumeRef.current || !window.html2pdf || !pdfReady || !hasResumeContent) {
      alert("PDF generator is still loading. Please try again in a few seconds.");
      return;
    }
    
    setIsDownloading(true);
    const element = resumeRef.current;
    
    const originalBackground = element.style.backgroundImage;
    const originalBackgroundColor = element.style.backgroundColor;
    
    // Clean up for PDF
    element.style.backgroundImage = 'none';
    element.style.backgroundColor = 'white';
    
    const opt = {
      margin: 0,
      filename: `${data.header.name.replace(/\s+/g, '_')}_resume.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true, scrollY: 0 }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css' }
    };

    try {
      await window.html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      element.style.backgroundImage = originalBackground;
      element.style.backgroundColor = originalBackgroundColor;
      setIsDownloading(false);
    }
  };

  const VIEWER_BG_COLOR = '#525252'; 
  const pdfStatus = !hasResumeContent
    ? { label: 'PDF unavailable', color: '#9ca3af' }
    : pdfReady
    ? { label: 'PDF Ready', color: '#16a34a' }
    : { label: 'Loading PDF', color: '#eab308' };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Roboto:wght@300;400;500;700&display=swap');
      `}</style>

      {/* --- Header --- */}
      <header className="h-16 bg-[#3f51b5] shadow-md flex items-center justify-between px-6 z-20 relative text-white">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-medium tracking-wide">Slate</h1>
            <p className="hidden sm:block text-[10px] text-indigo-100 uppercase tracking-wider font-bold opacity-80">Build a better resume in seconds for free.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isMobileLayout ? (
            <span className="w-2.5 h-2.5 rounded-full border border-white/60" style={{ backgroundColor: pdfStatus.color }} aria-label={pdfStatus.label} />
          ) : (
            <span
              className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${
                !hasResumeContent
                  ? 'bg-gray-100 text-gray-500 border-gray-200'
                  : pdfReady
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}
            >
              {pdfStatus.label}
            </span>
          )}
          {isMobileLayout && (
            <button
              onClick={() => setIsEditorOpen(prev => !prev)}
              className="lg:hidden px-3 py-2 rounded border border-white/50 text-white text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <EditIcon size={16} />
              <span className="hidden sm:inline">{isEditorOpen ? 'Hide editor' : 'Open editor'}</span>
            </button>
          )}
          <button 
            onClick={handleDownload}
            disabled={isDownloading || !pdfReady || !hasResumeContent}
            className={`
              relative overflow-hidden flex items-center gap-2 px-6 py-2 rounded shadow-md uppercase text-sm font-semibold tracking-wider transition-all
              ${isDownloading || !pdfReady || !hasResumeContent
                ? 'bg-indigo-300 text-indigo-800 cursor-not-allowed' 
                : 'bg-white text-[#3f51b5] hover:bg-gray-50 active:shadow-inner active:translate-y-px'
              }
              ${isMobileLayout ? 'px-3 py-2' : ''}
            `}
          >
            {isDownloading ? (
              <span className="text-xs">Processing...</span>
            ) : (
              <>
                <DownloadIcon size={18} />
                <span className="hidden sm:inline">Download PDF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex flex-1 overflow-hidden relative">
        
        {/* Left Panel: Preview (Viewer Area) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-12 flex flex-col gap-4 items-center transition-colors relative" style={{ backgroundColor: VIEWER_BG_COLOR }}>
          {!hasResumeContent && (
            <div className="w-full max-w-4xl bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-semibold">
              <p className="font-bold">Add info to generate your resume.</p>
              <p className="text-red-700">Use the UI Form or JSON tab to enter details. PDF download is disabled until content is added.</p>
            </div>
          )}
          

            <div 
              ref={resumeRef}
              className="shadow-2xl transition-transform origin-top relative"
              style={{
                width: 'min(210mm, 100%)',
                minHeight: '297mm', 
                height: 'auto',      
                maxWidth: '100%',
                fontFamily: FONTS.find(f => f.name === config.fontFamily)?.family || 'sans-serif',
                fontSize: `${config.baseFontSize}px`,
                color: config.secondaryColor,
                overflow: 'hidden',
                backgroundColor: 'transparent', 
                backgroundImage: `repeating-linear-gradient(to bottom, 
                  #ffffff 0mm, 
                #ffffff ${A4_HEIGHT_MM}mm, 
                transparent ${A4_HEIGHT_MM}mm, 
                transparent ${A4_HEIGHT_MM + GAP_HEIGHT_MM}mm
              )`,
              backgroundSize: `100% ${A4_HEIGHT_MM + GAP_HEIGHT_MM}mm` 
            }}
          >
            <div 
              style={{ 
                width: `${100 / config.scale}%`, 
                transform: `scale(${config.scale})`, 
                transformOrigin: 'top left',
                boxSizing: 'border-box'
              }}
            >
              <div 
                ref={contentRef} 
                style={{ padding: '10mm', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                
                {/* --- Resume Header (Atomic) --- */}
                <div className="resume-element flex flex-col items-center mb-6">
                  <h1
                    className="text-3xl font-bold tracking-tight uppercase mb-1 outline-none"
                    style={{ color: '#111827' }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => syncData({ ...data, header: { ...data.header, name: e.currentTarget.innerHTML } })}
                    dangerouslySetInnerHTML={{ __html: data.header.name }}
                  />
                  <h2
                    className="text-sm font-semibold tracking-widest uppercase mb-3 outline-none"
                    style={{ color: config.primaryColor }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => syncData({ ...data, header: { ...data.header, title: e.currentTarget.innerHTML } })}
                    dangerouslySetInnerHTML={{ __html: data.header.title }}
                  />
                  
                  <div className="flex flex-col items-center gap-2 text-xs font-medium" style={{ color: config.secondaryColor }}>
                    <div className="flex flex-wrap items-center gap-3 justify-center">
                      <div className="flex items-center gap-1">
                        <MailIcon size={12} />
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => syncData({ ...data, header: { ...data.header, email: e.currentTarget.innerHTML } })}
                          className="outline-none"
                        >
                          {data.header.email}
                        </span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1">
                        <PhoneIcon size={12} />
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => syncData({ ...data, header: { ...data.header, phone: e.currentTarget.innerHTML } })}
                          className="outline-none"
                        >
                          {data.header.phone}
                        </span>
                      </div>
                    </div>
                    {linkItems.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3 justify-center">
                        {linkItems.map((link, i) => (
                          <a 
                            key={`${link.label}-${i}`}
                            href={link.url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:opacity-70 cursor-pointer transition-opacity flex items-center gap-1"
                          >
                            {resolveLinkIcon(link.label)}
                            <span>{link.label}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {sectionOrder.map(renderSection)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Tabs & Editor */}
        <div
          className={`flex flex-col bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ${
            isMobileLayout
              ? `${isEditorOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-[105%] pointer-events-none'} fixed inset-x-0 bottom-0 top-16 z-30 border-t border-gray-200 lg:translate-y-0 lg:static`
              : 'w-1/3 border-l border-gray-200 z-10'
          }`}
        >
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('json')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'json' ? 'text-[#3f51b5] border-b-2 border-[#3f51b5] bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <EditIcon size={16} /> Data
            </button>
            <button 
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'design' ? 'text-[#3f51b5] border-b-2 border-[#3f51b5] bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <PaletteIcon size={16} /> Design
            </button>
            <button 
              onClick={() => setActiveTab('ats')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'ats' ? 'text-[#3f51b5] border-b-2 border-[#3f51b5] bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ShieldCheckIcon size={16} /> ATS
            </button>
            <button 
              onClick={() => setActiveTab('layout')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'layout' ? 'text-[#3f51b5] border-b-2 border-[#3f51b5] bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGridIcon size={16} /> Layout
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-2 text-[11px] text-gray-600 bg-gray-50 border-b border-gray-200">
            <span className="uppercase tracking-wide font-semibold text-gray-500">Autosaves locally</span>
            <div className="flex items-center gap-3">
              {isMobileLayout && (
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="text-[#3f51b5] font-semibold hover:underline focus:outline-none lg:hidden"
                >
                  Close
                </button>
              )}
              <button 
                onClick={handleReset}
                className="text-[#3f51b5] font-semibold hover:underline focus:outline-none"
              >
                Reset to defaults
              </button>
            </div>
          </div>

          {/* Tab Content */}
                    {/* Tab Content */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {activeTab === 'json' && (
              <>
                {error && (
                  <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-600 text-xs font-medium">
                    <AlertCircleIcon size={14} /> {error}
                  </div>
                )}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 text-xs text-gray-600">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-700">Data View:</span>
                    <button
                      onClick={() => setDataViewMode('ui')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${dataViewMode === 'ui' ? 'bg-[#3f51b5] text-white border-[#3f51b5]' : 'bg-white text-gray-700 border-gray-200'}`}
                    >
                      UI Form
                    </button>
                    <button
                      onClick={() => setDataViewMode('json')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${dataViewMode === 'json' ? 'bg-[#3f51b5] text-white border-[#3f51b5]' : 'bg-white text-gray-700 border-gray-200'}`}
                    >
                      JSON
                    </button>
                  </div>
                  {dataViewMode === 'json' && (
                    <button
                      onClick={handleFormatJson}
                      className="px-3 py-1.5 rounded border border-gray-200 text-[#3f51b5] font-semibold hover:border-[#3f51b5] hover:bg-indigo-50 transition-colors"
                    >
                      Prettify JSON
                    </button>
                  )}
                </div>
                {dataViewMode === 'json' ? (
                  <textarea
                    className="flex-1 w-full p-6 font-mono text-sm leading-relaxed text-gray-700 resize-none focus:outline-none focus:bg-gray-50 transition-colors"
                    value={jsonInput}
                    onChange={handleJsonChange}
                    spellCheck={false}
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-700">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                      <button
                        onClick={() => setUiFormTab('info')}
                        className={`px-3 py-1.5 rounded border transition-colors ${uiFormTab === 'info' ? 'bg-[#3f51b5] text-white border-[#3f51b5]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#3f51b5]'}`}
                      >
                        Personal & Experience
                      </button>
                      <button
                        onClick={() => setUiFormTab('skills')}
                        className={`px-3 py-1.5 rounded border transition-colors ${uiFormTab === 'skills' ? 'bg-[#3f51b5] text-white border-[#3f51b5]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#3f51b5]'}`}
                      >
                        Technical Skills
                      </button>
                    </div>

                    {uiFormTab === 'info' && (
                      <div className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-3 text-[11px]">
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">Name</label>
                              <textarea value={data.header.name} onChange={(e) => syncData({ ...data, header: { ...data.header, name: e.target.value } })} className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">Title</label>
                              <textarea value={data.header.title} onChange={(e) => syncData({ ...data, header: { ...data.header, title: e.target.value } })} className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">Email</label>
                              <textarea value={data.header.email} onChange={(e) => syncData({ ...data, header: { ...data.header, email: e.target.value } })} className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">Phone</label>
                              <textarea value={data.header.phone} onChange={(e) => syncData({ ...data, header: { ...data.header, phone: e.target.value } })} className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 flex items-center gap-1"><LinkIcon size={14} /> Links (optional)</label>
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <select
                                  value={newLinkLabel}
                                  onChange={(e) => setNewLinkLabel(e.target.value as any)}
                                  className="text-[11px] border border-[#3f51b5] rounded px-3 pr-8 py-1 font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#3f51b5] bg-white appearance-none"
                                >
                                  <option value="LinkedIn">LinkedIn</option>
                                  <option value="GitHub">GitHub</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Custom">Custom</option>
                                </select>
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#3f51b5]">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </span>
                              </div>
                              {newLinkLabel === 'Custom' && (
                                <input
                                  value={customLinkLabel}
                                  onChange={(e) => setCustomLinkLabel(e.target.value)}
                                  placeholder="Label"
                                  className="text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#3f51b5]"
                                  style={{ minWidth: 120 }}
                                />
                              )}
                              <button
                                onClick={() => addLink(newLinkLabel === 'Custom' ? customLinkLabel || 'Link' : newLinkLabel)}
                                className="text-[11px] font-semibold text-[#3f51b5] border border-[#3f51b5] rounded px-2.5 py-1 hover:bg-indigo-50"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {normalizedLinks().map((link, idx) => (
                              <div key={idx} className="border border-gray-200 rounded-lg p-2 flex flex-col gap-2 bg-gray-50/60">
                                <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-semibold text-gray-700">Link {idx + 1}</p>
                                  <button onClick={() => removeLink(idx)} className="text-[10px] text-red-600 hover:underline font-semibold">Remove</button>
                                </div>
                                <div className="grid md:grid-cols-3 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600">Label</label>
                                    <textarea value={link.label} onChange={(e) => updateLinkField(idx, 'label', e.target.value)} className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                                  </div>
                                  <div className="md:col-span-2 space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600">URL</label>
                                    <textarea value={link.url} onChange={(e) => updateLinkField(idx, 'url', e.target.value)} placeholder="https://..." className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                                  </div>
                                </div>
                              </div>
                            ))}
                            {normalizedLinks().length === 0 && <p className="text-[11px] text-gray-500">No links added. Use the dropdown to add LinkedIn, GitHub, Medium, or a custom link.</p>}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Summary</label>
                          <textarea value={data.summary} onChange={(e) => syncData({ ...data, summary: e.target.value })} className={`${UI_TEXTAREA_CLASS} min-h-[120px]`} />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Experience</label>
                            <button onClick={addExperience} className="text-[11px] font-semibold text-[#3f51b5] border border-[#3f51b5] rounded px-2.5 py-1 hover:bg-indigo-50">Add role</button>
                          </div>
                          <div className="space-y-3">
                            {data.experience.map((exp, idx) => (
                              <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/60">
                                <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Role {idx + 1}</p>
                                  <button onClick={() => removeExperience(idx)} className="text-[11px] text-red-600 hover:underline font-semibold">Remove role</button>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600">Company</label>
                                    <textarea value={exp.company} onChange={(e) => updateExperienceField(idx, 'company', e.target.value)} placeholder="Company" className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600">Title</label>
                                    <textarea value={exp.role} onChange={(e) => updateExperienceField(idx, 'role', e.target.value)} placeholder="Role" className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600">Location</label>
                                    <textarea value={exp.location} onChange={(e) => updateExperienceField(idx, 'location', e.target.value)} placeholder="Location" className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600">Dates</label>
                                    <textarea value={exp.date || ''} onChange={(e) => updateExperienceField(idx, 'date', e.target.value)} placeholder="Dates" className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold text-gray-600">Points</p>
                                  <div className="space-y-1">
                                    {exp.details.map((detail, dIdx) => (
                                      <div key={dIdx} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[11px] font-semibold text-gray-600">Point {dIdx + 1}</label>
                                          <button onClick={() => removeExperienceDetail(idx, dIdx)} className="text-[10px] text-red-600 hover:underline font-semibold">Remove</button>
                                        </div>
                                        <textarea
                                          value={detail}
                                          onChange={(e) => updateExperienceDetail(idx, dIdx, e.target.value)}
                                          placeholder={`Point ${dIdx + 1}`}
                                          className={UI_MULTILINE_INPUT_CLASS}
                                          rows={2}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <button onClick={() => addExperienceDetail(idx)} className="text-[11px] font-semibold text-[#3f51b5] hover:underline mt-1">Add point</button>
                                </div>
                              </div>
                            ))}
                            {data.experience.length === 0 && (
                              <p className="text-[11px] text-gray-500">No experience added yet.</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Education</label>
                            <button onClick={addEducation} className="text-[11px] font-semibold text-[#3f51b5] px-2 py-1 rounded border border-[#3f51b5] hover:bg-indigo-50">
                              Add education
                            </button>
                          </div>
                          <div className="space-y-3">
                            {data.education.map((edu, idx) => (
                              <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/60">
                                <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Education {idx + 1}</p>
                                  <button onClick={() => removeEducation(idx)} className="text-[11px] text-red-600 hover:underline font-semibold">Remove</button>
                                </div>
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600">Degree</label>
                                    <textarea value={edu.degree} onChange={(e) => updateEducationField(idx, 'degree', e.target.value)} placeholder="Degree" className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600">School</label>
                                    <textarea value={edu.school} onChange={(e) => updateEducationField(idx, 'school', e.target.value)} placeholder="School" className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-gray-600">Date</label>
                                    <textarea value={edu.date || ''} onChange={(e) => updateEducationField(idx, 'date', e.target.value)} placeholder="Date" className={UI_MULTILINE_INPUT_CLASS} rows={2} />
                                  </div>
                                </div>
                              </div>
                            ))}
                            {data.education.length === 0 && (
                              <p className="text-[11px] text-gray-500">No education added yet.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {uiFormTab === 'skills' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Technical Skills</label>
                          <button
                            onClick={() => syncData({ ...data, skills: [...data.skills, { category: '', items: '' }] })}
                            className="text-[11px] font-semibold text-[#3f51b5] border border-[#3f51b5] rounded px-2.5 py-1 hover:bg-indigo-50"
                          >
                            Add category
                          </button>
                        </div>
                      <div className="space-y-3">
                          {data.skills.map((skill, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/60">
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Category {i + 1}</p>
                                <button
                                  onClick={() => {
                                    const next = [...data.skills];
                                    next.splice(i, 1);
                                    syncData({ ...data, skills: next });
                                  }}
                                  className="text-[11px] text-red-600 hover:underline font-semibold"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600">Category</label>
                                <textarea
                                  value={skill.category}
                                  onChange={(e) => {
                                    const next = [...data.skills];
                                    next[i] = { ...skill, category: e.target.value };
                                    syncData({ ...data, skills: next });
                                  }}
                                  className={UI_MULTILINE_INPUT_CLASS}
                                  rows={2}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600">Items</label>
                                <textarea
                                  value={skill.items}
                                  onChange={(e) => {
                                    const next = [...data.skills];
                                    next[i] = { ...skill, items: e.target.value };
                                    syncData({ ...data, skills: next });
                                  }}
                                  placeholder="Comma-separated skills"
                                  className={UI_MULTILINE_INPUT_CLASS}
                                  rows={2}
                                />
                              </div>
                            </div>
                          ))}
                          {data.skills.length === 0 && <p className="text-[11px] text-gray-500">No skills added. Click “Add category” to start.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {activeTab === 'design' && (
              <div className="p-6 overflow-y-auto space-y-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Typography</label>
                  <div className="grid grid-cols-1 gap-2">
                    {FONTS.map(font => (
                      <button
                        key={font.name}
                        onClick={() => handleConfigChange('fontFamily', font.name)}
                        className={`text-left px-4 py-3 rounded border text-sm transition-all ${config.fontFamily === font.name ? 'border-[#3f51b5] bg-indigo-50 text-[#3f51b5] shadow-sm' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                        style={{ fontFamily: font.family }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-700 font-medium">Base Font Size</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">{config.baseFontSize}px</span>
                    </div>
                    <input type="range" min="10" max="14" step="0.5" value={config.baseFontSize} onChange={(e) => handleConfigChange('baseFontSize', parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3f51b5]" />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>Compact</span><span>Default</span><span>Readable</span></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Theme Colors</label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-400 mb-1">Primary (Titles)</label>
                      <div className="flex items-center gap-2 border border-gray-200 rounded p-2">
                        <input type="color" value={config.primaryColor} onChange={(e) => handleConfigChange('primaryColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
                        <span className="text-xs font-mono text-gray-600">{config.primaryColor}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-400 mb-1">Secondary (Text)</label>
                      <div className="flex items-center gap-2 border border-gray-200 rounded p-2">
                        <input type="color" value={config.secondaryColor} onChange={(e) => handleConfigChange('secondaryColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0" />
                        <span className="text-xs font-mono text-gray-600">{config.secondaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Layout & Density</label>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-700 font-medium">Skills Columns</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">{config.skillsColumns}</span>
                    </div>
                    <input type="range" min="1" max="3" step="1" value={config.skillsColumns} onChange={(e) => handleConfigChange('skillsColumns', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3f51b5]" />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>List</span><span>Balanced</span><span>Compact</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-700 font-medium">Document Scale</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">{Math.round(config.scale * 100)}%</span>
                    </div>
                    <input type="range" min="0.7" max="1.1" step="0.05" value={config.scale} onChange={(e) => handleConfigChange('scale', parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3f51b5]" />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>Smaller (Fit More)</span><span>Larger (Readable)</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ats' && (
              <div className="p-5 overflow-y-auto bg-gray-50" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px' }}>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-600">
                      <span className="font-bold">Job Description</span>
                      <span className="text-[10px] text-gray-500">{jobDescription.length ? `${jobDescription.length} chars` : ''}</span>
                    </div>
                    <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the role description here to see your ATS alignment..." className="w-full min-h-[150px] p-3 border border-gray-200 rounded text-[12px] text-gray-700 resize-vertical focus:outline-none focus:border-[#3f51b5] focus:ring-1 focus:ring-[#3f51b5] bg-white" />
                    <p className="text-[10px] text-gray-500">ATS score runs locally. AI refine sends the job description and resume JSON to Gemini using your key. {modelStatus.selected ? ` Selected model: ${modelStatus.selected}.` : ''}</p>
                  </div>
                  <div className="space-y-2 border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">ATS Score</span>
                      <span className="text-xl font-bold text-[#3f51b5] whitespace-nowrap">{atsReport.score}%</span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${atsReport.score >= 70 ? 'bg-green-50 text-green-700' : atsReport.score >= 40 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>{atsReport.score >= 70 ? 'Strong' : atsReport.score >= 40 ? 'Moderate' : 'Low'}</span>
                    </div>
                    <div className="text-[10px] text-gray-600">{atsReport.summary}</div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Matched Keywords ({atsReport.matchedKeywords.length})</p>
                        {atsReport.matchedKeywords.length > 12 && <button onClick={() => setShowAllMatched(v => !v)} className="text-[10px] font-semibold text-[#3f51b5] hover:underline">{showAllMatched ? 'Show less' : 'Show all'}</button>}
                      </div>
                      {atsReport.matchedKeywords.length ? (
                        <div className={`flex flex-wrap gap-2 ${showAllMatched ? '' : 'max-h-28 overflow-y-auto'}`}>
                          {(showAllMatched ? atsReport.matchedKeywords : atsReport.matchedKeywords.slice(0, 12)).map((kw) => (
                            <span key={kw} className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-semibold">{kw}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500">No overlaps detected yet.</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify_between">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Missing Keywords ({atsReport.missingKeywords.length})</p>
                        {atsReport.missingKeywords.length > 12 && <button onClick={() => setShowAllMissing(v => !v)} className="text-[10px] font-semibold text-[#3f51b5] hover:underline">{showAllMissing ? 'Show less' : 'Show all'}</button>}
                      </div>
                      {atsReport.missingKeywords.length ? (
                        <div className={`flex flex-wrap gap-2 ${showAllMissing ? '' : 'max-h-28 overflow-y-auto'}`}>
                          {(showAllMissing ? atsReport.missingKeywords : atsReport.missingKeywords.slice(0, 12)).map((kw) => (
                            <span key={kw} className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-semibold">{kw}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500">Great! No missing terms detected.</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-600 font-semibold">AI Assist</p>
                        <p className="text-[10px] text-gray-500">Refine with Gemini</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${aiStatus === 'processing' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{aiStatus === 'processing' ? 'Running' : 'Idle'}</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-semibold text-gray-600">Gemini API Key</label>
                        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value.trim())} placeholder="AIza..." className="w-full p-2.5 border border-gray-200 rounded text-sm text-gray-700 focus:outline-none focus:border-[#3f51b5] focus:ring-1 focus:ring-[#3f51b5]" />
                        <button type="button" onClick={() => refreshModelSelection(apiKey)} disabled={!apiKey.trim() || modelStatus.loading} className={`px-3 py-2 rounded text-xs font-semibold border transition-colors ${!apiKey.trim() || modelStatus.loading ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-[#3f51b5] border-[#3f51b5] hover:bg-indigo-50'}`}>{modelStatus.loading ? 'Checking models...' : 'Check Models'}</button>
                        {modelStatus.options.length > 0 && (
                          <select className="w-full p-2 border border-gray-200 rounded text-sm text-gray-700 focus:outline-none focus:border-[#3f51b5] focus:ring-1 focus:ring-[#3f51b5]" value={modelStatus.selected || ''} onChange={(e) => setModelStatus(prev => ({ ...prev, selected: e.target.value }))}>
                            {modelStatus.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        )}
                        {modelStatus.error && <p className="text-[10px] text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1">{modelStatus.error}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] text-gray-500">Stored only in session; clears on browser close.</p>
                        {modelStatus.selected && <p className="text-[10px] text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1">Using model: {modelStatus.selected}</p>}
                      </div>
                    </div>
                    <button onClick={handleAiRefine} disabled={aiStatus === 'processing'} className={`w-full px-4 py-2 rounded text-sm font-semibold border transition-colors ${aiStatus === 'processing' ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-[#3f51b5] text-white border-[#3f51b5] hover:bg-[#334296]'}`}>
                      {aiStatus === 'processing' ? 'Refining...' : 'Use AI to Improve'}
                    </button>
                    {aiMessage && <span className="text-[11px] text-gray-600">{aiMessage}</span>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="p-5 overflow-y-auto bg-gray-50" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px' }}>
                <div className="space-y-2 mb-3">
                  <p className="text-[12px] font-semibold text-gray-800 flex items-center gap-2"><LayoutGridIcon size={14} /> Drag sections to reorder</p>
                  <p className="text-[11px] text-gray-600">This updates the preview order. Drag blocks in the canvas below.</p>
                </div>
                <div ref={layoutCanvasRef} className="rounded-xl border border-gray-200 bg-white shadow-sm p-3 overflow-hidden">
                  <Stage width={Math.max(260, stageWidth - 2)} height={LAYOUT_TOP_PADDING + sectionOrder.length * layoutRowSpacing + LAYOUT_BOTTOM_PADDING}>
                    <Layer>
                      {sectionOrder.map((id, idx) => {
                        const stageCanvasWidth = Math.max(260, stageWidth - 2);
                        const y = sectionPositions[id] ?? LAYOUT_TOP_PADDING + idx * layoutRowSpacing;
                        const stageHeight = LAYOUT_TOP_PADDING + sectionOrder.length * layoutRowSpacing + LAYOUT_BOTTOM_PADDING;
                        const rectWidth = Math.max(stageCanvasWidth - LAYOUT_HORIZONTAL_PADDING * 2, 220);
                        return (
                          <React.Fragment key={id}>
                            <Rect
                              x={LAYOUT_HORIZONTAL_PADDING}
                              y={y}
                              width={rectWidth}
                              height={LAYOUT_ITEM_HEIGHT}
                              fill={LAYOUT_CARD_COLOR}
                              stroke={LAYOUT_CARD_BORDER}
                              strokeWidth={0.9}
                              cornerRadius={10}
                              shadowColor={LAYOUT_CARD_SHADOW}
                              shadowBlur={5}
                              shadowOpacity={0.08}
                              shadowOffset={{ x: 0, y: 2 }}
                              draggable
                              dragBoundFunc={(pos) => {
                                const minY = LAYOUT_TOP_PADDING;
                                const maxY = stageHeight - LAYOUT_ITEM_HEIGHT - LAYOUT_BOTTOM_PADDING;
                                return { x: LAYOUT_HORIZONTAL_PADDING, y: Math.min(maxY, Math.max(minY, pos.y)) };
                              }}
                              onDragMove={(e) => handleSectionDragMove(id, e.target.y())}
                              onDragEnd={(e) => handleSectionDragEnd(id, e.target.y())}
                            />
                            <Rect
                              x={LAYOUT_HORIZONTAL_PADDING + 9}
                              y={y + 7}
                              width={4}
                              height={LAYOUT_ITEM_HEIGHT - 14}
                              fill={LAYOUT_ACCENT_COLOR}
                              cornerRadius={3}
                              opacity={0.9}
                            />
                            <Text
                              x={LAYOUT_HORIZONTAL_PADDING + 22}
                              y={y + 12}
                              text={id.toUpperCase()}
                              fontSize={13}
                              fontStyle="bold"
                              fill="#111827"
                              fontFamily="Montserrat"
                            />
                          </React.Fragment>
                        );
                      })}
                    </Layer>
                  </Stage>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => {
                      setSectionOrder(['summary', 'skills', 'experience', 'education']);
                      setSectionPositions({
                        summary: LAYOUT_TOP_PADDING,
                        skills: LAYOUT_TOP_PADDING + layoutRowSpacing,
                        experience: LAYOUT_TOP_PADDING + layoutRowSpacing * 2,
                        education: LAYOUT_TOP_PADDING + layoutRowSpacing * 3
                      });
                    }}
                    className="px-3 py-2 text-[11px] font-semibold text-[#3f51b5] border border-[#3f51b5] rounded hover:bg-indigo-50"
                  >
                    Reset Order
                  </button>
                  <span className="text-[10px] text-gray-500">Drag cards in the canvas to reorder sections.</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
