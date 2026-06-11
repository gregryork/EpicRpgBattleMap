import React, { useState, useEffect, useRef } from 'react';

const SpellTemplate = ({
  id,
  shape,
  element,
  sizeFeet,
  label,
  wUnits,
  hUnits,
  x,
  y,
  rotation,
  scale,
  isSpacePressed,
  onDragEnd,
  onRotate,
  onDelete,
}) => {
  const [pos, setPos] = useState({ x, y });
  const [flipTooltip, setFlipTooltip] = useState(false);
  const dragPosRef = useRef({ x, y });
  const elementRef = useRef(null);

  // Sync with changes from parent state (e.g. storage reload)
  useEffect(() => {
    setPos({ x, y });
    dragPosRef.current = { x, y };
  }, [x, y]);

  // Handle Shift + Scroll Wheel rotation
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const handleWheelEvent = (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 15 : -15;
        const nextRotation = (rotation + delta + 360) % 360;
        onRotate(id, nextRotation);
      }
    };

    el.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheelEvent);
    };
  }, [id, rotation, onRotate]);

  // Handle 'R' key rotation on hover
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    let isMouseOver = false;
    const handleMouseEnter = () => { isMouseOver = true; };
    const handleMouseLeave = () => { isMouseOver = false; };

    const handleKeyDown = (e) => {
      if (isMouseOver && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        const nextRotation = (rotation + 15) % 360;
        onRotate(id, nextRotation);
      }
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [id, rotation, onRotate]);

  const handlePointerDown = (e) => {
    if (isSpacePressed) return;
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = dragPosRef.current.x;
    const initialY = dragPosRef.current.y;

    const handlePointerMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      const nextX = Math.max(0, initialX + dx);
      const nextY = Math.max(0, initialY + dy);

      dragPosRef.current = { x: nextX, y: nextY };
      setPos({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      onDragEnd(id, dragPosRef.current.x, dragPosRef.current.y);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Remove effect template "${label}"?`)) {
      onDelete(id);
    }
  };

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // If the top of the template is less than 150px from the top of the screen, flip it below
    if (rect.top < 150) {
      setFlipTooltip(true);
    } else {
      setFlipTooltip(false);
    }
  };

  // Safe fallbacks to prevent NaN scaling values
  const safeScale = typeof scale === 'number' && scale > 0 ? scale : 1;
  const safeRotation = typeof rotation === 'number' ? rotation : 0;

  return (
    <div
      ref={elementRef}
      className={`spell-template ${shape} ${element}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `rotate(${safeRotation}deg)`,
        '--w-units': wUnits,
        '--h-units': hUnits,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
    >
      <span
        className={`tooltip ${flipTooltip ? 'tooltip-bottom' : ''}`}
        style={{
          '--tooltip-scale': String(1 / safeScale),
          '--tooltip-rotation': `${-safeRotation}deg`,
        }}
      >
        <strong>{label}</strong>
        <br />
        {sizeFeet}ft {shape}
        <br />
        Double click to remove
      </span>
    </div>
  );
};

export default SpellTemplate;
