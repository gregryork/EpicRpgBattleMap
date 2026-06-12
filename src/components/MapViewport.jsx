import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_MAPS } from '../utils/constants';

const MapViewport = ({
  mapImage,
  scale,
  panX,
  panY,
  gridUnit,
  isSpacePressed,
  onMapDropped,
  onLoadUrl,
  onPanChange,
  onZoomChange,
  onSaveState,
  children,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [urlInput, setUrlInput] = useState('');

  // Refs to hold high-frequency updates without causing React re-renders during dragging
  const currentPanRef = useRef({ x: panX, y: panY });
  const currentScaleRef = useRef(scale);

  // Sync ref values with incoming props
  useEffect(() => {
    currentPanRef.current = { x: panX, y: panY };
  }, [panX, panY]);

  useEffect(() => {
    currentScaleRef.current = scale;
  }, [scale]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onMapDropped(file);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onLoadUrl(urlInput.trim());
      setUrlInput('');
    }
  };

  // Handle passive-false wheel listener for zoom preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (!mapImage) return;
      e.preventDefault();

      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      let nextScale = scale * factor;
      if (nextScale < 0.08) nextScale = 0.08;
      if (nextScale > 6) nextScale = 6;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const nextPanX = mouseX - (mouseX - panX) * (nextScale / scale);
      const nextPanY = mouseY - (mouseY - panY) * (nextScale / scale);

      onZoomChange(nextScale, nextPanX, nextPanY);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [mapImage, scale, panX, panY, onZoomChange]);

  // Touch Gesture Listeners (Single-finger pan & Two-finger pinch-to-zoom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isTouchPanning = false;
    let initialTouches = [];
    let startDist = 0;
    let startScale = 1;

    const getDistance = (t1, t2) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (t1, t2) => {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    };

    const handleTouchStart = (e) => {
      // Ignore if touching a token/spell/status picker/placeholder (let their listeners handle it)
      if (
        e.target.closest('.token') ||
        e.target.closest('.spell-template') ||
        e.target.closest('.status-picker-menu') ||
        e.target.closest('.map-placeholder')
      ) {
        return;
      }

      if (e.touches.length === 1) {
        isTouchPanning = true;
        initialTouches = [
          {
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY,
            panX,
            panY,
          },
        ];
      } else if (e.touches.length === 2) {
        isTouchPanning = true;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        startDist = getDistance(t1, t2);
        startScale = scale;

        const center = getCenter(t1, t2);
        initialTouches = [
          { clientX: t1.clientX, clientY: t1.clientY },
          { clientX: t2.clientX, clientY: t2.clientY },
          { panX, panY, center },
        ];
      }
    };

    const handleTouchMove = (e) => {
      if (!isTouchPanning) return;
      e.preventDefault(); // Prevent iPad viewport bounce/scroll

      if (e.touches.length === 1 && initialTouches.length === 1) {
        const dx = e.touches[0].clientX - initialTouches[0].clientX;
        const dy = e.touches[0].clientY - initialTouches[0].clientY;
        const nextPanX = initialTouches[0].panX + dx;
        const nextPanY = initialTouches[0].panY + dy;

        // Perform direct DOM manipulation for smooth 60fps/120fps panning
        if (canvasRef.current) {
          canvasRef.current.style.transform = `translate(${nextPanX}px, ${nextPanY}px) scale(${currentScaleRef.current})`;
        }
        currentPanRef.current = { x: nextPanX, y: nextPanY };
      } else if (e.touches.length === 2 && initialTouches.length === 3) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = getDistance(t1, t2);

        const factor = currentDist / startDist;
        let nextScale = startScale * factor;
        if (nextScale < 0.08) nextScale = 0.08;
        if (nextScale > 6) nextScale = 6;

        const currentCenter = getCenter(t1, t2);
        const startCenter = initialTouches[2].center;
        const dx = currentCenter.x - startCenter.x;
        const dy = currentCenter.y - startCenter.y;

        const containerRect = container.getBoundingClientRect();
        const pivotX = startCenter.x - containerRect.left;
        const pivotY = startCenter.y - containerRect.top;

        const nextPanX =
          pivotX -
          (pivotX - initialTouches[2].panX) * (nextScale / startScale) +
          dx;
        const nextPanY =
          pivotY -
          (pivotY - initialTouches[2].panY) * (nextScale / startScale) +
          dy;

        // Perform direct DOM manipulation for smooth 60fps/120fps pinch-zooming
        if (canvasRef.current) {
          canvasRef.current.style.transform = `translate(${nextPanX}px, ${nextPanY}px) scale(${nextScale})`;
        }
        currentPanRef.current = { x: nextPanX, y: nextPanY };
        currentScaleRef.current = nextScale;
      }
    };

    const handleTouchEnd = () => {
      if (isTouchPanning) {
        isTouchPanning = false;
        // Update parent React state ONCE when the user releases their fingers
        onPanChange(currentPanRef.current.x, currentPanRef.current.y);
        onZoomChange(currentScaleRef.current, currentPanRef.current.x, currentPanRef.current.y);
        onSaveState();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [mapImage, scale, panX, panY, onPanChange, onZoomChange, onSaveState]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      onMapDropped(file);
    }
  };

  const handleMouseDown = (e) => {
    const isMiddleClick = e.button === 1;
    if (!isSpacePressed && !isMiddleClick) return;
    
    e.preventDefault();
    setIsPanning(true);

    const startX = e.clientX - currentPanRef.current.x;
    const startY = e.clientY - currentPanRef.current.y;

    const handleMouseMove = (moveEvent) => {
      const nextPanX = moveEvent.clientX - startX;
      const nextPanY = moveEvent.clientY - startY;

      // Perform direct DOM manipulation for smooth 60fps/120fps panning
      if (canvasRef.current) {
        canvasRef.current.style.transform = `translate(${nextPanX}px, ${nextPanY}px) scale(${currentScaleRef.current})`;
      }
      currentPanRef.current = { x: nextPanX, y: nextPanY };
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Update parent React state ONCE when the user releases their mouse click
      onPanChange(currentPanRef.current.x, currentPanRef.current.y);
      onSaveState();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const isPanningClass = isSpacePressed ? 'panning-mode' : '';
  const isDraggingClass = isPanning ? 'panning-active' : '';

  return (
    <div
      ref={containerRef}
      className={`map-container ${dragOver ? 'drag-over' : ''} ${isPanningClass} ${isDraggingClass}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
    >
      {!mapImage && (
        <div className="map-placeholder">
          <strong>DRAG & DROP YOUR MAP HERE</strong>
          <br />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Drop your floorplan PNG/JPEG file anywhere into this area.
          </span>
          <div style={{ margin: '15px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>— OR —</span>
            <button
              type="button"
              onClick={handleBrowseClick}
              style={{
                width: 'auto',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              📁 Browse Files...
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '300px', marginTop: '5px' }} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
              <input
                type="text"
                placeholder="Paste image URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                style={{ flexGrow: 1, padding: '8px 10px', fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                disabled={!urlInput.trim()}
                style={{
                  width: 'auto',
                  padding: '8px 14px',
                  background: urlInput.trim() ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                  color: urlInput.trim() ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  opacity: urlInput.trim() ? 1 : 0.6,
                }}
              >
                Load
              </button>
            </form>
          </div>

          <div style={{ margin: '5px 0 15px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.5px', fontWeight: '600' }}>— OR CHOOSE A DEFAULT MAP —</span>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '4px'
            }}>
              {DEFAULT_MAPS.map((map) => (
                <button
                  key={map.id}
                  type="button"
                  onClick={() => onMapDropped(map.path)}
                  className="default-map-thumbnail-btn"
                  title={map.name}
                >
                  <img
                    src={map.path}
                    alt={map.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'rgba(0,0,0,0.8)',
                    color: '#fff',
                    fontSize: '0.6rem',
                    textAlign: 'center',
                    padding: '2px 0',
                    fontWeight: '600',
                  }}>
                    {map.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            💡 Pro-Tip: Paste an image or URL directly (Ctrl+V) anywhere on the page!
          </span>
        </div>
      )}

      {mapImage && (
        <div
          ref={canvasRef}
          id="battlemap-canvas"
          className="battlemap-canvas"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            display: 'block',
            '--grid-unit': `${gridUnit}px`,
          }}
        >
          <img
            id="map-img"
            className="map-img"
            src={mapImage}
            alt="Battlemap"
          />
          {children}
        </div>
      )}
    </div>
  );
};

export default MapViewport;
