import React, { useState, useEffect, useRef } from 'react';
import { X, GripHorizontal, RotateCcw, Move } from 'lucide-react';

interface MovableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // default 'max-w-xl'
  headerColorClass?: string; // default 'bg-slate-900 text-white'
}

export const MovableModal: React.FC<MovableModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'max-w-xl',
  headerColorClass = 'bg-slate-900 text-white',
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Modern Pointer Events for ultra-responsive drag across mouse & touch
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag from header background, not buttons or inputs
    if ((e.target as HTMLElement).closest('button, input, a, select, textarea')) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPosition({
      x: dragStartRef.current.initialX + dx,
      y: dragStartRef.current.initialY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if already released
      }
      setIsDragging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDragging) {
          onClose();
        }
      }}
    >
      <div
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          touchAction: 'none',
        }}
        className={`bg-white rounded-2xl shadow-2xl ${maxWidth} w-full overflow-hidden border border-slate-200/90 flex flex-col max-h-[90vh] my-auto transition-[box-shadow] ${
          isDragging ? 'shadow-indigo-500/20 ring-2 ring-indigo-500/30' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Draggable Header Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={() => setPosition({ x: 0, y: 0 })}
          className={`${headerColorClass} px-5 py-3.5 flex items-center justify-between shrink-0 select-none cursor-grab active:cursor-grabbing border-b border-slate-700/50 touch-none`}
          title="คลิกลากแถบนี้เพื่อขยับฟอร์มไปตำแหน่งใดก็ได้ / ดับเบิ้ลคลิกเพื่อรีเซ็ตกึ่งกลาง"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-white/10 hover:bg-white/20 text-indigo-300 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 transition">
              <Move className="w-4 h-4" />
            </div>
            {icon && <div className="shrink-0">{icon}</div>}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{title}</h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-white/15 text-slate-200 px-2 py-0.5 rounded-full font-medium shrink-0">
                  <GripHorizontal className="w-3 h-3 text-indigo-300" />
                  ลากขยับได้
                </span>
              </div>
              {subtitle && (
                <p className="text-[11px] text-slate-300 leading-tight truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            {(position.x !== 0 || position.y !== 0) && (
              <button
                type="button"
                onClick={() => setPosition({ x: 0, y: 0 })}
                className="px-2.5 py-1 text-[11px] font-bold bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="จัดตำแหน่งกลับมากึ่งกลาง"
              >
                <RotateCcw className="w-3 h-3" />
                <span>รีเซ็ตกึ่งกลาง</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};
