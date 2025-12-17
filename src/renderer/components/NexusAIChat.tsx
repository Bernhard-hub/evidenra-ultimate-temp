// ============================================================================
// NEXUS AI CHAT - Next-Level Futuristic AI Assistant v2.0
// ============================================================================
// Features:
// - Multi-Provider: Claude, GPT, Groq, Ollama, LM Studio, Bridge
// - Research Context: Sees documents, categories, analysis in real-time
// - NOVUM: Auto-Coding Suggestions based on conversation
// - Futuristic Glassmorphism Design with Neon Effects
// - NEW v2.0: Streaming, Direct Actions, Persistence, Auto-Coding, RAG, Voice
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconSend,
  IconRobot,
  IconUser,
  IconSparkles,
  IconBrain,
  IconTrash,
  IconCopy,
  IconCheck,
  IconSettings,
  IconChevronDown,
  IconFileText,
  IconCategory,
  IconCode,
  IconBulb,
  IconWand,
  IconRefresh,
  IconX,
  IconMicrophone,
  IconPlayerStop,
  IconLoader2,
  IconPlus,
  IconSearch,
  IconHighlight,
  IconBookmark,
  IconHistory,
  IconDownload,
  IconUpload,
  IconCompass
} from '@tabler/icons-react';
import APIService, { type APIMessage } from '../../services/APIService';

// ============================================================================
// TYPES
// ============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: string;
  model?: string;
  tokens?: number;
  cost?: number;
  context?: ResearchContext;
  suggestions?: AutoSuggestion[];
  actions?: DirectAction[];
  isStreaming?: boolean;
}

interface ResearchContext {
  documents?: { name: string; pageCount: number; preview: string }[];
  categories?: { name: string; count: number }[];
  currentTab?: string;
  analysisProgress?: number;
  selectedText?: string;
}

interface AutoSuggestion {
  type: 'code' | 'category' | 'question' | 'insight';
  title: string;
  content: string;
  confidence: number;
}

// NEW: Direct Actions that NEXUS can execute
// Note: 'create_category' removed - categories should only be created via dedicated UI
interface DirectAction {
  type: 'create_code' | 'add_coding' | 'highlight_text' | 'search_documents' | 'add_research_question' | 'add_memo';
  label: string;
  data: any;
  executed?: boolean;
}

// NEW: Chat Session for persistence
interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// NEW: Document Embedding for RAG
interface DocumentEmbedding {
  documentId: string;
  documentName: string;
  chunks: {
    text: string;
    startIndex: number;
    endIndex: number;
    embedding?: number[];
  }[];
}

interface NexusAIChatProps {
  // API Settings (from parent App)
  apiKey: string;
  provider: string;
  model: string;

  // Research Context (NOVUM - App Integration)
  documents?: any[];
  categories?: any[];
  codings?: any[];
  currentAnalysis?: any;
  selectedText?: string;

  // NEW: Direct Action Callbacks
  // Note: onCreateCategory removed - categories should only be created via dedicated UI
  onApplySuggestion?: (suggestion: AutoSuggestion) => void;
  onCreateCode?: (categoryId: string, text: string, memo?: string) => void;
  onAddCoding?: (documentId: string, categoryId: string, text: string, startIndex: number, endIndex: number) => void;
  onHighlightText?: (documentId: string, startIndex: number, endIndex: number) => void;
  onSearchDocuments?: (query: string) => Promise<any[]>;
  onAddResearchQuestion?: (question: string, category?: string, rationale?: string) => void;
  onAddMemo?: (type: string, title: string, content: string, relatedCategory?: string) => void;

  // UI Settings
  isOpen: boolean;
  onClose: () => void;
  position?: 'sidebar' | 'modal' | 'floating';
  language?: 'de' | 'en';
  onLanguageChange?: (lang: 'de' | 'en') => void;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================
const STORAGE_KEY_SESSIONS = 'nexus_chat_sessions';
const STORAGE_KEY_CURRENT_SESSION = 'nexus_current_session';
const STORAGE_KEY_EMBEDDINGS = 'nexus_document_embeddings';

// ============================================================================
// NEXUS AI CHAT COMPONENT
// ============================================================================

export const NexusAIChat: React.FC<NexusAIChatProps> = ({
  apiKey,
  provider,
  model,
  documents = [],
  categories = [],
  codings = [],
  currentAnalysis,
  selectedText,
  onApplySuggestion,
  onCreateCode,
  onAddCoding,
  onHighlightText,
  onSearchDocuments,
  onAddResearchQuestion,
  onAddMemo,
  isOpen,
  onClose,
  position = 'floating',
  language = 'de',
  onLanguageChange
}) => {
  // i18n translations
  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      'nexus_title': { de: 'NEXUS AI', en: 'NEXUS AI' },
      'assistant': { de: 'Forschungsassistent', en: 'Research Assistant' },
      'thinking': { de: 'NEXUS denkt nach...', en: 'NEXUS is thinking...' },
      'placeholder': { de: 'Frag NEXUS etwas...', en: 'Ask NEXUS something...' },
      'send': { de: 'Senden', en: 'Send' },
      'clear_chat': { de: 'Chat löschen', en: 'Clear chat' },
      'copy': { de: 'Kopieren', en: 'Copy' },
      'copied': { de: 'Kopiert!', en: 'Copied!' },
      'new_session': { de: 'Neue Sitzung', en: 'New Session' },
      'sessions': { de: 'Sitzungen', en: 'Sessions' },
      'chat_history': { de: 'Chat-Verlauf', en: 'Chat History' },
      'messages': { de: 'Nachrichten', en: 'messages' },
      'context': { de: 'Kontext', en: 'Context' },
      'context_full': { de: 'Vollständig', en: 'Full' },
      'context_minimal': { de: 'Minimal', en: 'Minimal' },
      'context_off': { de: 'Aus', en: 'Off' },
      'documents': { de: 'Dokumente', en: 'Documents' },
      'categories': { de: 'Kategorien', en: 'Categories' },
      'codings': { de: 'Kodierungen', en: 'Codings' },
      'quick_actions': { de: 'Schnellaktionen', en: 'Quick Actions' },
      'analyze_patterns': { de: 'Muster analysieren', en: 'Analyze patterns' },
      'suggest_codes': { de: 'Codes vorschlagen', en: 'Suggest codes' },
      'summarize': { de: 'Zusammenfassen', en: 'Summarize' },
      'summarize_docs': { de: 'Dokumente zusammenfassen', en: 'Summarize documents' },
      'methodology': { de: 'Methodologie', en: 'Methodology' },
      'recording': { de: 'Aufnahme...', en: 'Recording...' },
      'stop_recording': { de: 'Aufnahme stoppen', en: 'Stop recording' },
      'voice_input': { de: 'Spracheingabe', en: 'Voice input' },
      'no_api_key': { de: 'Kein API-Schlüssel konfiguriert', en: 'No API key configured' },
      'suggestions': { de: 'Vorschläge', en: 'Suggestions' },
      'actions': { de: 'Aktionen', en: 'Actions' },
      'execute': { de: 'Ausführen', en: 'Execute' },
      'executed': { de: 'Ausgeführt', en: 'Executed' },
      'add_question': { de: 'Forschungsfrage hinzufügen', en: 'Add research question' },
      'add_memo': { de: 'Memo hinzufügen', en: 'Add memo' },
      'add_code': { de: 'Code hinzufügen', en: 'Add code' },
      'search_docs': { de: 'Dokumente durchsuchen', en: 'Search documents' },
      'text_selected': { de: 'Text markiert', en: 'Text selected' },
      'quality_coach': { de: 'Qualitäts-Coach', en: 'Quality Coach' },
      'reflexivity_dialog': { de: 'Reflexivitäts-Dialog', en: 'Reflexivity Dialog' },
      'memo_assistant': { de: 'Memo-Assistent', en: 'Memo Assistant' },
      'saturation_advisor': { de: 'Sättigungs-Berater', en: 'Saturation Advisor' },
      'synthesis_helper': { de: 'Synthese-Helfer', en: 'Synthesis Helper' },
      'methodology_advisor': { de: 'Methodologie-Berater', en: 'Methodology Advisor' },
      'search_results': { de: 'Suchergebnisse', en: 'Search results' },
      'no_results': { de: 'Keine Ergebnisse gefunden', en: 'No results found' },
      'mic_error': { de: 'Mikrofon-Fehler', en: 'Microphone error' },
      'mic_permission': { de: 'Bitte erlaube den Zugriff auf das Mikrofon in deinem Browser.', en: 'Please allow microphone access in your browser.' },
      'transcription_failed': { de: 'Transkription fehlgeschlagen', en: 'Transcription failed' },
      'transcription_error_msg': { de: 'Die Spracherkennung konnte nicht durchgeführt werden. Bitte nutze die Texteingabe.', en: 'Speech recognition failed. Please use text input.' },
      'voice_recorded': { de: 'Spracheingabe aufgenommen', en: 'Voice input recorded' },
      'voice_openai_required': { de: 'Für automatische Transkription wird ein OpenAI API-Key benötigt.', en: 'OpenAI API key required for automatic transcription.' },
      'api_key_missing': { de: 'API Key fehlt!', en: 'API Key missing!' },
      'api_key_missing_msg': { de: 'Bitte konfiguriere deinen API Key in den Einstellungen, um den Chat zu nutzen.', en: 'Please configure your API key in settings to use the chat.' },
      'connection_error': { de: 'Verbindungsfehler', en: 'Connection error' },
      'connection_error_msg': { de: 'Stelle sicher, dass du online bist und der API-Key gültig ist.', en: 'Make sure you are online and the API key is valid.' },
      'tokens': { de: 'Tokens', en: 'tokens' },
      'docs': { de: 'Docs', en: 'Docs' },
      'pages': { de: 'Seiten', en: 'pages' },
    };
    return translations[key]?.[language] || key;
  };
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contextMode, setContextMode] = useState<'full' | 'minimal' | 'off'>('full');
  const [streamingText, setStreamingText] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);

  // NEW: Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // NEW: Session Management State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessionMenu, setShowSessionMenu] = useState(false);

  // NEW: RAG/Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [documentEmbeddings, setDocumentEmbeddings] = useState<DocumentEmbedding[]>([]);

  // NEW: Action Execution State
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================================
  // PERSISTENCE - Load/Save Sessions
  // ============================================================================

  useEffect(() => {
    // Load sessions from localStorage
    try {
      const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        })));
      }

      const currentId = localStorage.getItem(STORAGE_KEY_CURRENT_SESSION);
      if (currentId) {
        setCurrentSessionId(currentId);
      }
    } catch (e) {
      console.error('Error loading chat sessions:', e);
    }
  }, []);

  // Track if we're loading from session to prevent save loop
  const isLoadingFromSessionRef = useRef(false);
  const lastSavedMessagesRef = useRef<string>('');

  // Load current session messages - only when session ID changes
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        isLoadingFromSessionRef.current = true;
        setMessages(session.messages);
        setShowQuickActions(session.messages.length <= 1);
        lastSavedMessagesRef.current = JSON.stringify(session.messages);
        // Reset flag after state update
        setTimeout(() => {
          isLoadingFromSessionRef.current = false;
        }, 0);
      }
    }
  }, [currentSessionId]); // Removed 'sessions' dependency to break circular loop

  // Save sessions when messages change - with guard against circular updates
  useEffect(() => {
    // Skip if we're loading from session or no changes
    if (isLoadingFromSessionRef.current) return;
    if (!currentSessionId || messages.length === 0) return;

    // Check if messages actually changed
    const messagesJson = JSON.stringify(messages);
    if (messagesJson === lastSavedMessagesRef.current) return;

    lastSavedMessagesRef.current = messagesJson;

    setSessions(prevSessions => {
      const updatedSessions = prevSessions.map(s =>
        s.id === currentSessionId
          ? { ...s, messages, updatedAt: new Date() }
          : s
      );
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions));
      return updatedSessions;
    });
  }, [messages, currentSessionId]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Welcome message & create session if needed
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      // Create new session if none exists
      if (!currentSessionId) {
        createNewSession();
      } else {
        const welcomeDE = `# 🧠 Willkommen bei NEXUS AI - Dein Forschungsmentor

Ich bin dein **wissenschaftlicher Forschungsbegleiter** für qualitative Analysen:

### 🎓 Wie ich dich unterstütze:
- **📊 Qualitäts-Coach** - Überprüfe Gütekriterien (Glaubwürdigkeit, Übertragbarkeit, etc.)
- **🪞 Reflexivitäts-Dialog** - Hinterfrage deine Annahmen und Perspektiven
- **📝 Memo-Assistent** - Entwickle theoretische, methodische & analytische Memos
- **🎯 Sättigungs-Berater** - Analysiere die theoretische Sättigung deiner Daten
- **🔗 Synthese-Helfer** - Verbinde Kategorien zu einer kohärenten Theorie
- **🧭 Methodologie-Berater** - Finde die passende Forschungsmethode

### 🛠️ Technische Features:
- **🎙️ Spracheingabe** - Sprich mit mir!
- **⚡ Streaming** - Antworten in Echtzeit
- **🔍 Dokumentensuche** - Ich durchsuche deine Dokumente

${documents.length > 0 ? `\n📄 Du hast **${documents.length} Dokumente** in deinem Projekt.` : ''}
${categories.length > 0 ? `\n📁 Du arbeitest mit **${categories.length} Kategorien**.` : ''}
${codings.length > 0 ? `\n🏷️ Es gibt bereits **${codings.length} Codings**.` : ''}

**Tipp:** Nutze die Quick Actions unten oder stelle mir eine Frage zur qualitativen Forschung!`;

        const welcomeEN = `# 🧠 Welcome to NEXUS AI - Your Research Mentor

I'm your **scientific research companion** for qualitative analysis:

### 🎓 How I can help you:
- **📊 Quality Coach** - Check quality criteria (credibility, transferability, etc.)
- **🪞 Reflexivity Dialog** - Question your assumptions and perspectives
- **📝 Memo Assistant** - Develop theoretical, methodological & analytical memos
- **🎯 Saturation Advisor** - Analyze the theoretical saturation of your data
- **🔗 Synthesis Helper** - Connect categories into a coherent theory
- **🧭 Methodology Advisor** - Find the right research method

### 🛠️ Technical Features:
- **🎙️ Voice Input** - Talk to me!
- **⚡ Streaming** - Real-time responses
- **🔍 Document Search** - I search through your documents

${documents.length > 0 ? `\n📄 You have **${documents.length} documents** in your project.` : ''}
${categories.length > 0 ? `\n📁 You're working with **${categories.length} categories**.` : ''}
${codings.length > 0 ? `\n🏷️ There are already **${codings.length} codings**.` : ''}

**Tip:** Use the Quick Actions below or ask me a question about qualitative research!`;

        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: language === 'de' ? welcomeDE : welcomeEN,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [isOpen]);

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      name: `Chat ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setShowQuickActions(true);

    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions));
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, newSession.id);
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, sessionId);
    setShowSessionMenu(false);
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions));

    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        switchSession(updatedSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // ============================================================================
  // RESEARCH CONTEXT BUILDER (NOVUM)
  // ============================================================================

  const buildResearchContext = useCallback((): string => {
    if (contextMode === 'off') return '';

    let context = '\n\n---\n📊 AKTUELLER FORSCHUNGSKONTEXT:\n';

    // Documents with more detail
    if (documents.length > 0) {
      context += `\n### 📄 Dokumente (${documents.length}):\n`;
      documents.slice(0, 10).forEach((doc, i) => {
        const preview = doc.fullText?.substring(0, 500) || doc.content?.substring(0, 500) || '';
        context += `${i + 1}. **${doc.name || doc.filename}** (ID: ${doc.id || i}, ${doc.pageCount || '?'} Seiten)\n`;
        if (contextMode === 'full' && preview) {
          context += `   > "${preview.substring(0, 200)}..."\n`;
        }
      });
    }

    // Categories with codes
    if (categories.length > 0) {
      context += `\n### 📁 Kategorien (${categories.length}):\n`;
      categories.forEach((cat) => {
        const codeCount = cat.codes?.length || codings.filter((c: any) => c.categoryId === cat.id).length || 0;
        context += `- **${cat.name || cat.title}** (ID: ${cat.id}, ${codeCount} Codes, Farbe: ${cat.color || '#6366f1'})\n`;
        if (cat.description) {
          context += `  > ${cat.description}\n`;
        }
      });
    }

    // Existing codings
    if (codings.length > 0) {
      context += `\n### 🏷️ Vorhandene Codings (${codings.length}):\n`;
      codings.slice(0, 10).forEach((coding: any) => {
        const cat = categories.find((c: any) => c.id === coding.categoryId);
        context += `- "${coding.text?.substring(0, 50)}..." → ${cat?.name || 'Unbekannt'}\n`;
      });
    }

    // Selected Text (for context-aware responses)
    if (selectedText) {
      context += `\n### ✨ Aktuell markierter Text:\n"${selectedText.substring(0, 500)}${selectedText.length > 500 ? '...' : ''}"\n`;
    }

    // Current Analysis Progress
    if (currentAnalysis) {
      context += `\n### 📈 Analyse-Status:\n`;
      context += `- Fortschritt: ${currentAnalysis.progress || 0}%\n`;
      context += `- Phase: ${currentAnalysis.phase || 'Nicht gestartet'}\n`;
    }

    context += '\n---\n';
    context += '\n⚡ VERFÜGBARE AKTIONEN (nutze diese wenn der User es wünscht):\n';
    context += '- CREATE_CATEGORY: {"name": "Name", "color": "#hex", "description": "..."}\n';
    context += '- CREATE_CODE: {"categoryId": "id", "text": "Code-Text", "memo": "..."}\n';
    context += '- ADD_CODING: {"documentId": "id", "categoryId": "id", "text": "...", "startIndex": 0, "endIndex": 100}\n';
    context += '- SEARCH_DOCUMENTS: {"query": "Suchbegriff"}\n';
    context += '- AUTO_CODE_DOCUMENT: {"documentId": "id", "categoryIds": ["id1", "id2"]}\n';
    context += '\nWenn du eine Aktion ausführen willst, formatiere sie als: ```action\n{JSON}\n```\n';

    return context;
  }, [documents, categories, codings, selectedText, currentAnalysis, contextMode]);

  // ============================================================================
  // RAG: SEMANTIC SEARCH IN DOCUMENTS
  // ============================================================================

  const searchInDocuments = async (query: string): Promise<any[]> => {
    setIsSearching(true);

    try {
      // Use callback if provided
      if (onSearchDocuments) {
        const results = await onSearchDocuments(query);
        setSearchResults(results);
        return results;
      }

      // Fallback: Simple text search
      const results: any[] = [];
      const queryLower = query.toLowerCase();

      documents.forEach((doc: any) => {
        const text = doc.fullText || doc.content || '';
        const textLower = text.toLowerCase();
        let index = textLower.indexOf(queryLower);

        while (index !== -1) {
          const start = Math.max(0, index - 100);
          const end = Math.min(text.length, index + query.length + 100);
          results.push({
            documentId: doc.id,
            documentName: doc.name || doc.filename,
            snippet: text.substring(start, end),
            startIndex: index,
            relevance: 1.0
          });
          index = textLower.indexOf(queryLower, index + 1);
        }
      });

      setSearchResults(results.slice(0, 10));
      return results.slice(0, 10);
    } finally {
      setIsSearching(false);
    }
  };

  // ============================================================================
  // VOICE INPUT
  // ============================================================================

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Audio level visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateLevel);
        }
      };

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();

        // Transcribe audio using Whisper API (if OpenAI) or show message
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      updateLevel();

    } catch (error) {
      console.error('Error starting recording:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ **Mikrofon-Fehler**\n\nBitte erlaube den Zugriff auf das Mikrofon in deinem Browser.',
        timestamp: new Date()
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    // For now, show a message that transcription is in progress
    // In production, you'd send this to Whisper API

    if (provider === 'openai' && apiKey) {
      try {
        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'de');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          if (data.text) {
            setInput(data.text);
            // Auto-send after transcription
            setTimeout(() => sendMessage(data.text), 100);
          }
        } else {
          throw new Error('Transcription failed');
        }
      } catch (error) {
        console.error('Transcription error:', error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: '❌ **Transkription fehlgeschlagen**\n\nDie Spracherkennung konnte nicht durchgeführt werden. Bitte nutze die Texteingabe.',
          timestamp: new Date()
        }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Show message that voice input requires OpenAI
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🎙️ **Spracheingabe aufgenommen**\n\nFür automatische Transkription wird ein OpenAI API-Key benötigt. Mit anderen Providern kannst du die Aufnahme manuell transkribieren.',
        timestamp: new Date()
      }]);
    }
  };

  // ============================================================================
  // STREAMING API CALL
  // ============================================================================

  const streamMessage = async (messageText: string) => {
    const researchContext = buildResearchContext();

    const systemPrompt = language === 'en'
      ? `You are NEXUS v2.0, a highly intelligent AI research assistant in EVIDENRA.
You help with qualitative data analysis using the AKIH methodology.

IMPORTANT: You MUST respond in ENGLISH only. Never respond in German or any other language.

YOUR CAPABILITIES:
- Analyze and interpret documents
- Suggest AND DIRECTLY CREATE categories and codes
- Optimize research questions
- Identify patterns in data
- Write scientific texts
- Semantically search documents
- Perform automatic coding

ACTIONS:
You can execute direct actions! When the user asks you to create or search for something,
use the Action format. The user will then see buttons to execute the action.

RESPONSE FORMAT:
- Use Markdown for formatting
- Be precise but comprehensive
- Give concrete, actionable suggestions
- For actions use: \`\`\`action\n{"type": "...", ...}\n\`\`\`
- ALWAYS respond in English

${researchContext}`
      : `Du bist NEXUS v2.0, ein hochintelligenter KI-Forschungsassistent in EVIDENRA.
Du hilfst bei qualitativer Datenanalyse nach der AKIH-Methodologie.

WICHTIG: Du MUSST auf DEUTSCH antworten. Antworte niemals auf Englisch oder einer anderen Sprache.

DEINE FÄHIGKEITEN:
- Dokumente analysieren und interpretieren
- Kategorien und Codes vorschlagen UND DIREKT ERSTELLEN
- Forschungsfragen optimieren
- Muster in Daten erkennen
- Wissenschaftliche Texte formulieren
- Dokumente semantisch durchsuchen
- Automatisches Kodieren durchführen

AKTIONEN:
Du kannst direkte Aktionen ausführen! Wenn der User dich bittet, etwas zu erstellen oder zu suchen,
nutze das Action-Format. Der User sieht dann Buttons um die Aktion auszuführen.

ANTWORT-FORMAT:
- Nutze Markdown für Formatierung
- Sei präzise aber umfassend
- Gib konkrete, umsetzbare Vorschläge
- Für Aktionen nutze: \`\`\`action\n{"type": "...", ...}\n\`\`\`
- Antworte IMMER auf Deutsch

${researchContext}`;

    const apiMessages: APIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system').slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: messageText }
    ];

    // Check if provider supports streaming
    const supportsStreaming = ['openai', 'anthropic', 'groq'].includes(provider);

    if (supportsStreaming) {
      // Create streaming message
      const streamingMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: streamingMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        provider,
        model,
        isStreaming: true
      }]);

      abortControllerRef.current = new AbortController();

      try {
        let fullContent = '';

        // Use fetch for streaming
        const endpoint = provider === 'anthropic'
          ? 'https://api.anthropic.com/v1/messages'
          : provider === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        let body: any;

        if (provider === 'anthropic') {
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
          headers['anthropic-dangerous-direct-browser-access'] = 'true';
          body = {
            model: model,
            max_tokens: 4096,
            stream: true,
            system: systemPrompt,
            messages: apiMessages.filter(m => m.role !== 'system').map(m => ({
              role: m.role,
              content: m.content
            }))
          };
          console.log('🔑 NEXUS API Request:', { provider, model, hasApiKey: !!apiKey, apiKeyLength: apiKey?.length });
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
          body = {
            model: model,
            messages: apiMessages,
            max_tokens: 4096,
            stream: true
          };
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ NEXUS API Error:', response.status, errorText);
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

            for (const line of lines) {
              const data = line.replace('data: ', '').trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                let content = '';

                if (provider === 'anthropic') {
                  if (parsed.type === 'content_block_delta') {
                    content = parsed.delta?.text || '';
                  }
                } else {
                  content = parsed.choices?.[0]?.delta?.content || '';
                }

                if (content) {
                  fullContent += content;
                  setStreamingText(fullContent);

                  // Update message in real-time
                  setMessages(prev => prev.map(m =>
                    m.id === streamingMessageId
                      ? { ...m, content: fullContent }
                      : m
                  ));
                }
              } catch (e) {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
        }

        // Finalize message
        const suggestions = extractSuggestions(fullContent);
        const actions = extractActions(fullContent);

        setMessages(prev => prev.map(m =>
          m.id === streamingMessageId
            ? { ...m, content: fullContent, isStreaming: false, suggestions, actions }
            : m
        ));
        setStreamingText('');

      } catch (error: any) {
        if (error.name === 'AbortError') {
          // User cancelled
          setMessages(prev => prev.filter(m => m.id !== streamingMessageId));
        } else {
          setMessages(prev => prev.map(m =>
            m.id === streamingMessageId
              ? { ...m, content: `❌ **Fehler:** ${error.message}`, isStreaming: false }
              : m
          ));
        }
      }

    } else {
      // Fallback to non-streaming
      const response = await APIService.callAPI(provider, model, apiKey, apiMessages, 4096);

      if (response.success) {
        const suggestions = extractSuggestions(response.content);
        const actions = extractActions(response.content);

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          provider,
          model,
          tokens: response.tokens,
          cost: response.cost,
          suggestions,
          actions
        }]);
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    }
  };

  // ============================================================================
  // SEND MESSAGE
  // ============================================================================

  const sendMessage = async (customMessage?: string) => {
    const messageText = customMessage || input.trim();
    if (!messageText || isLoading) return;

    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ **API Key fehlt!**\n\nBitte konfiguriere deinen API Key in den Einstellungen, um den Chat zu nutzen.',
        timestamp: new Date()
      }]);
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      await streamMessage(messageText);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Verbindungsfehler:** ${error.message}\n\nStelle sicher, dass du online bist und der API-Key gültig ist.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel streaming
  const cancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setStreamingText('');
    }
  };

  // ============================================================================
  // EXTRACT AUTO-SUGGESTIONS (NOVUM)
  // ============================================================================

  const extractSuggestions = (content: string): AutoSuggestion[] => {
    const suggestions: AutoSuggestion[] = [];

    // Look for JSON suggestions block
    const jsonMatch = content.match(/```json\s*\{[\s\S]*?"suggestions"[\s\S]*?\}\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0].replace(/```json\s*|\s*```/g, ''));
        if (parsed.suggestions) {
          return parsed.suggestions;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Auto-detect category suggestions
    const categoryMatch = content.match(/Kategorie[n]?:\s*["']?([^"'\n]+)["']?/gi);
    if (categoryMatch) {
      categoryMatch.slice(0, 5).forEach(match => {
        const name = match.replace(/Kategorie[n]?:\s*/i, '').replace(/["']/g, '').trim();
        if (name.length > 2 && name.length < 50) {
          suggestions.push({
            type: 'category',
            title: 'Neue Kategorie',
            content: name,
            confidence: 0.8
          });
        }
      });
    }

    // Auto-detect code suggestions
    const codeMatch = content.match(/Code[s]?:\s*["']?([^"'\n]+)["']?/gi);
    if (codeMatch) {
      codeMatch.slice(0, 5).forEach(match => {
        const code = match.replace(/Code[s]?:\s*/i, '').replace(/["']/g, '').trim();
        if (code.length > 2 && code.length < 100) {
          suggestions.push({
            type: 'code',
            title: 'Neuer Code',
            content: code,
            confidence: 0.7
          });
        }
      });
    }

    return suggestions;
  };

  // ============================================================================
  // EXTRACT DIRECT ACTIONS
  // ============================================================================

  const extractActions = (content: string): DirectAction[] => {
    const actions: DirectAction[] = [];

    // Helper function to process action data
    // Note: CREATE_CATEGORY removed - categories should only be created via dedicated UI
    const processActionData = (actionData: any) => {
      if (actionData.type === 'CREATE_CODE' || actionData.type === 'create_code') {
        actions.push({
          type: 'create_code',
          label: `Code "${(actionData.text || actionData.data?.text)?.substring(0, 30)}..." erstellen`,
          data: actionData.data || actionData
        });
      } else if (actionData.type === 'ADD_CODING' || actionData.type === 'add_coding') {
        actions.push({
          type: 'add_coding',
          label: `Coding hinzufügen`,
          data: actionData.data || actionData
        });
      } else if (actionData.type === 'SEARCH_DOCUMENTS' || actionData.type === 'search_documents') {
        actions.push({
          type: 'search_documents',
          label: `Suche: "${actionData.query || actionData.data?.query}"`,
          data: actionData.data || actionData
        });
      } else if (actionData.type === 'ADD_RESEARCH_QUESTION' || actionData.type === 'add_research_question') {
        const data = actionData.data || actionData;
        actions.push({
          type: 'add_research_question',
          label: actionData.label || `Frage hinzufügen: "${(data.question || '').substring(0, 40)}..."`,
          data: data
        });
      } else if (actionData.type === 'ADD_MEMO' || actionData.type === 'add_memo') {
        const data = actionData.data || actionData;
        actions.push({
          type: 'add_memo',
          label: actionData.label || `Memo: "${(data.title || '').substring(0, 35)}..."`,
          data: data
        });
      }
    };

    // Look for action blocks (```action format)
    const actionMatches = content.matchAll(/```action\s*([\s\S]*?)```/g);
    for (const match of actionMatches) {
      try {
        const actionData = JSON.parse(match[1].trim());
        processActionData(actionData);
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Also look for inline JSON objects with type field (for research questions and memos)
    const jsonMatches = content.matchAll(/\{[^{}]*"type"\s*:\s*"(add_research_question|add_memo)"[^{}]*\}/g);
    for (const match of jsonMatches) {
      try {
        const actionData = JSON.parse(match[0]);
        processActionData(actionData);
      } catch (e) {
        // Ignore parse errors
      }
    }

    return actions;
  };

  // ============================================================================
  // EXECUTE DIRECT ACTION
  // ============================================================================

  const executeAction = async (action: DirectAction, messageId: string) => {
    setExecutingAction(action.label);

    try {
      switch (action.type) {
        // Note: create_category case removed - categories should only be created via dedicated UI

        case 'create_code':
          if (onCreateCode) {
            onCreateCode(
              action.data.categoryId,
              action.data.text,
              action.data.memo
            );
          }
          break;

        case 'add_coding':
          if (onAddCoding) {
            onAddCoding(
              action.data.documentId,
              action.data.categoryId,
              action.data.text,
              action.data.startIndex,
              action.data.endIndex
            );
          }
          break;

        case 'search_documents':
          const results = await searchInDocuments(action.data.query);
          // Add search results to chat
          if (results.length > 0) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: `🔍 **Suchergebnisse für "${action.data.query}":**\n\n${results.slice(0, 5).map((r, i) =>
                `${i + 1}. **${r.documentName}**\n   > "...${r.snippet}..."\n`
              ).join('\n')}`,
              timestamp: new Date()
            }]);
          } else {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: `🔍 Keine Ergebnisse für "${action.data.query}" gefunden.`,
              timestamp: new Date()
            }]);
          }
          break;

        case 'add_research_question':
          if (onAddResearchQuestion) {
            onAddResearchQuestion(
              action.data.question,
              action.data.category || 'ai-generated',
              action.data.rationale
            );
          }
          break;

        case 'add_memo':
          if (onAddMemo) {
            onAddMemo(
              action.data.memoType || action.data.type || 'analytical',
              action.data.title,
              action.data.content,
              action.data.relatedCategory
            );
          }
          break;
      }

      // Mark action as executed
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? {
              ...m,
              actions: m.actions?.map(a =>
                a.label === action.label ? { ...a, executed: true } : a
              )
            }
          : m
      ));

    } catch (error: any) {
      console.error('Action execution error:', error);
    } finally {
      setExecutingAction(null);
    }
  };

  // ============================================================================
  // QUICK ACTIONS
  // ============================================================================

  const quickActions = [
    {
      icon: IconFileText,
      label: t('summarize_docs'),
      prompt: language === 'de'
        ? 'Fasse die wichtigsten Erkenntnisse aus meinen Dokumenten zusammen. Gib mir einen strukturierten Überblick.'
        : 'Summarize the key findings from my documents. Give me a structured overview.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: IconWand,
      label: t('quality_coach'),
      prompt: `Du bist mein Qualitäts-Coach für qualitative Forschung nach Lincoln & Guba.

Analysiere meinen aktuellen Forschungsstand und bewerte die vier Gütekriterien:

1. **Glaubwürdigkeit (Credibility)**:
   - Sind meine Kategorien theoretisch fundiert?
   - Gibt es ausreichend Belege in den Dokumenten?
   - Wurde Member Checking oder Peer Debriefing durchgeführt?

2. **Übertragbarkeit (Transferability)**:
   - Sind meine Beschreibungen dicht genug (Thick Description)?
   - Ist der Kontext klar dokumentiert?
   - Können andere Forscher die Ergebnisse auf ähnliche Kontexte anwenden?

3. **Zuverlässigkeit (Dependability)**:
   - Ist mein Analyseprozess konsistent und nachvollziehbar?
   - Gibt es einen Audit Trail?
   - Wurden Entscheidungen dokumentiert?

4. **Bestätigbarkeit (Confirmability)**:
   - Sind meine Interpretationen durch Daten gestützt?
   - Habe ich meine Vorannahmen reflektiert?
   - Gibt es alternative Interpretationen?

Gib konkrete Verbesserungsvorschläge mit Prioritäten (hoch/mittel/niedrig).

Am Ende erstelle für JEDEN Verbesserungsvorschlag ein übernehmbares Memo:
{"type": "add_memo", "label": "Memo: [Kurztitel]", "data": {"memoType": "methodological", "title": "Memo-Titel", "content": "Detaillierter Memo-Inhalt..."}}`,
      color: 'from-emerald-500 to-green-500'
    },
    {
      icon: IconUser,
      label: t('reflexivity_dialog'),
      prompt: `Führe einen Reflexivitäts-Dialog mit mir als Forscher:in.

Stelle mir kritische Fragen zu meiner Positionierung:

1. **Persönliche Reflexivität**:
   - Welche persönlichen Erfahrungen bringe ich mit diesem Thema mit?
   - Wie könnten meine Vorannahmen die Analyse beeinflussen?

2. **Methodische Reflexivität**:
   - Warum habe ich diese Methode gewählt?
   - Welche blinden Flecken könnte mein Ansatz haben?

3. **Relationale Reflexivität**:
   - Wie beeinflusst meine Position als Forscher:in die Datenerhebung?
   - Welche Machtdynamiken sind relevant?

4. **Epistemologische Reflexivität**:
   - Welches Wissen wird durch meinen Ansatz produziert?
   - Welche Stimmen werden gehört, welche übersehen?

Stelle mir EINE Frage nach der anderen. Nach meiner Antwort erstelle ein reflexives Memo:
{"type": "add_memo", "label": "Memo: Reflexion [Thema]", "data": {"memoType": "reflexive", "title": "Reflexion: [Thema]", "content": "Meine Antwort zusammengefasst und dokumentiert..."}}`,
      color: 'from-violet-500 to-purple-500'
    },
    {
      icon: IconBookmark,
      label: t('memo_assistant'),
      prompt: `Du bist mein Memo-Assistent für die qualitative Analyse.

Basierend auf meinem aktuellen Forschungsstand, erstelle 3-5 relevante Memos:

Für JEDES Memo nutze dieses Format zum direkten Übernehmen:
{"type": "add_memo", "label": "Memo: [Kurztitel]", "data": {"memoType": "theoretical|methodological|analytical|reflexive|ethical", "title": "Memo-Titel", "content": "Detaillierter Memo-Inhalt mit wissenschaftlicher Begründung..."}}

Memo-Typen:
- **theoretical**: Theoretische Überlegungen, Konzeptentwicklung, Verbindungen zu Theorien
- **methodological**: Methodische Entscheidungen, Vorgehensweise, Anpassungen
- **analytical**: Muster, Zusammenhänge, analytische Beobachtungen
- **reflexive**: Forscher-Reflexivität, Bias-Bewusstsein, Positionierung
- **ethical**: Ethische Überlegungen, Datenschutz, sensible Themen

Erstelle mindestens ein Memo pro relevantem Typ basierend auf meinen Kategorien und Codings.`,
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: IconRefresh,
      label: t('saturation_advisor'),
      prompt: `Analysiere meinen Kodierprozess auf theoretische Sättigung:

1. **Kategorie-Entwicklung**:
   - Wie haben sich meine Kategorien über die Dokumente hinweg entwickelt?
   - Gibt es Kategorien, die schon "gesättigt" erscheinen (keine neuen Aspekte)?
   - Welche Kategorien brauchen noch mehr Belege?

2. **Code-Verteilung**:
   - Wie sind die Codings über die Dokumente verteilt?
   - Gibt es Dokumente, die weniger kodiert wurden?
   - Welche Kategorien sind unterrepräsentiert?

3. **Neue Erkenntnisse**:
   - Kommen in den letzten kodierten Dokumenten noch neue Codes hinzu?
   - Werden die Kategorien nur noch bestätigt oder auch erweitert?

4. **Empfehlung**:
   - Schätze den Grad der theoretischen Sättigung (0-100%)
   - Gib konkrete Empfehlungen: Mehr Daten sammeln? Kategorien verfeinern? Kodierung abschließen?

Erstelle am Ende ein methodisches Memo zur Sättigungsanalyse:
{"type": "add_memo", "label": "Memo: Sättigungsanalyse", "data": {"memoType": "methodological", "title": "Sättigungsanalyse [Datum]", "content": "Sättigungsgrad: X%\n\nKategorien-Status:\n- [Kategorie]: gesättigt/in Entwicklung\n\nEmpfehlung: ..."}}`,
      color: 'from-teal-500 to-cyan-500'
    },
    {
      icon: IconSearch,
      label: t('synthesis_helper'),
      prompt: `Hilf mir bei der Synthese meiner Analyseergebnisse:

1. **Kernthemen identifizieren**:
   - Was sind die 3-5 zentralen Themen meiner Analyse?
   - Wie hängen diese Themen zusammen?

2. **Beziehungen zwischen Kategorien**:
   - Welche Kategorien stehen in hierarchischer Beziehung?
   - Gibt es kausale oder korrelative Zusammenhänge?
   - Welche Widersprüche oder Spannungen gibt es?

3. **Narrative Struktur**:
   - Wie könnte ich meine Ergebnisse als kohärente Geschichte erzählen?
   - Was ist die "Kernbotschaft" meiner Analyse?

4. **Theoretische Integration**:
   - Wie verbinden sich meine Ergebnisse mit bestehenden Theorien?
   - Welche neuen theoretischen Erkenntnisse bietet meine Analyse?

Erstelle am Ende ein analytisches Memo mit der Synthese:
{"type": "add_memo", "label": "Memo: Ergebnis-Synthese", "data": {"memoType": "analytical", "title": "Synthese der Analyseergebnisse", "content": "Kernthemen:\n1. ...\n2. ...\n\nZusammenhänge:\n...\n\nKernbotschaft:\n..."}}`,
      color: 'from-rose-500 to-pink-500'
    },
    {
      icon: IconCompass,
      label: t('methodology_advisor'),
      prompt: `Berate mich bei der Wahl der passenden qualitativen Forschungsmethode.

Basierend auf meinen Dokumenten und Forschungsfragen, analysiere welche Methodologie am besten passt:

## 1. **Grounded Theory** (Glaser & Strauss, Charmaz)
   - Für: Theorieentwicklung aus Daten
   - Kernfragen: "Wie entsteht ein Phänomen?" "Welche Prozesse sind am Werk?"
   - Passt wenn: Du eine neue Theorie entwickeln möchtest, keine existierende Theorie gut passt
   - Verfahren: Offenes, axiales, selektives Kodieren

## 2. **Thematische Analyse** (Braun & Clarke)
   - Für: Flexible Identifikation von Mustern und Themen
   - Kernfragen: "Welche Themen tauchen auf?" "Wie sind sie verteilt?"
   - Passt wenn: Du einen pragmatischen, flexiblen Ansatz suchst
   - Verfahren: 6-Phasen-Modell von Braun & Clarke

## 3. **Phänomenologie** (Husserl, Heidegger, van Manen)
   - Für: Tiefes Verstehen gelebter Erfahrungen
   - Kernfragen: "Wie wird ein Phänomen erlebt?" "Was ist die Essenz der Erfahrung?"
   - Passt wenn: Du subjektive Erfahrungen verstehen willst
   - Verfahren: Epoché, Reduktion, Wesensschau

## 4. **Dokumentarische Methode** (Bohnsack)
   - Für: Rekonstruktion impliziten Wissens und Orientierungen
   - Kernfragen: "Was dokumentiert sich hier?" "Welche Orientierungsrahmen gibt es?"
   - Passt wenn: Du kollektive Orientierungen und Milieus verstehen willst
   - Verfahren: Formulierende und reflektierende Interpretation

## 5. **Qualitative Inhaltsanalyse** (Mayring, Kuckartz)
   - Für: Systematische, regelgeleitete Textanalyse
   - Kernfragen: "Was steht im Text?" "Wie lässt sich der Inhalt kategorisieren?"
   - Passt wenn: Du strukturiert und nachvollziehbar analysieren willst
   - Verfahren: Zusammenfassende, explizierende, strukturierende Inhaltsanalyse

## 6. **Narrationsanalyse** (Schütze, Rosenthal)
   - Für: Analyse von Lebensgeschichten und Erzählungen
   - Kernfragen: "Wie wird eine Geschichte erzählt?" "Welche Deutungsmuster zeigen sich?"
   - Passt wenn: Du biografische oder narrative Daten hast
   - Verfahren: Sequenzanalyse, Strukturierung der Erzählung

Analysiere meine Forschungsfragen und Dokumente und empfehle:
1. Die **bestgeeignete Methode** mit Begründung
2. **Alternativen** die auch passen könnten
3. **Konkrete nächste Schritte** für die gewählte Methode

Erstelle am Ende ein methodisches Memo mit der Empfehlung:
{"type": "add_memo", "label": "Memo: Methodologie-Entscheidung", "data": {"memoType": "methodological", "title": "Methodologie-Beratung", "content": "Empfohlene Methode: [Name]\n\nBegründung:\n...\n\nAlternativen:\n...\n\nNächste Schritte:\n1. ...\n2. ...\n3. ..."}}`,
      color: 'from-indigo-500 to-blue-500'
    }
  ];

  // ============================================================================
  // COPY MESSAGE
  // ============================================================================

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ============================================================================
  // CLEAR CHAT
  // ============================================================================

  const clearChat = () => {
    setMessages([]);
    setShowQuickActions(true);

    // Update session
    if (currentSessionId) {
      const updatedSessions = sessions.map(s =>
        s.id === currentSessionId
          ? { ...s, messages: [], updatedAt: new Date() }
          : s
      );
      setSessions(updatedSessions);
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions));
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed z-50 flex flex-col
        ${position === 'floating' ? 'bottom-6 right-6 w-[520px] h-[750px] rounded-3xl' : ''}
        ${position === 'sidebar' ? 'top-0 right-0 w-[450px] h-full rounded-l-3xl' : ''}
        ${position === 'modal' ? 'inset-4 md:inset-16 rounded-3xl' : ''}
        overflow-hidden
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: `
          0 0 60px rgba(99, 102, 241, 0.2),
          0 0 100px rgba(139, 92, 246, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `
      }}
    >
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-white/10"
        style={{
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))'
        }}
      >
        <div className="flex items-center gap-3">
          {/* Animated Logo */}
          <div
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
            }}
          >
            <IconBrain size={24} className="text-white" />
            {/* Pulse Animation */}
            <div
              className="absolute inset-0 rounded-xl animate-ping"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                opacity: 0.3,
                animationDuration: '2s'
              }}
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              NEXUS AI
              <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">v2.0</span>
              <IconSparkles size={16} className="text-amber-400" />
            </h2>
            <p className="text-xs text-gray-400">
              {provider.toUpperCase()} / {model.split('-').slice(0, 4).join('-')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          {onLanguageChange && (
            <button
              onClick={() => onLanguageChange(language === 'de' ? 'en' : 'de')}
              className="px-2 py-1 rounded-lg bg-gradient-to-r from-blue-600/40 to-purple-600/40 hover:from-blue-600/60 hover:to-purple-600/60 text-white font-medium text-xs transition-all border border-white/10"
              title={language === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
            >
              {language === 'de' ? 'EN' : 'DE'}
            </button>
          )}

          {/* Session Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSessionMenu(!showSessionMenu)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              title={t('chat_history')}
            >
              <IconHistory size={18} />
            </button>

            {showSessionMenu && (
              <div className="absolute right-0 top-12 w-64 bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{t('chat_history')}</span>
                  <button
                    onClick={createNewSession}
                    className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      className={`p-3 hover:bg-white/5 cursor-pointer flex items-center justify-between group ${
                        session.id === currentSessionId ? 'bg-purple-500/10' : ''
                      }`}
                      onClick={() => switchSession(session.id)}
                    >
                      <div>
                        <p className="text-sm text-white truncate">{session.name}</p>
                        <p className="text-xs text-gray-500">{session.messages.length} {t('messages')}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Context Mode Toggle */}
          <button
            onClick={() => setContextMode(prev => prev === 'full' ? 'minimal' : prev === 'minimal' ? 'off' : 'full')}
            className={`
              p-2 rounded-lg transition-all duration-300
              ${contextMode === 'full' ? 'bg-emerald-500/20 text-emerald-400' : ''}
              ${contextMode === 'minimal' ? 'bg-amber-500/20 text-amber-400' : ''}
              ${contextMode === 'off' ? 'bg-gray-500/20 text-gray-400' : ''}
            `}
            title={`Kontext: ${contextMode}`}
          >
            <IconFileText size={18} />
          </button>

          {/* Clear Chat */}
          <button
            onClick={clearChat}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
            title="Chat löschen"
          >
            <IconTrash size={18} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MESSAGES */}
      {/* ================================================================== */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99, 102, 241, 0.3) transparent'
        }}
      >
        {/* Quick Actions */}
        {showQuickActions && messages.length <= 1 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => sendMessage(action.prompt)}
                className="group p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 text-left"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                >
                  <action.icon size={20} className="text-white" />
                </div>
                <p className="text-sm font-medium text-white">{action.label}</p>
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`
                w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                ${message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'}
              `}
              style={{
                boxShadow: message.role === 'user'
                  ? '0 0 15px rgba(59, 130, 246, 0.4)'
                  : '0 0 15px rgba(168, 85, 247, 0.4)'
              }}
            >
              {message.role === 'user'
                ? <IconUser size={16} className="text-white" />
                : <IconRobot size={16} className="text-white" />
              }
            </div>

            {/* Message Content */}
            <div
              className={`
                max-w-[85%] rounded-2xl p-4 relative group
                ${message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                  : 'bg-white/5 border border-white/10'}
              `}
            >
              {/* Streaming Indicator */}
              {message.isStreaming && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full animate-pulse" />
              )}

              {/* Markdown Content */}
              <div
                className="text-sm text-gray-200 prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: message.content
                    .replace(/```action[\s\S]*?```/g, '') // Hide action blocks from display
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-purple-300">$1</code>')
                    .replace(/### (.*?)(\n|$)/g, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
                    .replace(/## (.*?)(\n|$)/g, '<h2 class="text-xl font-bold text-white mt-4 mb-2">$1</h2>')
                    .replace(/# (.*?)(\n|$)/g, '<h1 class="text-2xl font-bold text-white mt-4 mb-2">$1</h1>')
                    .replace(/- (.*?)(\n|$)/g, '<li class="ml-4 text-gray-300">$1</li>')
                    .replace(/\n/g, '<br/>')
                }}
              />

              {/* Copy Button */}
              <button
                onClick={() => copyMessage(message.id, message.content)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
              >
                {copiedId === message.id
                  ? <IconCheck size={14} className="text-emerald-400" />
                  : <IconCopy size={14} className="text-gray-400" />
                }
              </button>

              {/* Direct Actions (NEW) */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <IconWand size={12} />
                    {t('actions')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => executeAction(action, message.id)}
                        disabled={action.executed || executingAction === action.label}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1
                          ${action.executed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30'}
                        `}
                      >
                        {action.executed ? (
                          <IconCheck size={12} />
                        ) : executingAction === action.label ? (
                          <IconLoader2 size={12} className="animate-spin" />
                        ) : action.type === 'search_documents' ? (
                          <IconSearch size={12} />
                        ) : (
                          <IconCode size={12} />
                        )}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto Suggestions (NOVUM) */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <IconBulb size={12} />
                    {t('suggestions')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => onApplySuggestion?.(sug)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-xs text-purple-300 hover:bg-purple-500/30 transition-all"
                      >
                        {sug.type === 'category' && <IconCategory size={12} className="inline mr-1" />}
                        {sug.type === 'code' && <IconCode size={12} className="inline mr-1" />}
                        {sug.content}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Info */}
              {message.role === 'assistant' && message.tokens && !message.isStreaming && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-3 text-xs text-gray-500">
                  <span>{message.tokens} tokens</span>
                  {message.cost && message.cost > 0 && (
                    <span>${message.cost.toFixed(4)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && !streamingText && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500"
              style={{ boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)' }}
            >
              <IconRobot size={16} className="text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-gray-400">{t('thinking')}</span>
                <button
                  onClick={cancelStreaming}
                  className="ml-2 p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <IconX size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ================================================================== */}
      {/* INPUT */}
      {/* ================================================================== */}
      <div className="p-4 border-t border-white/10">
        {/* Context Indicator */}
        {contextMode !== 'off' && (documents.length > 0 || categories.length > 0) && (
          <div className="flex items-center gap-2 mb-3 px-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              <IconFileText size={12} />
              {documents.length} {t('docs')}
            </div>
            {categories.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                <IconCategory size={12} />
                {categories.length} {t('categories')}
              </div>
            )}
            {codings.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                <IconCode size={12} />
                {codings.length} {t('codings')}
              </div>
            )}
            {selectedText && (
              <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                <IconHighlight size={12} />
                {t('text_selected')}
              </div>
            )}
          </div>
        )}

        {/* Input Field */}
        <div
          className="flex items-end gap-3 p-3 rounded-2xl border border-white/10 bg-white/5"
          style={{
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Voice Input Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
              p-3 rounded-xl transition-all duration-300
              ${isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
            `}
            style={{
              boxShadow: isRecording ? `0 0 ${20 + audioLevel * 30}px rgba(239, 68, 68, ${0.4 + audioLevel * 0.4})` : 'none'
            }}
            title={isRecording ? t('stop_recording') : t('voice_input')}
          >
            {isRecording ? (
              <IconPlayerStop size={20} />
            ) : (
              <IconMicrophone size={20} />
            )}
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={t('placeholder')}
            className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm min-h-[24px] max-h-[120px]"
            rows={1}
            disabled={isLoading || isRecording}
          />

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className={`
              p-3 rounded-xl transition-all duration-300
              ${input.trim() && !isLoading
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                : 'bg-white/5 text-gray-500 cursor-not-allowed'}
            `}
            style={{
              boxShadow: input.trim() && !isLoading ? '0 0 20px rgba(168, 85, 247, 0.4)' : 'none'
            }}
          >
            {isLoading ? (
              <IconLoader2 size={20} className="animate-spin" />
            ) : (
              <IconSend size={20} />
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-3">
          NEXUS AI v2.0 • {provider.toUpperCase()} • {t('context')}: {contextMode} • {sessions.length} {t('sessions')}
        </p>
      </div>
    </div>
  );
};

export default NexusAIChat;
