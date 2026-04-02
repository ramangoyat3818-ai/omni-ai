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
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './lib/utils';
import { chatWithGemini, generateImage } from './lib/gemini';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Omni One. How can I assist you today?",
      type: 'text',
      timestamp: new Date(),
    }
  ]);
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: 'text',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (activeMode === 'chat') {
        const response = await chatWithGemini(input);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response || "I'm sorry, I couldn't process that.",
          type: 'text',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const imageUrl = await generateImage(input);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: imageUrl || "I'm sorry, I couldn't generate that image.",
          type: 'image',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Chat cleared. How else can I help?",
      type: 'text',
      timestamp: new Date(),
    }]);
  };

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
                onClick={clearChat}
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
              {/* Mock history items */}
              <div className="space-y-1">
                {['Project Alpha', 'Design Review', 'Market Analysis'].map((item, i) => (
                  <button key={i} className="w-full py-2 px-4 rounded-lg glass-hover text-white/40 text-xs text-left flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    {item}
                  </button>
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-white/10">
              <button className="w-full py-3 px-4 rounded-xl glass-hover flex items-center gap-3 text-sm text-white/60">
                <Settings className="w-4 h-4" />
                Settings
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto w-full space-y-8">
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
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
                  <span className="text-[10px] text-white/20 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
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
            <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
              <div className="glass px-4 py-1.5 rounded-full text-[10px] text-white/40 font-medium flex items-center gap-2">
                <Search className="w-3 h-3" />
                Omni One is ready for your command
              </div>
            </div>
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
            <p className="text-[10px] text-center mt-3 text-white/20">
              Omni One can make mistakes. Check important info.
            </p>
          </div>
        </div>

        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
      </main>
    </div>
  );
}
