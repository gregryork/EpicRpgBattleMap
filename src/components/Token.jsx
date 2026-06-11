import React, { useState, useEffect, useRef } from 'react';

const Token = ({
  id,
  name,
  desc,
  faction,
  size,
  x,
  y,
  scale,
  isSpacePressed,
  onDragEnd,
  onDelete,
}) => {
  const [pos, setPos] = useState({ x, y });
  const [hovered, setHovered] = useState(false);
  const dragPosRef = useRef({ x, y });

  // Synchronize local position if parent state changes (e.g. on load)
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
    if (window.confirm(`Remove "${name}"?`)) {
      onDelete(id);
    }
  };

  const getSizeText = (val) => {
    switch (String(val)) {
      case '1': return 'Medium';
      case '2': return 'Large';
      case '3': return 'Huge';
      case '4': return 'Gargantuan';
      default: return 'Medium';
    }
  };

  return (
    <div
      className={`token ${faction}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        '--size-multiplier': size,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {name.toUpperCase()}
      <span
        className="tooltip"
        style={{
          transform: `scale(${1 / scale}) ${hovered ? 'translateY(-6px)' : 'translateY(0)'}`,
        }}
      >
        <strong>{name}</strong>
        <br />
        ({getSizeText(size)})
        <br />
        {desc}
      </span>
    </div>
  );
};

export default Token;
