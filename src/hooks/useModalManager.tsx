// [AiChatBratina v10.0] - Central Modal Management Hook & Close Button Component
// Manages z-index stacking, ESC key listener, and backdrop click-outside dismissal

import React, { useEffect, useId, useMemo } from 'react';
import { X } from 'lucide-react';

interface ModalStackEntry {
  id: string;
  onClose: () => void;
}

// Global singleton stack to track active overlays in correct visual & dismissal order
class ModalStackManager {
  private static instance: ModalStackManager;
  private stack: ModalStackEntry[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
    }
  }

  public static getInstance(): ModalStackManager {
    if (!ModalStackManager.instance) {
      ModalStackManager.instance = new ModalStackManager();
    }
    return ModalStackManager.instance;
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      if (this.stack.length > 0) {
        // Dismiss the topmost active modal
        const topModal = this.stack[this.stack.length - 1];
        if (topModal && typeof topModal.onClose === 'function') {
          event.preventDefault();
          event.stopPropagation();
          topModal.onClose();
        }
      }
    }
  };

  public push(id: string, onClose: () => void): void {
    // Remove if already in stack, then push to top
    this.stack = this.stack.filter((item) => item.id !== id);
    this.stack.push({ id, onClose });
    this.notify();
  }

  public remove(id: string): void {
    const prevLen = this.stack.length;
    this.stack = this.stack.filter((item) => item.id !== id);
    if (this.stack.length !== prevLen) {
      this.notify();
    }
  }

  public getZIndex(id: string, baseZ = 50): number {
    const idx = this.stack.findIndex((item) => item.id === id);
    if (idx === -1) return baseZ;
    return baseZ + (idx + 1) * 10;
  }

  public isTopModal(id: string): boolean {
    if (this.stack.length === 0) return false;
    return this.stack[this.stack.length - 1].id === id;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }
}

export const modalStackManager = ModalStackManager.getInstance();

export interface UseModalOptions {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
  baseZIndex?: number;
}

export interface UseModalReturn {
  zIndex: number;
  isTop: boolean;
  backdropProps: {
    onClick: (e: React.MouseEvent) => void;
    'aria-hidden': boolean;
  };
  containerProps: {
    onClick: (e: React.MouseEvent) => void;
  };
  handleBackdropClick: (e: React.MouseEvent) => void;
}

/**
 * Hook to manage modal z-index stacking, outside click, and ESC dismissal.
 */
export function useModalManager({
  isOpen,
  onClose,
  modalId: customId,
  baseZIndex = 50,
}: UseModalOptions): UseModalReturn {
  const autoId = useId();
  const id = customId || autoId;
  const [, setTick] = React.useState(0);

  useEffect(() => {
    const unsub = modalStackManager.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      modalStackManager.push(id, onClose);
    } else {
      modalStackManager.remove(id);
    }

    return () => {
      modalStackManager.remove(id);
    };
  }, [isOpen, id, onClose]);

  const zIndex = useMemo(() => {
    return modalStackManager.getZIndex(id, baseZIndex);
  }, [id, baseZIndex]);

  const isTop = useMemo(() => {
    return modalStackManager.isTopModal(id);
  }, [id]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicked directly on the backdrop, not bubbling from children
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      onClose();
    }
  };

  const backdropProps = {
    onClick: handleBackdropClick,
    'aria-hidden': !isOpen,
  };

  const containerProps = {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
    },
  };

  return {
    zIndex,
    isTop,
    backdropProps,
    containerProps,
    handleBackdropClick,
  };
}

/**
 * Standard Prominent 'X' Close Button for modal corners with ESC shortcut hint.
 */
export interface ModalCloseButtonProps {
  onClose: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

export const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({
  onClose,
  className = '',
  size = 'md',
  title = 'Zatvori prozor (ESC)',
}) => {
  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      title={title}
      aria-label={title}
      className={`group relative flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-rose-600/90 hover:border-rose-400 transition-all duration-200 shadow-lg hover:shadow-rose-500/25 active:scale-95 cursor-pointer z-50 ${sizeClasses} ${className}`}
    >
      <X className={`${iconSizes} transition-transform group-hover:rotate-90 duration-200`} />
      <span className="hidden sm:inline-block text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800/90 group-hover:bg-rose-700 text-slate-400 group-hover:text-white transition-colors">
        ESC
      </span>
    </button>
  );
};
