import { ResumeData, BuilderConfig, FontOption } from './types';

export const INITIAL_DATA: ResumeData = {
  header: {
    name: "DARSHAN MURTHY",
    title: "Senior Mobile Engineer (Android/Flutter) | Performance & SDK Specialist",
    email: "darshanm806@gmail.com",
    phone: "+91-9148264426",
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com" },
      { label: "GitHub", url: "https://github.com" },
      { label: "Medium", url: "https://medium.com" }
    ]
  },
  summary: "Performance-focused Software Engineer with 6+ years of experience. Currently architecting high-performance Mobile SDKs at Whatfix, achieving a 40% reduction in memory usage through low-level optimizations. Previously scaled Walmart’s eCommerce application to 150K+ daily users, reducing system downtime by 25% with Splunk monitoring. Deep expertise in Kotlin, Coroutines, and MVVM. Eager to leverage this background in enterprise-scale SDKs and eCommerce to enhance the speed and stability of the Swiggy platform.",
  skills: [
    { category: "Languages", items: "Kotlin, Java, Dart, Swift, C++" },
    { category: "Android Core", items: "Android SDK, Jetpack Compose, Coroutines, Retrofit, GraphQL, Room, Hilt, WorkManager" },
    { category: "Architecture", items: "MVVM, Clean Architecture, MVI, System Design, SOLID Principles" },
    { category: "Performance & Tools", items: "Memory Profiling, Splunk, LeakCanary, CI/CD, Docker, Git, JIRA" },
    { category: "Cloud & Backend", items: "AWS, Firebase, RESTful APIs" },
    { category: "Cross-Platform", items: "Flutter, React Native (Familiar)" }
  ],
  experience: [
    {
      company: "WHATFIX",
      location: "Bengaluru, India",
      role: "Software Development Engineer IV - Mobile SDK",
      date: "09/2024 – Present",
      details: [
        "Engineered a low-memory fallback framework for the Leap SDK, dynamically adjusting animations to reduce memory usage by 40%.",
        "Troubleshot complex threading issues and implemented centralized Executor pools, reducing host app crashes by 25%.",
        "Led refactoring of Leap Android SDK from Java to Kotlin (MVVM), reducing initial load time by 25%.",
        "Led Flutter SDK development contributing to 00K+ in new revenue from clients like JPL NASA and Bread Financial."
      ]
    },
    {
      company: "WALMART GLOBAL TECH",
      location: "Bengaluru, India",
      role: "Software Development Engineer III - Android",
      date: "03/2022 – 06/2024",
      details: [
        "Pivotal in migrating Wellness Blue+ app to Walmart OneApp, supporting user scale from 70K to 150K+ daily active users.",
        "Revamped Pharmacy Store Selector using Google Maps SDK, resulting in a 1.5x increase in store pickup orders.",
        "Implemented metrics-driven Splunk dashboard, enabling early detection and reducing system downtime by 25%.",
        "Developed end-to-end Espresso tests with nightly Looper jobs on Sauce Labs, reducing manual regression testing."
      ]
    },
    {
      company: "SURYA SYSTEMS SOFTWARE",
      location: "Bengaluru, India",
      role: "Senior Software Engineer - Flutter / Android",
      date: "06/2021 – 02/2022",
      details: [
        "Led development of 'Leo RPC Gen' (Golang), automating code generation for Kotlin/Dart/Swift and reducing dev effort by 40%.",
        "Lead Developer for BCN Fintech Agency Banking app, implementing robust MVVM and BLoC architectures."
      ]
    },
    {
      company: "TAGBOX SOLUTIONS (TVS MOTORS)",
      location: "Bengaluru, India",
      role: "Full Stack Mobile Apps Engineer",
      date: "07/2019 – 06/2021",
      details: [
        "Launched TVS Connect app with custom BLE SDK for smart connectivity between mobile and TVS motorcycles.",
        "Architected data models for Asset Tracking and developed REST APIs using Spring Boot."
      ]
    }
  ],
  education: {
    degree: "B.E. Computer Science",
    school: "CMR Institute of Technology",
    date: "07/2015 – 06/2019"
  }
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
