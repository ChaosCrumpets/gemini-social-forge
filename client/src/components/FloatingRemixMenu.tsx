import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Scissors, Smile, RefreshCw, MessageSquare, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface FloatingRemixMenuProps {
  containerRef: React.RefObject<HTMLElement>;
  onRemix: (originalText: string, remixedText: string) => void;
  context?: string;
}

interface SelectionState {
  text: string;
  x: number;
  y: number;
}

export function FloatingRemixMenu({ containerRef, onRemix, context }: FloatingRemixMenuProps) {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');

  const handleMouseUp = useCallback(() => {
    const selectedText = window.getSelection()?.toString().trim();
    
    if (!selectedText || selectedText.length < 3) {
      if (!isLoading) {
        setSelection(null);
        setShowCustomInput(false);
      }
      return;
    }

    const range = window.getSelection()?.getRangeAt(0);
    if (!range) return;

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!containerRect) return;

    // Check if selection is within the container
    if (rect.left < containerRect.left || rect.right > containerRect.right) {
      return;
    }

    setSelection({
      text: selectedText,
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 10
    });
    setShowCustomInput(false);
  }, [containerRef, isLoading]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, handleMouseUp]);

  const handleRemix = async (instruction: string) => {
    if (!selection) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/remix', {
        selectedText: selection.text,
        instruction,
        context
      });

      const data = await response.json();
      
      if (data.remixedText) {
        onRemix(selection.text, data.remixedText);
      }
    } catch (error) {
      console.error('Remix error:', error);
    } finally {
      setIsLoading(false);
      setSelection(null);
      setShowCustomInput(false);
      setCustomInstruction('');
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInstruction.trim()) {
      handleRemix(customInstruction.trim());
    }
  };

  const close = () => {
    setSelection(null);
    setShowCustomInput(false);
    setCustomInstruction('');
    window.getSelection()?.removeAllRanges();
  };

  if (!selection) return null;

  return (
    <div
      className="absolute z-50 flex flex-col items-center gap-2"
      style={{
        left: `${selection.x}px`,
        top: `${selection.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
      data-testid="floating-remix-menu"
    >
      <div className="bg-popover border border-border rounded-lg shadow-lg p-2 flex gap-1 items-center">
        {isLoading ? (
          <div className="flex items-center gap-2 px-3 py-1 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Remixing...</span>
          </div>
        ) : showCustomInput ? (
          <form onSubmit={handleCustomSubmit} className="flex gap-1">
            <Input
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Enter instruction..."
              className="w-48 h-8 text-sm"
              autoFocus
              data-testid="input-custom-remix"
            />
            <Button type="submit" size="sm" disabled={!customInstruction.trim()} data-testid="button-submit-remix">
              Go
            </Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => setShowCustomInput(false)}>
              <X className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRemix('Shorten this text')}
              className="text-xs gap-1"
              data-testid="button-remix-shorten"
            >
              <Scissors className="w-3 h-3" />
              Shorten
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRemix('Make this funnier')}
              className="text-xs gap-1"
              data-testid="button-remix-funnier"
            >
              <Smile className="w-3 h-3" />
              Funnier
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRemix('Rewrite this completely')}
              className="text-xs gap-1"
              data-testid="button-remix-rewrite"
            >
              <RefreshCw className="w-3 h-3" />
              Rewrite
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCustomInput(true)}
              className="text-xs gap-1"
              data-testid="button-remix-custom"
            >
              <MessageSquare className="w-3 h-3" />
              Custom
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={close}
              className="ml-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      <div className="w-2 h-2 bg-popover border-l border-b border-border rotate-[-45deg] -mt-3" />
    </div>
  );
}
