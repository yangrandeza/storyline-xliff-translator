import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Download,
  Globe,
  Loader2,
  Search,
  UploadCloud,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
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
    uiLanguageLabel: string;
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
    uiLanguageLabel: 'App language',
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
    uiLanguageLabel: 'Idioma do app',
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
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 flex flex-col">
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-slate-900 p-[1px] shadow-lg shadow-blue-100">
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Globe className="w-6 h-6" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">{copy.appTitle}</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">{copy.appSubtitle}</p>
            </div>
          </div>

          <div className="w-full md:w-52 md:shrink-0">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              {copy.uiLanguageLabel}
            </label>
            <select
              value={uiLocale}
              onChange={(event) => setUiLocale(event.target.value as UiLocale)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {UI_LOCALES.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-8 mt-4">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{copy.byokTitle}</h2>
          <p className="text-sm text-gray-500 mb-4">{copy.byokDescription}</p>

          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                setError(null);
              }}
              placeholder={copy.apiKeyPlaceholder}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between gap-4 text-sm">
              <p className="text-gray-500">{copy.localStorageNote}</p>
              <button
                type="button"
                onClick={() => setApiKey('')}
                className="text-blue-600 hover:underline font-medium whitespace-nowrap"
              >
                {copy.clearKey}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{copy.uploadTitle}</h2>

          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer',
              file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50',
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

            {file ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-green-800 font-medium text-lg">{file.name}</p>
                <p className="text-green-600 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  className="mt-4 text-sm text-blue-600 hover:underline"
                  onClick={(event) => {
                    event.stopPropagation();
                    resetCurrentFile();
                  }}
                >
                  {copy.replaceFile}
                </button>
              </>
            ) : (
              <>
                <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-700 font-medium text-lg">{copy.uploadPrompt}</p>
                <p className="text-gray-500 text-sm mt-1">{copy.uploadHelp}</p>
              </>
            )}
          </div>
        </section>

        <section className={cn('bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transition-opacity', !file && 'opacity-50 pointer-events-none')}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{copy.targetLanguageTitle}</h2>
          <LanguageSelector
            selected={targetLang}
            onChange={setTargetLang}
            searchPlaceholder={copy.searchLanguagePlaceholder}
            emptyState={copy.noLanguagesFound}
          />
        </section>

        <section
          className={cn(
            'bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transition-opacity',
            (!file || !apiKey.trim()) && 'opacity-50 pointer-events-none',
          )}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{copy.translateTitle}</h2>

          {!isTranslating && !translatedFileUrl && (
            <button
              onClick={handleTranslate}
              disabled={!file || !apiKey.trim()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Globe className="w-5 h-5" />
              {startButtonLabel}
            </button>
          )}

          {isTranslating && (
            <div className="w-full p-6 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-blue-900 font-medium text-lg mb-2">{statusText || copy.translating}</p>
              <div className="w-full max-w-md bg-blue-200 rounded-full h-2.5 mb-1 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-blue-700 text-sm font-medium">
                {formatMessage(copy.progressDone, { progress: Math.round(progress) })}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
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
            <div className="w-full p-8 bg-green-50 rounded-xl border border-green-200 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
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
        </section>
      </main>
    </div>
  );
}
