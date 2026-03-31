export type DocsTabId = "product" | "api" | "help" | "changelog";

export type DocsTab = {
  id: DocsTabId;
  label: string;
  blurb: string;
};

export type DocCodeBlock = {
  language: string;
  code: string;
  caption?: string;
};

export type DocContentSection = {
  id: string;
  title: string;
  eyebrow?: string;
  timestamp?: string;
  body?: string[];
  bullets?: string[];
  codeBlocks?: DocCodeBlock[];
};

export type DocCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
  hrefLabel?: string;
  pageId?: string;
};

export type EndpointMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type DocEndpoint = {
  method: EndpointMethod;
  label: string;
  anchorId: string;
};

export type DocPageKind = "guide" | "doc" | "help" | "changelog";

export type DocPage = {
  id: string;
  tab: DocsTabId;
  title: string;
  description: string;
  kind: DocPageKind;
  badge?: string;
  heroTitle?: string;
  heroDescription?: string;
  cards?: DocCard[];
  infographics?: DocInfographic[];
  sections?: DocContentSection[];
  endpoints?: DocEndpoint[];
  helpfulPrompt?: string;
};

export type SidebarItem = {
  id: string;
  title: string;
  icon?: string;
  pageId?: string;
  children?: SidebarItem[];
};

export type SidebarGroup = {
  id: string;
  title: string;
  items: SidebarItem[];
};

export type SearchRecord = {
  pageId: string;
  tab: DocsTabId;
  title: string;
  description: string;
  sectionTitle?: string;
};

export type DocInfographic = {
  id: string;
  title: string;
  description: string;
  tone?: "amber" | "emerald" | "slate";
  items: Array<{
    label: string;
    value: string;
    note?: string;
  }>;
  imageSrc?: string;
  imageAlt?: string;
};
