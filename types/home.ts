export interface HomeSeoContent {
  title: string;
  description: string;
  keywords: string[];
}

export interface HomeHeroCta {
  label: string;
  href: string;
}

export interface HomeHeroContent {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: HomeHeroCta;
  secondaryCta?: HomeHeroCta;
}

export interface HomeHowItWorksStep {
  title: string;
  description: string;
}

export interface HomeHowItWorksContent {
  title: string;
  steps: HomeHowItWorksStep[];
}

export interface HomeFaqItem {
  question: string;
  answer: string;
}

export interface HomeFaqContent {
  title: string;
  items: HomeFaqItem[];
}

export interface HomePageContent {
  seo: HomeSeoContent;
  hero: HomeHeroContent;
  howItWorks: HomeHowItWorksContent;
  faq: HomeFaqContent;
}
