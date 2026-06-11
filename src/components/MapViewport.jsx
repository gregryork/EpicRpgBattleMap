import React, { useState, useEffect, useRef } from 'react';

const MapViewport = ({
  mapImage,
  scale,
  panX,
  panY,
  gridUnit,
  isSpacePressed,
  onMapDropped,
  onPanChange,
  onZoomChange,
  onSaveState,
  children,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef(null);

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
    if (!isSpacePressed) return;
    e.preventDefault();
    setIsPanning(true);

    const startX = e.clientX - panX;
    const startY = e.clientY - panY;

    const handleMouseMove = (moveEvent) => {
      const nextPanX = moveEvent.clientX - startX;
      const nextPanY = moveEvent.clientY - startY;
      onPanChange(nextPanX, nextPanY);
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onSaveState();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const isPanningClass = isSpacePressed ? 'panning-mode' : '';

  return (
    <div
      ref={containerRef}
      className={`map-container ${dragOver ? 'drag-over' : ''} ${isPanningClass}`}
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
        </div>
      )}

      {mapImage && (
        <div
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
