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
  const [hovered, setHovered] = useState(false);
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
    if (!hovered) return;

    const handleKeyDown = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        const nextRotation = (rotation + 15) % 360;
        onRotate(id, nextRotation);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hovered, id, rotation, onRotate]);

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

  return (
    <div
      ref={elementRef}
      className={`spell-template ${shape} ${element}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `rotate(${rotation}deg)`,
        '--w-units': wUnits,
        '--h-units': hUnits,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="tooltip"
        style={{
          transform: `scale(${1 / scale}) rotate(${-rotation}deg) ${hovered ? 'translateY(-6px)' : 'translateY(0)'}`,
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
