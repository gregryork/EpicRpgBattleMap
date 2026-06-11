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
  const [flipTooltip, setFlipTooltip] = useState(false);
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

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // If the top of the token is less than 150px from the top of the screen, flip it below
    if (rect.top < 150) {
      setFlipTooltip(true);
    } else {
      setFlipTooltip(false);
    }
  };

  const getSizeText = (val) => {
    switch (String(val)) {
      case '1': return 'Medium';
      case '2': return 'Large';
      case '3': return 'Huge';
      case '4': return 'Gargantuan';
      case '6': return 'Colossal';
      case '8': return 'Titanic';
      case '12': return 'Behemoth';
      default: return 'Medium';
    }
  };

  // Safe fallback to prevent NaN scaling values
  const safeScale = typeof scale === 'number' && scale > 0 ? scale : 1;

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
      onMouseEnter={handleMouseEnter}
    >
      {name.toUpperCase()}
      <span
        className={`tooltip ${flipTooltip ? 'tooltip-bottom' : ''}`}
        style={{
          '--tooltip-scale': String(1 / safeScale),
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
