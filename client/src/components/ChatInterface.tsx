import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatMessage } from '@shared/schema';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  compact?: boolean;
  placeholder?: string;
  suggestedReplies?: string[];
}

const SMART_PLACEHOLDERS = [
  "Tell me about your content idea...",
  "What topic should we create content about?",
  "Describe your target audience and message...",
  "What's your main goal for this video?",
  "Paste a link or text you want to remix..."
];

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  disabled = false,
  compact = false,
  placeholder,
  suggestedReplies = []
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState("");

  // Computed state for send button - ensures reactivity
  const canSend = input.trim().length > 0 && !isLoading && !disabled;

  // Auto-focus on mount
  useEffect(() => {
    if (!disabled && !isLoading) {
      // Small timeout to ensure DOM is ready and prevent layout shift focus jumps
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [disabled, isLoading]);

  // Set random smart placeholder on mount
  useEffect(() => {
    setDynamicPlaceholder(SMART_PLACEHOLDERS[Math.floor(Math.random() * SMART_PLACEHOLDERS.length)]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickReply = (reply: string) => {
    if (!isLoading && !disabled) {
      onSendMessage(reply);
    }
  };

  // Detect if last message might be a yes/no question
  const lastMessage = messages[messages.length - 1];
  const isYesNoQuestion = lastMessage?.role === 'assistant' &&
    /\?\s*$/.test(lastMessage.content) &&
    (/\b(yes|no|ready|sure|want|would you|shall|should|can|do you)\b/i.test(lastMessage.content));

  const defaultQuickReplies = isYesNoQuestion
    ? ['Yes', 'No', 'Tell me more']
    : [];

  const quickReplies = suggestedReplies.length > 0 ? suggestedReplies : defaultQuickReplies;

  return (
    <div className={`flex flex-col h-full ${compact ? '' : 'max-w-3xl mx-auto'}`}>
      <ScrollArea
        className="flex-1 px-4 py-6"
        data-testid="chat-scroll-area"
      >
        <div className="space-y-6">
          {messages.length === 0 && !compact && (
            <div className="text-center py-16">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                Content Assembly Line
              </h1>
              <p className="text-muted-foreground text-lg mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                Ready to assemble content? Tell me your topic.
              </p>
              <div className="flex flex-wrap justify-center gap-2 animate-in fade-in zoom-in duration-500 delay-300">
                <StatusBadge text="SYSTEM READY" variant="success" />
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-mono text-xs uppercase tracking-widest">
                Processing...
              </span>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Reply Buttons */}
      {quickReplies.length > 0 && !isLoading && !disabled && (
        <div className="px-4 pb-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {quickReplies.map((reply, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => handleQuickReply(reply)}
              className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all"
              data-testid={`quick-reply-${reply.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {reply}
            </Button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="relative group">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Select a hook to continue..." : (placeholder || dynamicPlaceholder)}
            disabled={isLoading || disabled}
            className={`resize-none pr-12 ${compact ? 'min-h-[80px]' : 'min-h-[120px]'} rounded-2xl transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:scale-[1.01]`}
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            className="absolute bottom-3 right-3 transition-all duration-200 hover:scale-105 active:scale-95"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`
          max-w-lg p-4 rounded-xl shadow-sm
          ${isUser
            ? 'bg-primary text-primary-foreground ml-auto'
            : 'bg-card border border-card-border'
          }
        `}
        data-testid={`message-${message.role}-${message.id}`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <span className="text-xs opacity-50 mt-2 block font-mono">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ text, variant = 'default' }: { text: string; variant?: 'default' | 'success' | 'warning' }) {
  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-green-500/10 text-green-600 border border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-mono uppercase tracking-widest rounded-full border ${variantClasses[variant]}`}
      data-testid={`status-badge-${text.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {text}
    </span>
  );
}
