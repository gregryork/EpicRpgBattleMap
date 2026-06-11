import React, { useState, useEffect, useRef } from 'react';

// List of status markers with icons and labels
export const STATUS_MARKERS = [
  { id: 'dead', icon: '💀', label: 'Dead' },
  { id: 'poisoned', icon: '🧪', label: 'Poisoned' },
  { id: 'blinded', icon: '👁️', label: 'Blinded' },
  { id: 'stunned', icon: '😵', label: 'Stunned' },
  { id: 'prone', icon: '🛌', label: 'Prone' },
  { id: 'burning', icon: '🔥', label: 'Burning' },
  { id: 'bleeding', icon: '🩸', label: 'Bleeding' },
  { id: 'blessed', icon: '🛡️', label: 'Blessed' },
  { id: 'concentrating', icon: '🌀', label: 'Concentrating' },
  { id: 'invisible', icon: '👻', label: 'Invisible' },
];

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
  markers = [],
  onDragEnd,
  onToggleMarker,
  onDelete,
}) => {
  const [pos, setPos] = useState({ x, y });
  const [flipTooltip, setFlipTooltip] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dragPosRef = useRef({ x, y });

  // Synchronize local position if parent state changes (e.g. on load)
  useEffect(() => {
    setPos({ x, y });
    dragPosRef.current = { x, y };
  }, [x, y]);

  const handlePointerDown = (e) => {
    if (isSpacePressed) return;
    if (showMenu) setShowMenu(false); // Close menu if we start dragging
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
    onDelete(id);
  };

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.top < 150) {
      setFlipTooltip(true);
    } else {
      setFlipTooltip(false);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(true);
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
  const activeMarkers = STATUS_MARKERS.filter((m) => markers.includes(m.id));

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
      onContextMenu={handleContextMenu}
    >
      {name.toUpperCase()}

      {/* Render active status badges on top-right of the token */}
      {activeMarkers.length > 0 && (
        <div
          className="token-markers"
          style={{
            transform: `scale(${1 / safeScale})`,
            transformOrigin: 'top right',
          }}
        >
          {activeMarkers.map((m) => (
            <span key={m.id} className="token-marker-badge" title={m.label}>
              {m.icon}
            </span>
          ))}
        </div>
      )}

      {/* Hover Information Tooltip */}
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

      {/* Status Picker Context Menu */}
      {showMenu && (
        <>
          <div
            className="status-picker-backdrop"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          <div
            className="status-picker-menu"
            style={{
              '--tooltip-scale': String(1 / safeScale),
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="status-picker-header">Toggle Status</div>
            <div className="status-picker-grid">
              {STATUS_MARKERS.map((m) => {
                const isSelected = markers.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`status-picker-item ${isSelected ? 'active' : ''}`}
                    onClick={() => onToggleMarker(id, m.id)}
                    title={m.label}
                  >
                    <span className="status-picker-icon">{m.icon}</span>
                    <span className="status-picker-label">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Token;
