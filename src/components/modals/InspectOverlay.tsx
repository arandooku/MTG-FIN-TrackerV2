import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card as CardT } from '@/lib/schemas';
import { classifyFoil, foilSlotClass } from '@/lib/foil';
import { MTG_CARD_BACK, clamp, scryfallLarge } from '@/lib/utils';

interface InspectOverlayProps {
  card: CardT | null;
  foilActive?: boolean;
  onClose: () => void;
}

export function InspectOverlay({ card, foilActive, onClose }: InspectOverlayProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const foilRef = useRef<HTMLDivElement | null>(null);
  const shineRef = useRef<HTMLDivElement | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const rotRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });

  const apply = useCallback(() => {
    const el = cardRef.current;
    const shine = shineRef.current;
    const foil = foilRef.current;
    if (!el) return;
    const { x, y } = rotRef.current;
    el.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${(50 + y * 0.5).toFixed(
        1,
      )}% ${(50 - x * 0.5).toFixed(1)}%, rgba(255,255,255,0.22) 0%, transparent 60%)`;
    }
    if (foil && foilActive) {
      foil.style.setProperty('--foil-mx', (50 + y * 0.6).toFixed(1) + '%');
      foil.style.setProperty('--foil-my', (50 - x * 0.6).toFixed(1) + '%');
      foil.style.setProperty('--foil-bx', (50 + y * 0.8).toFixed(1) + '%');
      foil.style.setProperty('--foil-by', (50 - x * 0.8).toFixed(1) + '%');
    }
  }, [foilActive]);

  useEffect(() => {
    if (!card) return;
    rotRef.current = { x: 0, y: 0 };
    setFlipped(false);
    setHintVisible(true);
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'none';
      el.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
    const t = window.setTimeout(() => setHintVisible(false), 3500);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, [card?.collector_number]);

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, onClose]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      rotRef.current.y += dx * 0.5;
      rotRef.current.x = clamp(rotRef.current.x - dy * 0.5, -60, 60);
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
      apply();
    };
    const onUp = () => {
      dragRef.current.active = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [apply]);

  if (!card) return null;

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current.active = true;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    setHintVisible(false);
    const el = cardRef.current;
    if (el) el.style.transition = 'none';
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    dragRef.current.active = true;
    dragRef.current.x = e.touches[0].clientX;
    dragRef.current.y = e.touches[0].clientY;
    setHintVisible(false);
    const el = cardRef.current;
    if (el) el.style.transition = 'none';
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.active || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - dragRef.current.x;
    const dy = e.touches[0].clientY - dragRef.current.y;
    rotRef.current.y += dx * 0.5;
    rotRef.current.x = clamp(rotRef.current.x - dy * 0.5, -60, 60);
    dragRef.current.x = e.touches[0].clientX;
    dragRef.current.y = e.touches[0].clientY;
    apply();
  };
  const onTouchEnd = () => {
    dragRef.current.active = false;
  };

  const handleReset = () => {
    rotRef.current = { x: 0, y: 0 };
    setFlipped(false);
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'transform 0.5s ease';
      el.style.transform = 'rotateX(0deg) rotateY(0deg)';
      window.setTimeout(() => {
        if (el) el.style.transition = 'none';
      }, 500);
    }
  };
  const handleFlip = () => {
    const next = !flipped;
    setFlipped(next);
    rotRef.current.y = next ? 180 : 0;
    rotRef.current.x = 0;
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'transform 0.6s ease';
      el.style.transform = `rotateX(0deg) rotateY(${next ? 180 : 0}deg)`;
      window.setTimeout(() => {
        if (el) el.style.transition = 'none';
      }, 600);
    }
  };

  const src = scryfallLarge(card.image_normal || card.image_small);
  const back = card.image_back_normal ? scryfallLarge(card.image_back_normal) : MTG_CARD_BACK;
  const foilCls = foilActive ? `foil-owned ${foilSlotClass(card)}` : '';
  const variant = classifyFoil(card);

  return (
    <div
      className="inspect-overlay visible"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={wrapRef}
        className="inspect-card-wrap"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {hintVisible && (
          <div className="inspect-hint">
            <span className="inspect-hint-text">Drag to rotate · ESC to close</span>
          </div>
        )}
        <div ref={cardRef} className={`inspect-3d ${foilCls}`} data-variant={variant}>
          <img src={src} alt={card.name} draggable={false} />
          <div ref={shineRef} className="inspect-shine" />
          <div ref={foilRef} className="inspect-foil-overlay" />
          <div className="inspect-card-back">
            <img src={back} alt="back" draggable={false} />
          </div>
        </div>
      </div>
      <div className="inspect-controls">
        <button type="button" className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleFlip}>
          Flip
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
