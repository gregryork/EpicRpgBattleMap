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
  scale,
  isSpacePressed,
  onDragEnd,
  onDelete,
}) => {
  const [pos, setPos] = useState({ x, y });
  const dragPosRef = useRef({ x, y });

  // Sync with changes from parent state (e.g. storage reload)
  useEffect(() => {
    setPos({ x, y });
    dragPosRef.current = { x, y };
  }, [x, y]);

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
      className={`spell-template ${shape} ${element}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        '--w-units': wUnits,
        '--h-units': hUnits,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
    >
      <span className="tooltip">
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
