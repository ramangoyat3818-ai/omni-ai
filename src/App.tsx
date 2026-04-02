import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Plus, 
  MessageSquare, 
  Image as ImageIcon, 
  Settings, 
  User, 
  Bot, 
  Loader2,
  Trash2,
  ChevronRight,
  Sparkles,
  Command,
  Search,
  Menu,
  X,
  LogOut,
  LogIn
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './lib/utils';
import { chatWithGemini, generateImage } from './lib/gemini';
import { auth, db, signIn, logout } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  setDoc,
  deleteDoc,
  getDocs,
  limit
} from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  timestamp: any;
}

interface Session {
  id: string;
  title: string;
  updatedAt: any;
}

export default function App() {
  const [user, loadingAuth] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<'chat' | 'image'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch sessions
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setActiveSessionId(null);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/sessions`),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      setSessions(sessionList);
      
      if (sessionList.length > 0 && !activeSessionId) {
        setActiveSessionId(sessionList[0].id);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch messages for active session
  useEffect(() => {
    if (!user || !activeSessionId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/sessions/${activeSessionId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [user, activeSessionId]);

  const createNewSession = async () => {
    if (!user) return;
    const sessionRef = await addDoc(collection(db, `users/${user.uid}/sessions`), {
      title: 'New Session',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    setActiveSessionId(sessionRef.id);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const sessionRef = await addDoc(collection(db, `users/${user.uid}/sessions`), {
        title: input.slice(0, 30) + '...',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      currentSessionId = sessionRef.id;
      setActiveSessionId(currentSessionId);
    }

    const userMessage = {
      role: 'user' as const,
      content: input,
      type: 'text' as const,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, `users/${user.uid}/sessions/${currentSessionId}/messages`), userMessage);
    setInput('');
    setIsLoading(true);

    try {
      if (activeMode === 'chat') {
        const response = await chatWithGemini(input);
        const assistantMessage = {
          role: 'assistant' as const,
          content: response || "I'm sorry, I couldn't process that.",
          type: 'text' as const,
          timestamp: serverTimestamp(),
        };
        await addDoc(collection(db, `users/${user.uid}/sessions/${currentSessionId}/messages`), assistantMessage);
      } else {
        const imageUrl = await generateImage(input);
        const assistantMessage = {
          role: 'assistant' as const,
          content: imageUrl || "I'm sorry, I couldn't generate that image.",
          type: 'image' as const,
          timestamp: serverTimestamp(),
        };
        await addDoc(collection(db, `users/${user.uid}/sessions/${currentSessionId}/messages`), assistantMessage);
      }
      
      // Update session timestamp and title if it's the first message
      await setDoc(doc(db, `users/${user.uid}/sessions`, currentSessionId), {
        updatedAt: serverTimestamp(),
      }, { merge: true });

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full glass p-10 rounded-[2.5rem] space-y-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto">
            <Command className="text-black w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Omni One</h1>
            <p className="text-white/40 text-sm">Universal AI Intelligence. Sign in to begin your journey.</p>
          </div>
          <button 
            onClick={signIn}
            className="w-full py-4 px-6 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-white/90 transition-all"
          >
            <LogIn className="w-5 h-5" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-72 glass border-r border-white/10 flex flex-col z-50"
          >
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <Command className="text-black w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">Omni One</span>
            </div>

            <div className="px-4 mb-6">
              <button 
                onClick={createNewSession}
                className="w-full py-3 px-4 rounded-xl glass-hover glass flex items-center gap-3 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New Session
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold px-4 mb-2">Modes</div>
              <button 
                onClick={() => setActiveMode('chat')}
                className={cn(
                  "w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm transition-all",
                  activeMode === 'chat' ? "bg-white text-black font-semibold" : "glass-hover text-white/60"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                Universal Chat
              </button>
              <button 
                onClick={() => setActiveMode('image')}
                className={cn(
                  "w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm transition-all",
                  activeMode === 'image' ? "bg-white text-black font-semibold" : "glass-hover text-white/60"
                )}
              >
                <ImageIcon className="w-4 h-4" />
                Image Forge
              </button>

              <div className="pt-8 text-[10px] uppercase tracking-widest text-white/40 font-bold px-4 mb-2">History</div>
              <div className="space-y-1">
                {sessions.map((session) => (
                  <button 
                    key={session.id} 
                    onClick={() => setActiveSessionId(session.id)}
                    className={cn(
                      "w-full py-2 px-4 rounded-lg text-xs text-left flex items-center gap-2 transition-all",
                      activeSessionId === session.id ? "bg-white/10 text-white" : "glass-hover text-white/40"
                    )}
                  >
                    <MessageSquare className="w-3 h-3 shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </button>
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-3 px-4 py-2">
                <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user.displayName}</p>
                  <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full py-3 px-4 rounded-xl glass-hover flex items-center gap-3 text-sm text-white/60"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 glass-hover rounded-lg text-white/60"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white/40" />
              <span className="text-sm font-medium text-white/60">
                {activeMode === 'chat' ? 'Universal Chat' : 'Image Forge'}
              </span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto w-full space-y-8">
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-20">
                <div className="w-16 h-16 rounded-3xl glass flex items-center justify-center">
                  <Bot className="w-8 h-8 text-white/20" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">Start a new conversation</h2>
                  <p className="text-sm text-white/40">Omni One is ready to help you with anything.</p>
                </div>
              </div>
            )}
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  msg.role === 'assistant' ? "bg-white text-black" : "glass"
                )}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "max-w-[85%] space-y-2",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm",
                    msg.role === 'user' ? "bg-white text-black font-medium" : "glass"
                  )}>
                    {msg.type === 'image' ? (
                      <div className="space-y-3">
                        <img 
                          src={msg.content} 
                          alt="Generated" 
                          className="rounded-lg w-full max-w-md border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <p className="text-xs text-white/40">Generated by Omni One</p>
                      </div>
                    ) : (
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="glass p-4 rounded-2xl flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                  <span className="text-sm text-white/40">Omni is thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={activeMode === 'chat' ? "Ask Omni anything..." : "Describe the image you want to forge..."}
                className="w-full glass rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none min-h-[60px] max-h-[200px]"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "absolute right-3 bottom-3 p-2 rounded-xl transition-all",
                  input.trim() && !isLoading ? "bg-white text-black" : "text-white/20 glass"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
      </main>
    </div>
  );
}
