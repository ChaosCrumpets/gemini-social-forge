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
}

export function ChatInterface({ 
  messages, 
  onSendMessage, 
  isLoading,
  disabled = false,
  compact = false,
  placeholder
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  return (
    <div className={`flex flex-col h-full ${compact ? '' : 'max-w-3xl mx-auto'}`}>
      <ScrollArea 
        ref={scrollRef}
        className="flex-1 px-4 py-6"
        data-testid="chat-scroll-area"
      >
        <div className="space-y-6">
          {messages.length === 0 && !compact && (
            <div className="text-center py-16">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Content Assembly Line
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                Ready to assemble content? Tell me your topic.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <StatusBadge text="SYSTEM READY" variant="success" />
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest">
                Processing...
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Select a hook to continue..." : (placeholder || "Type your message...")}
            disabled={isLoading || disabled}
            className={`resize-none pr-12 ${compact ? 'min-h-[80px]' : 'min-h-[120px]'} rounded-2xl`}
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || disabled}
            className="absolute bottom-3 right-3"
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-lg p-4 rounded-xl
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
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ text, variant = 'default' }: { text: string; variant?: 'default' | 'success' | 'warning' }) {
  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-primary/10 text-primary border border-primary/20',
    warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
  };
  
  return (
    <span 
      className={`px-3 py-1 text-xs font-mono uppercase tracking-widest rounded-full ${variantClasses[variant]}`}
      data-testid={`status-badge-${text.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {text}
    </span>
  );
}
