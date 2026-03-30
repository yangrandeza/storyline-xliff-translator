import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Download,
  FileCog,
  Globe,
  KeyRound,
  Languages,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { cn } from './lib/utils';
import 'flag-icons/css/flag-icons.min.css';

type UiLocale = 'en' | 'pt-BR';

type TranslationJob = {
  id: string;
  sourceText: string;
  applyTranslation: (translatedText: string) => void;
};

type LanguageOption = {
  code: string;
  name: string;
  flag: string;
};

const TARGET_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: 'us' },
  { code: 'es', name: 'Spanish', flag: 'es' },
  { code: 'fr', name: 'French', flag: 'fr' },
  { code: 'de', name: 'German', flag: 'de' },
  { code: 'it', name: 'Italian', flag: 'it' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: 'br' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: 'pt' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: 'cn' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', flag: 'tw' },
  { code: 'ja', name: 'Japanese', flag: 'jp' },
  { code: 'ko', name: 'Korean', flag: 'kr' },
  { code: 'ru', name: 'Russian', flag: 'ru' },
  { code: 'ar', name: 'Arabic', flag: 'sa' },
  { code: 'hi', name: 'Hindi', flag: 'in' },
  { code: 'nl', name: 'Dutch', flag: 'nl' },
  { code: 'tr', name: 'Turkish', flag: 'tr' },
  { code: 'sv', name: 'Swedish', flag: 'se' },
  { code: 'pl', name: 'Polish', flag: 'pl' },
  { code: 'id', name: 'Indonesian', flag: 'id' },
  { code: 'vi', name: 'Vietnamese', flag: 'vn' },
  { code: 'th', name: 'Thai', flag: 'th' },
  { code: 'cs', name: 'Czech', flag: 'cz' },
  { code: 'da', name: 'Danish', flag: 'dk' },
  { code: 'fi', name: 'Finnish', flag: 'fi' },
  { code: 'el', name: 'Greek', flag: 'gr' },
  { code: 'he', name: 'Hebrew', flag: 'il' },
  { code: 'hu', name: 'Hungarian', flag: 'hu' },
  { code: 'no', name: 'Norwegian', flag: 'no' },
  { code: 'ro', name: 'Romanian', flag: 'ro' },
  { code: 'sk', name: 'Slovak', flag: 'sk' },
  { code: 'uk', name: 'Ukrainian', flag: 'ua' },
  { code: 'ms', name: 'Malay', flag: 'my' },
  { code: 'bg', name: 'Bulgarian', flag: 'bg' },
  { code: 'hr', name: 'Croatian', flag: 'hr' },
  { code: 'lt', name: 'Lithuanian', flag: 'lt' },
  { code: 'sl', name: 'Slovenian', flag: 'si' },
  { code: 'et', name: 'Estonian', flag: 'ee' },
  { code: 'lv', name: 'Latvian', flag: 'lv' },
  { code: 'sr', name: 'Serbian', flag: 'rs' },
];

const UI_LOCALES: Array<{ code: UiLocale; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
];

const COPY: Record<
  UiLocale,
  {
    appTitle: string;
    appSubtitle: string;
    heroBadge: string;
    trustBrowserOnly: string;
    trustStructureSafe: string;
    trustNoFallbacks: string;
    uiLanguageLabel: string;
    keyInputLabel: string;
    workflowPanelTitle: string;
    workflowPanelBody: string;
    currentOutputLabel: string;
    languagePanelHint: string;
    actionPanelTitle: string;
    actionPanelBody: string;
    readyLabel: string;
    pendingLabel: string;
    byokTitle: string;
    byokDescription: string;
    apiKeyPlaceholder: string;
    localStorageNote: string;
    clearKey: string;
    uploadTitle: string;
    uploadPrompt: string;
    uploadHelp: string;
    replaceFile: string;
    invalidFileAlert: string;
    targetLanguageTitle: string;
    searchLanguagePlaceholder: string;
    noLanguagesFound: string;
    translateTitle: string;
    startTranslation: string;
    translating: string;
    progressDone: string;
    translationErrorTitle: string;
    tryAgain: string;
    successTitle: string;
    successBody: string;
    downloadButton: string;
    translateAnotherFile: string;
    missingApiKey: string;
    readingFile: string;
    invalidXml: string;
    noTextFound: string;
    finishingFile: string;
    translationDone: string;
    translationFailed: string;
    emptyResponse: string;
    quotaError: string;
    apiCallFailed: string;
    batchStatus: string;
  }
> = {
  en: {
    appTitle: 'Storyline XLIFF Translator',
    appSubtitle: 'Translate Storyline XLIFF files with Google Gemini in bring your own key mode',
    heroBadge: 'Browser-native localization workflow',
    trustBrowserOnly: 'Runs fully in the browser',
    trustStructureSafe: 'Preserves Storyline XLIFF structure',
    trustNoFallbacks: 'Shows real API failures with no fake success',
    uiLanguageLabel: 'App language',
    keyInputLabel: 'Gemini API key',
    workflowPanelTitle: 'Ready-to-run workflow',
    workflowPanelBody: 'Each step stays visible so the app feels dependable, not mysterious.',
    currentOutputLabel: 'Current output language',
    languagePanelHint: 'Choose the output language before sending the translation batches.',
    actionPanelTitle: 'Translate, verify, download',
    actionPanelBody: 'The system now keeps the last mile visible: readiness, progress, failure states and the final download stay in one place.',
    readyLabel: 'Ready',
    pendingLabel: 'Pending',
    byokTitle: 'Enter your Gemini API key',
    byokDescription: 'This app runs fully in the browser and uses your own Gemini key for translation.',
    apiKeyPlaceholder: 'Paste your Gemini API key here',
    localStorageNote: 'Your key is stored only in this browser via localStorage and used directly by the frontend.',
    clearKey: 'Clear key',
    uploadTitle: 'Upload your XLIFF file',
    uploadPrompt: 'Click or drag your file here',
    uploadHelp: 'Supports Articulate Storyline .xlf and .xliff files',
    replaceFile: 'Replace file',
    invalidFileAlert: 'Please upload a .xlf or .xliff file.',
    targetLanguageTitle: 'Choose the target language',
    searchLanguagePlaceholder: 'Search language...',
    noLanguagesFound: 'No languages found',
    translateTitle: 'Translate and download',
    startTranslation: 'Start translation to {language}',
    translating: 'Translating',
    progressDone: '{progress}% complete',
    translationErrorTitle: 'Translation error',
    tryAgain: 'Try again',
    successTitle: 'Translation complete',
    successBody: 'Your file was translated to {language}.',
    downloadButton: 'Download translated file',
    translateAnotherFile: 'Translate another file',
    missingApiKey: 'Enter a Gemini API key before translating.',
    readingFile: 'Reading file...',
    invalidXml: 'The uploaded file is not valid XML/XLIFF.',
    noTextFound: 'No translatable text was found in the file.',
    finishingFile: 'Finalizing file...',
    translationDone: 'Translation completed successfully.',
    translationFailed: 'Translation failed.',
    emptyResponse: 'Empty response from Gemini.',
    quotaError: 'Gemini API returned 429: this key has exceeded its quota or spending cap.',
    apiCallFailed: 'Failed to call the Gemini API.',
    batchStatus: 'Translating batches {start} to {end} of {total}...',
  },
  'pt-BR': {
    appTitle: 'Storyline XLIFF Translator',
    appSubtitle: 'Traduza arquivos XLIFF do Storyline com Google Gemini no modo bring your own key',
    heroBadge: 'Fluxo de localizacao direto no navegador',
    trustBrowserOnly: 'Roda totalmente no navegador',
    trustStructureSafe: 'Preserva a estrutura XLIFF do Storyline',
    trustNoFallbacks: 'Mostra falhas reais da API sem sucesso falso',
    uiLanguageLabel: 'Idioma do app',
    keyInputLabel: 'Chave da API Gemini',
    workflowPanelTitle: 'Fluxo pronto para executar',
    workflowPanelBody: 'Cada etapa fica visivel para o app parecer confiavel, nao misterioso.',
    currentOutputLabel: 'Idioma atual de saida',
    languagePanelHint: 'Escolha o idioma de destino antes de enviar os lotes para traducao.',
    actionPanelTitle: 'Traduzir, revisar e baixar',
    actionPanelBody: 'A etapa final agora deixa prontidao, progresso, falhas e download no mesmo lugar.',
    readyLabel: 'Pronto',
    pendingLabel: 'Pendente',
    byokTitle: 'Informe sua chave da API Gemini',
    byokDescription: 'Este app roda totalmente no navegador e usa a sua própria chave Gemini para traduzir.',
    apiKeyPlaceholder: 'Cole aqui sua chave da API Gemini',
    localStorageNote: 'Sua chave fica salva apenas neste navegador via localStorage e é usada diretamente pelo frontend.',
    clearKey: 'Limpar chave',
    uploadTitle: 'Envie seu arquivo XLIFF',
    uploadPrompt: 'Clique ou arraste seu arquivo aqui',
    uploadHelp: 'Suporta arquivos .xlf e .xliff do Articulate Storyline',
    replaceFile: 'Trocar arquivo',
    invalidFileAlert: 'Por favor, envie um arquivo .xlf ou .xliff.',
    targetLanguageTitle: 'Escolha o idioma de destino',
    searchLanguagePlaceholder: 'Pesquisar idioma...',
    noLanguagesFound: 'Nenhum idioma encontrado',
    translateTitle: 'Traduzir e baixar',
    startTranslation: 'Iniciar tradução para {language}',
    translating: 'Traduzindo',
    progressDone: '{progress}% concluído',
    translationErrorTitle: 'Erro na tradução',
    tryAgain: 'Tentar novamente',
    successTitle: 'Tradução concluída',
    successBody: 'Seu arquivo foi traduzido para {language}.',
    downloadButton: 'Baixar arquivo traduzido',
    translateAnotherFile: 'Traduzir outro arquivo',
    missingApiKey: 'Informe uma chave da API Gemini antes de traduzir.',
    readingFile: 'Lendo arquivo...',
    invalidXml: 'O arquivo enviado não é um XML/XLIFF válido.',
    noTextFound: 'Nenhum texto traduzível foi encontrado no arquivo.',
    finishingFile: 'Finalizando arquivo...',
    translationDone: 'Tradução concluída com sucesso.',
    translationFailed: 'A tradução falhou.',
    emptyResponse: 'Resposta vazia do Gemini.',
    quotaError: 'A API Gemini respondeu 429: esta chave excedeu a cota ou o limite de gastos.',
    apiCallFailed: 'Falha ao chamar a API Gemini.',
    batchStatus: 'Traduzindo lotes {start} a {end} de {total}...',
  },
};

function formatMessage(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}

async function translateBatch(texts: Record<string, string>, targetLang: string, apiKey: string, uiCopy: typeof COPY.en) {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert translator for e-learning content. Translate the following text values into ${targetLang}.
CRITICAL RULES:
1. Return a JSON object with the exact same keys as the input.
2. Do not add markdown, explanations, notes, or extra keys.
3. Preserve leading/trailing whitespace, line breaks, punctuation, and casing when they are intentional.
4. If a value is only a number, filename, code, or should clearly stay unchanged, return it unchanged.
5. Keep the translation natural for UI labels and course content.

Input JSON:
${JSON.stringify(texts)}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let text = response.text;
    if (text) {
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      return JSON.parse(text) as Record<string, string>;
    }

    throw new Error(uiCopy.emptyResponse);
  } catch (error) {
    console.error('Translation error', error);
    const typedError = error as { status?: number; message?: string };
    if (typedError?.status === 429) {
      throw new Error(uiCopy.quotaError);
    }
    throw new Error(typedError?.message || uiCopy.apiCallFailed);
  }
}

function syncElementAttributes(source: Element, target: Element) {
  while (target.attributes.length > 0) {
    target.removeAttribute(target.attributes[0].name);
  }

  for (const attr of Array.from(source.attributes)) {
    target.setAttribute(attr.name, attr.value);
  }
}

function resetTargetFromSource(doc: Document, unit: Element, sourceNode: Element) {
  const namespaceURI = unit.namespaceURI;
  let targetNode = unit.getElementsByTagName('target')[0];

  if (!targetNode) {
    targetNode = doc.createElementNS(namespaceURI, 'target');
    const sourceSibling = sourceNode.nextSibling;
    if (sourceSibling) {
      unit.insertBefore(targetNode, sourceSibling);
    } else {
      unit.appendChild(targetNode);
    }
  }

  syncElementAttributes(sourceNode, targetNode);

  while (targetNode.firstChild) {
    targetNode.removeChild(targetNode.firstChild);
  }

  for (const childNode of Array.from(sourceNode.childNodes)) {
    targetNode.appendChild(doc.importNode(childNode, true));
  }

  return targetNode;
}

function collectTranslatableTextNodes(root: Element) {
  const textNodes: Text[] = [];
  const doc = root.ownerDocument;
  const protectedTags = new Set(['bpt', 'ept', 'ph']);
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const value = node.nodeValue ?? '';
      if (!value.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      const parentTag = node.parentElement?.localName?.toLowerCase();
      if (!parentTag || protectedTags.has(parentTag)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  return textNodes;
}

function buildTranslationJobs(doc: Document, transUnits: Element[]) {
  const jobs: TranslationJob[] = [];

  for (const unit of transUnits) {
    const sourceNode = unit.getElementsByTagName('source')[0];
    if (!sourceNode) {
      continue;
    }

    const targetNode = resetTargetFromSource(doc, unit, sourceNode);
    const sourceTextNodes = collectTranslatableTextNodes(sourceNode);
    const targetTextNodes = collectTranslatableTextNodes(targetNode);

    if (sourceTextNodes.length !== targetTextNodes.length) {
      console.warn('Source/target text node mismatch, skipping unit', unit.getAttribute('id'));
      continue;
    }

    sourceTextNodes.forEach((sourceTextNode, index) => {
      const sourceText = sourceTextNode.nodeValue ?? '';
      if (!sourceText.trim()) {
        return;
      }

      const targetTextNode = targetTextNodes[index];
      jobs.push({
        id: `${unit.getAttribute('id') || 'unit'}::${index}`,
        sourceText,
        applyTranslation: (translatedText: string) => {
          targetTextNode.nodeValue = translatedText;
        },
      });
    });
  }

  return jobs;
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-[1.6rem] bg-slate-950 p-[1px] shadow-[0_18px_60px_rgba(15,23,42,0.18)]',
        className,
      )}
    >
      <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,#38bdf8_0%,#2563eb_58%,#0f172a_100%)]" />
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[calc(1.6rem-1px)] bg-[radial-gradient(circle_at_top,#0f172a_0%,#111827_55%,#020617_100%)]">
        <div className="absolute inset-[18%] rounded-[1.2rem] border border-white/12" />
        <div className="absolute h-[68%] w-[68%] rounded-full border border-cyan-300/45" />
        <div className="absolute h-[52%] w-[52%] rounded-full border border-sky-200/35" />
        <div className="absolute h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(125,211,252,0.7)]" />
        <div className="absolute left-[20%] top-[24%] h-[18%] w-[18%] rounded-md border border-white/15 bg-white/6 backdrop-blur-sm" />
        <div className="absolute right-[20%] bottom-[24%] h-[18%] w-[18%] rounded-md border border-white/15 bg-white/6 backdrop-blur-sm" />
        <svg viewBox="0 0 64 64" className="relative h-[58%] w-[58%]" aria-hidden="true">
          <defs>
            <linearGradient id="brandMarkStroke" x1="14" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E0F2FE" />
              <stop offset="1" stopColor="#7DD3FC" />
            </linearGradient>
          </defs>
          <path
            d="M20 20H31C33.2091 20 35 21.7909 35 24V28C35 30.2091 33.2091 32 31 32H20C17.7909 32 16 30.2091 16 28V24C16 21.7909 17.7909 20 20 20Z"
            stroke="url(#brandMarkStroke)"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M33 32H44C46.2091 32 48 33.7909 48 36V40C48 42.2091 46.2091 44 44 44H33C30.7909 44 29 42.2091 29 40V36C29 33.7909 30.7909 32 33 32Z"
            stroke="url(#brandMarkStroke)"
            strokeWidth="3"
            fill="none"
          />
          <path d="M29 28L35 32" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 26H27" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
          <path d="M37 38H40" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function LanguageSelector({
  selected,
  onChange,
  searchPlaceholder,
  emptyState,
}: {
  selected: LanguageOption;
  onChange: (lang: LanguageOption) => void;
  searchPlaceholder: string;
  emptyState: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = TARGET_LANGUAGES.filter(
    (language) =>
      language.name.toLowerCase().includes(search.toLowerCase()) ||
      language.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen((value) => !value)}
      >
        <div className="flex items-center gap-3">
          <span className={`fi fi-${selected.flag} text-xl rounded-sm overflow-hidden`} />
          <span className="font-medium text-gray-700">{selected.name}</span>
        </div>
        <ChevronDown className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 flex max-h-80 w-full flex-col rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">{emptyState}</div>
            ) : (
              filtered.map((language) => (
                <button
                  key={language.code}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-blue-50 transition-colors',
                    selected.code === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700',
                  )}
                  onClick={() => {
                    onChange(language);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span className={`fi fi-${language.flag} text-lg rounded-sm overflow-hidden`} />
                  <span className="font-medium">{language.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{language.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const [uiLocale, setUiLocale] = useState<UiLocale>(() => {
    const stored = localStorage.getItem('ui_locale');
    return stored === 'pt-BR' ? 'pt-BR' : 'en';
  });
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState<LanguageOption>(TARGET_LANGUAGES[0]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') ?? '');
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [translatedFileUrl, setTranslatedFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy = COPY[uiLocale];
  const trustItems = [
    { label: copy.trustBrowserOnly, icon: ShieldCheck },
    { label: copy.trustStructureSafe, icon: FileCog },
    { label: copy.trustNoFallbacks, icon: Sparkles },
  ];
  const readinessItems = [
    { label: copy.byokTitle, ready: apiKey.trim().length > 0 },
    { label: copy.uploadTitle, ready: Boolean(file) },
    { label: copy.targetLanguageTitle, ready: Boolean(targetLang.code) },
  ];

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('ui_locale', uiLocale);
    document.documentElement.lang = uiLocale;
  }, [uiLocale]);

  useEffect(() => {
    return () => {
      if (translatedFileUrl) {
        URL.revokeObjectURL(translatedFileUrl);
      }
    };
  }, [translatedFileUrl]);

  const startButtonLabel = useMemo(
    () => formatMessage(copy.startTranslation, { language: targetLang.name }),
    [copy.startTranslation, targetLang.name],
  );

  const successBody = useMemo(
    () => formatMessage(copy.successBody, { language: targetLang.name }),
    [copy.successBody, targetLang.name],
  );

  async function handleTranslate() {
    if (!file) {
      return;
    }

    if (!apiKey.trim()) {
      setError(copy.missingApiKey);
      return;
    }

    setIsTranslating(true);
    setProgress(0);
    setStatusText(copy.readingFile);
    setError(null);

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'application/xml');

      if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new Error(copy.invalidXml);
      }

      const fileNodes = doc.getElementsByTagName('file');
      for (let index = 0; index < fileNodes.length; index += 1) {
        fileNodes[index].setAttribute('target-language', targetLang.code);
      }

      const transUnits = Array.from(doc.getElementsByTagName('trans-unit'));
      const jobs = buildTranslationJobs(doc, transUnits);

      if (jobs.length === 0) {
        throw new Error(copy.noTextFound);
      }

      const batchSize = 50;
      const concurrency = 3;
      const totalBatches = Math.ceil(jobs.length / batchSize);
      let completedBatches = 0;

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += concurrency) {
        const currentBatches: TranslationJob[][] = [];

        for (
          let concurrentIndex = 0;
          concurrentIndex < concurrency && batchIndex + concurrentIndex < totalBatches;
          concurrentIndex += 1
        ) {
          currentBatches.push(
            jobs.slice((batchIndex + concurrentIndex) * batchSize, (batchIndex + concurrentIndex + 1) * batchSize),
          );
        }

        setStatusText(
          formatMessage(copy.batchStatus, {
            start: batchIndex + 1,
            end: batchIndex + currentBatches.length,
            total: totalBatches,
          }),
        );

        const results = await Promise.all(
          currentBatches.map(async (batch) => {
            const payload: Record<string, string> = {};
            batch.forEach((item) => {
              payload[item.id] = item.sourceText;
            });

            const translatedBatch = await translateBatch(payload, targetLang.name, apiKey.trim(), copy);
            return { batch, translatedBatch };
          }),
        );

        results.forEach(({ batch, translatedBatch }) => {
          batch.forEach((item) => {
            item.applyTranslation(translatedBatch[item.id] ?? item.sourceText);
          });
        });

        completedBatches += currentBatches.length;
        setProgress((completedBatches / totalBatches) * 100);
      }

      setStatusText(copy.finishingFile);
      setProgress(100);

      const serializer = new XMLSerializer();
      const finalXml = serializer.serializeToString(doc);
      const blob = new Blob([finalXml], { type: 'application/x-xliff+xml' });
      const nextUrl = URL.createObjectURL(blob);

      setTranslatedFileUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return nextUrl;
      });
      setStatusText(copy.translationDone);
    } catch (caughtError) {
      console.error(caughtError);
      const message = caughtError instanceof Error ? caughtError.message : copy.translationFailed;
      setError(message);
      setStatusText(copy.translationFailed);
    } finally {
      setIsTranslating(false);
    }
  }

  function resetCurrentFile() {
    setFile(null);
    setTranslatedFileUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return null;
    });
    setProgress(0);
  }

  function handleIncomingFile(nextFile: File) {
    if (!nextFile.name.endsWith('.xlf') && !nextFile.name.endsWith('.xliff')) {
      alert(copy.invalidFileAlert);
      return;
    }

    setFile(nextFile);
    setTranslatedFileUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return null;
    });
    setError(null);
    setProgress(0);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f5fbff_0%,#f8fafc_36%,#eef2ff_100%)] font-sans text-slate-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.14),transparent_24%)]" />

        <header className="relative border-b border-white/70 bg-white/75 px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-0"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-700 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {copy.heroBadge}
                </span>

                <div className="mt-5 flex items-start gap-4">
                  <BrandMark className="h-14 w-14 shrink-0" />
                  <div className="min-w-0">
                    <h1 className="font-display text-4xl leading-none text-slate-950 sm:text-5xl">{copy.appTitle}</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{copy.appSubtitle}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {trustItems.map(({ label, icon: Icon }) => (
                    <div
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-sm text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                    >
                      <Icon className="h-4 w-4 text-sky-600" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0, x: 14 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="w-full rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:max-w-xs"
              >
                <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-3">
                  {copy.uiLanguageLabel}
                </label>
                <select
                  value={uiLocale}
                  onChange={(event) => setUiLocale(event.target.value as UiLocale)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {UI_LOCALES.map((locale) => (
                    <option key={locale.code} value={locale.code}>
                      {locale.label}
                    </option>
                  ))}
                </select>
              </motion.div>
            </div>
          </div>
        </header>

        <main className="relative flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col gap-8 mt-4">
        <motion.section
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">{copy.byokTitle}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{copy.keyInputLabel}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy.byokDescription}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sky-700">
              <KeyRound className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {copy.keyInputLabel}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                setError(null);
              }}
              placeholder={copy.apiKeyPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-slate-500 leading-6">{copy.localStorageNote}</p>
              <button
                type="button"
                onClick={() => setApiKey('')}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 whitespace-nowrap"
              >
                {copy.clearKey}
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">{copy.uploadTitle}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{copy.uploadPrompt}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy.uploadHelp}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sky-700">
              <UploadCloud className="h-5 w-5" />
            </div>
          </div>

          <motion.div
            whileHover={shouldReduceMotion ? undefined : { y: -2 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'mt-6 border-2 border-dashed rounded-[1.75rem] p-10 flex flex-col items-center justify-center transition-colors cursor-pointer text-center',
              file
                ? 'border-emerald-300 bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fafc_100%)]'
                : 'border-sky-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] hover:border-sky-400',
            )}
            onClick={() => document.getElementById('file-upload')?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const droppedFile = event.dataTransfer.files?.[0];
              if (droppedFile) {
                handleIncomingFile(droppedFile);
              }
            }}
          >
            <input
              id="file-upload"
              type="file"
              accept=".xlf,.xliff"
              className="hidden"
              onChange={(event) => {
                const chosenFile = event.target.files?.[0];
                if (chosenFile) {
                  handleIncomingFile(chosenFile);
                }
              }}
            />

            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file-loaded"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/12 text-emerald-600">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <p className="mt-5 break-words text-xl font-semibold text-slate-900">{file.name}</p>
                  <p className="mt-2 text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    className="mt-5 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                    onClick={(event) => {
                      event.stopPropagation();
                      resetCurrentFile();
                    }}
                  >
                    {copy.replaceFile}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="file-empty"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-600">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <p className="mt-5 text-xl font-semibold text-slate-900">{copy.uploadPrompt}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{copy.uploadHelp}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.section>

        <motion.section
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'relative z-20 rounded-[2rem] border border-slate-200/80 bg-white/85 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-opacity',
            !file && 'opacity-60',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">{copy.targetLanguageTitle}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{targetLang.name}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy.languagePanelHint}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sky-700">
              <Languages className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6">
            <LanguageSelector
              selected={targetLang}
              onChange={setTargetLang}
              searchPlaceholder={copy.searchLanguagePlaceholder}
              emptyState={copy.noLanguagesFound}
            />
          </div>
        </motion.section>

        <motion.section
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'relative z-0 rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-opacity',
            (!file || !apiKey.trim()) && 'opacity-80',
          )}
        >
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">{copy.translateTitle}</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">{copy.actionPanelTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {copy.actionPanelBody}
              </p>

              <div className="mt-6 space-y-3">
                {readinessItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm',
                      item.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-600',
                    )}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                      {item.ready ? copy.readyLabel : copy.pendingLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 xl:max-w-xl">
              {!isTranslating && !translatedFileUrl && (
                <motion.button
                  whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  onClick={handleTranslate}
                  disabled={!file || !apiKey.trim()}
                  className="w-full py-4 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#38bdf8_100%)] text-white rounded-[1.3rem] font-bold text-lg shadow-[0_20px_60px_rgba(37,99,235,0.35)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Globe className="w-5 h-5" />
                  {startButtonLabel}
                </motion.button>
              )}

              {isTranslating && (
                <div className="w-full p-6 bg-blue-50 rounded-[1.4rem] border border-blue-100 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                  <p className="text-blue-900 font-medium text-lg mb-2 text-center">{statusText || copy.translating}</p>
                  <div className="w-full max-w-md bg-blue-200 rounded-full h-2.5 mb-1 overflow-hidden">
                    <motion.div
                      className="bg-[linear-gradient(90deg,#0f172a_0%,#2563eb_45%,#38bdf8_100%)] h-2.5 rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: 'easeOut' }}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-blue-700 text-sm font-medium">
                    {formatMessage(copy.progressDone, { progress: Math.round(progress) })}
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-[1.4rem] flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 font-medium">{copy.translationErrorTitle}</h3>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="mt-2 text-sm text-red-700 hover:underline font-medium"
                    >
                      {copy.tryAgain}
                    </button>
                  </div>
                </div>
              )}

              {translatedFileUrl && !isTranslating && (
                <div className="w-full p-8 bg-green-50 rounded-[1.4rem] border border-green-200 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-green-900 font-bold text-xl mb-2">{copy.successTitle}</h3>
                  <p className="text-green-700 mb-6">{successBody}</p>

                  <a
                    href={translatedFileUrl}
                    download={`translated_${targetLang.code}_${file?.name}`}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {copy.downloadButton}
                  </a>

                  <button
                    onClick={resetCurrentFile}
                    className="mt-4 text-green-700 hover:underline text-sm font-medium"
                  >
                    {copy.translateAnotherFile}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </main>
      </div>
    </MotionConfig>
  );
}
