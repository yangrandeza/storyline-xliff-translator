import { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Download, Search, ChevronDown, Globe } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cn } from './lib/utils';
import 'flag-icons/css/flag-icons.min.css';

const LANGUAGES = [
  { code: 'en', name: 'Inglês', flag: 'us' },
  { code: 'es', name: 'Espanhol', flag: 'es' },
  { code: 'fr', name: 'Francês', flag: 'fr' },
  { code: 'de', name: 'Alemão', flag: 'de' },
  { code: 'it', name: 'Italiano', flag: 'it' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: 'br' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: 'pt' },
  { code: 'zh-CN', name: 'Chinês (Simplificado)', flag: 'cn' },
  { code: 'zh-TW', name: 'Chinês (Tradicional)', flag: 'tw' },
  { code: 'ja', name: 'Japonês', flag: 'jp' },
  { code: 'ko', name: 'Coreano', flag: 'kr' },
  { code: 'ru', name: 'Russo', flag: 'ru' },
  { code: 'ar', name: 'Árabe', flag: 'sa' },
  { code: 'hi', name: 'Hindi', flag: 'in' },
  { code: 'nl', name: 'Holandês', flag: 'nl' },
  { code: 'tr', name: 'Turco', flag: 'tr' },
  { code: 'sv', name: 'Sueco', flag: 'se' },
  { code: 'pl', name: 'Polonês', flag: 'pl' },
  { code: 'id', name: 'Indonésio', flag: 'id' },
  { code: 'vi', name: 'Vietnamita', flag: 'vn' },
  { code: 'th', name: 'Tailandês', flag: 'th' },
  { code: 'cs', name: 'Tcheco', flag: 'cz' },
  { code: 'da', name: 'Dinamarquês', flag: 'dk' },
  { code: 'fi', name: 'Finlandês', flag: 'fi' },
  { code: 'el', name: 'Grego', flag: 'gr' },
  { code: 'he', name: 'Hebraico', flag: 'il' },
  { code: 'hu', name: 'Húngaro', flag: 'hu' },
  { code: 'no', name: 'Norueguês', flag: 'no' },
  { code: 'ro', name: 'Romeno', flag: 'ro' },
  { code: 'sk', name: 'Eslovaco', flag: 'sk' },
  { code: 'uk', name: 'Ucraniano', flag: 'ua' },
  { code: 'ms', name: 'Malaio', flag: 'my' },
  { code: 'bg', name: 'Búlgaro', flag: 'bg' },
  { code: 'hr', name: 'Croata', flag: 'hr' },
  { code: 'lt', name: 'Lituano', flag: 'lt' },
  { code: 'sl', name: 'Esloveno', flag: 'si' },
  { code: 'et', name: 'Estoniano', flag: 'ee' },
  { code: 'lv', name: 'Letão', flag: 'lv' },
  { code: 'sr', name: 'Sérvio', flag: 'rs' },
];

async function translateBatch(texts: Record<string, string>, targetLang: string, apiKey: string) {
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
      }
    });
    
    let text = response.text;
    if (text) {
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      return JSON.parse(text);
    }
    throw new Error("Resposta vazia da IA");
  } catch (e) {
    console.error("Translation error", e);
    const error = e as { status?: number; message?: string };
    if (error?.status === 429) {
      throw new Error('A API do Gemini respondeu 429: o projeto excedeu o limite de gastos/cota.');
    }
    throw new Error(error?.message || 'Falha ao chamar a API do Gemini.');
  }
}

type TranslationJob = {
  id: string;
  sourceText: string;
  applyTranslation: (translatedText: string) => void;
};

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

function LanguageSelector({ selected, onChange }: { selected: typeof LANGUAGES[0], onChange: (lang: typeof LANGUAGES[0]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = LANGUAGES.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <span className={`fi fi-${selected.flag} text-xl rounded-sm overflow-hidden`}></span>
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
                placeholder="Pesquisar idioma..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">Nenhum idioma encontrado</div>
            ) : (
              filtered.map(lang => (
                <button
                  key={lang.code}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-blue-50 transition-colors",
                    selected.code === lang.code ? "bg-blue-50 text-blue-700" : "text-gray-700"
                  )}
                  onClick={() => {
                    onChange(lang);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span className={`fi fi-${lang.flag} text-lg rounded-sm overflow-hidden`}></span>
                  <span className="font-medium">{lang.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{lang.code}</span>
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
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState(LANGUAGES[0]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') ?? '');
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [translatedFileUrl, setTranslatedFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const handleTranslate = async () => {
    if (!file) return;
    if (!apiKey.trim()) {
      setError('Informe uma chave da API Gemini para traduzir.');
      return;
    }
    setIsTranslating(true);
    setProgress(0);
    setStatusText('Lendo arquivo...');
    setError(null);
    
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'application/xml');
      
      if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new Error("O arquivo não é um XML/XLIFF válido.");
      }

      // Set target-language
      const fileNodes = doc.getElementsByTagName('file');
      for (let i = 0; i < fileNodes.length; i++) {
        fileNodes[i].setAttribute('target-language', targetLang.code);
      }

      const transUnits = Array.from(doc.getElementsByTagName('trans-unit'));
      const toTranslate = buildTranslationJobs(doc, transUnits);

      if (toTranslate.length === 0) {
        throw new Error("Nenhum texto encontrado para traduzir no arquivo.");
      }

      const BATCH_SIZE = 50;
      const CONCURRENCY = 3;
      const totalBatches = Math.ceil(toTranslate.length / BATCH_SIZE);
      
      let completedBatches = 0;
      
      for (let i = 0; i < totalBatches; i += CONCURRENCY) {
        const currentBatches = [];
        for (let j = 0; j < CONCURRENCY && i + j < totalBatches; j++) {
          currentBatches.push(toTranslate.slice((i + j) * BATCH_SIZE, (i + j + 1) * BATCH_SIZE));
        }
        
        setStatusText(`Traduzindo lotes ${i + 1} a ${i + currentBatches.length} de ${totalBatches}...`);
        
        const batchPromises = currentBatches.map(async (batch) => {
          const batchPayload: Record<string, string> = {};
          batch.forEach(item => {
            batchPayload[item.id] = item.sourceText;
          });
          
          const translatedBatch = await translateBatch(batchPayload, targetLang.name, apiKey.trim());
          return { batch, translatedBatch };
        });
        
        const results = await Promise.all(batchPromises);
        
        for (const { batch, translatedBatch } of results) {
          for (const item of batch) {
            item.applyTranslation(translatedBatch[item.id] ?? item.sourceText);
          }
        }
        
        completedBatches += currentBatches.length;
        setProgress((completedBatches / totalBatches) * 100);
      }
      
      setStatusText('Finalizando arquivo...');
      setProgress(100);
      
      const serializer = new XMLSerializer();
      const finalXml = serializer.serializeToString(doc);
      
      const blob = new Blob([finalXml], { type: 'application/x-xliff+xml' });
      const url = URL.createObjectURL(blob);
      setTranslatedFileUrl(url);
      setStatusText('Tradução concluída com sucesso!');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro durante a tradução.');
      setStatusText('Erro na tradução.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Storyline XLIFF Translator</h1>
            <p className="text-sm text-gray-500">Tradução automática com Google Gemini AI</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-8 mt-4">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">2</span>
            Informe sua chave Gemini
          </h2>

          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
              }}
              placeholder="Cole aqui sua API key do Gemini"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between gap-4 text-sm">
              <p className="text-gray-500">
                A chave fica salva apenas neste navegador via `localStorage` e é usada diretamente pelo front.
              </p>
              <button
                type="button"
                onClick={() => setApiKey('')}
                className="text-blue-600 hover:underline font-medium whitespace-nowrap"
              >
                Limpar chave
              </button>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">1</span>
            Envie seu arquivo XLIFF
          </h2>
          
          <div 
            className={cn(
              "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer",
              file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
            )}
            onClick={() => document.getElementById('file-upload')?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const f = e.dataTransfer.files[0];
                if (f.name.endsWith('.xlf') || f.name.endsWith('.xliff')) {
                  setFile(f);
                  setTranslatedFileUrl(null);
                } else {
                  alert('Por favor, envie um arquivo .xlf ou .xliff');
                }
              }
            }}
          >
            <input 
              id="file-upload" 
              type="file" 
              accept=".xlf,.xliff" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setTranslatedFileUrl(null);
                }
              }}
            />
            {file ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-green-800 font-medium text-lg">{file.name}</p>
                <p className="text-green-600 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button className="mt-4 text-sm text-blue-600 hover:underline" onClick={(e) => { e.stopPropagation(); setFile(null); setTranslatedFileUrl(null); }}>
                  Trocar arquivo
                </button>
              </>
            ) : (
              <>
                <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-700 font-medium text-lg">Clique ou arraste seu arquivo aqui</p>
                <p className="text-gray-500 text-sm mt-1">Suporta arquivos .xlf e .xliff do Articulate Storyline</p>
              </>
            )}
          </div>
        </section>

        {/* Language Selection */}
        <section className={cn("bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transition-opacity", !file && "opacity-50 pointer-events-none")}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">3</span>
            Escolha o idioma de destino
          </h2>
          <LanguageSelector selected={targetLang} onChange={setTargetLang} />
        </section>

        {/* Translation Action */}
        <section className={cn("bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transition-opacity", (!file || !apiKey.trim()) && "opacity-50 pointer-events-none")}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">4</span>
            Traduzir e Baixar
          </h2>
          
          {!isTranslating && !translatedFileUrl && (
            <button
              onClick={handleTranslate}
              disabled={!file || !apiKey.trim()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Globe className="w-5 h-5" />
              Iniciar Tradução para {targetLang.name}
            </button>
          )}

          {isTranslating && (
            <div className="w-full p-6 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-blue-900 font-medium text-lg mb-2">{statusText}</p>
              <div className="w-full max-w-md bg-blue-200 rounded-full h-2.5 mb-1 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-blue-700 text-sm font-medium">{Math.round(progress)}% concluído</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-medium">Erro na tradução</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-700 hover:underline font-medium"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {translatedFileUrl && !isTranslating && (
            <div className="w-full p-8 bg-green-50 rounded-xl border border-green-200 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-green-900 font-bold text-xl mb-2">Tradução Concluída!</h3>
              <p className="text-green-700 mb-6">Seu arquivo foi traduzido para {targetLang.name} com sucesso.</p>
              
              <a
                href={translatedFileUrl}
                download={`translated_${targetLang.code}_${file?.name}`}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Baixar Arquivo Traduzido
              </a>
              
              <button 
                onClick={() => {
                  setFile(null);
                  setTranslatedFileUrl(null);
                  setProgress(0);
                }}
                className="mt-4 text-green-700 hover:underline text-sm font-medium"
              >
                Traduzir outro arquivo
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
