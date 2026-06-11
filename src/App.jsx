import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapViewport from './components/MapViewport';
import Token from './components/Token';
import SpellTemplate from './components/SpellTemplate';

// Helper to load initial state from localStorage
const getInitialBoardState = () => {
  const raw = localStorage.getItem('dnd_battlemap_state');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        scale: parsed.scale ?? 1,
        panX: parsed.panX ?? 10,
        panY: parsed.panY ?? 10,
        gridUnit: parsed.gridUnit ? parseInt(parsed.gridUnit, 10) : 40,
        tokens: parsed.tokens ?? [],
        spells: parsed.spells ?? [],
      };
    } catch (e) {
      console.error('Failed to parse saved board state:', e);
    }
  }
  return {
    scale: 1,
    panX: 10,
    panY: 10,
    gridUnit: 40,
    tokens: [],
    spells: [],
  };
};

function App() {
  const initialState = getInitialBoardState();

  // Core board states
  const [scale, setScale] = useState(initialState.scale);
  const [panX, setPanX] = useState(initialState.panX);
  const [panY, setPanY] = useState(initialState.panY);
  const [gridUnit, setGridUnit] = useState(initialState.gridUnit);
  const [tokens, setTokens] = useState(initialState.tokens);
  const [spells, setSpells] = useState(initialState.spells);
  const [mapImage, setMapImage] = useState('');

  // UI state
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Sync state to localStorage whenever changes occur
  useEffect(() => {
    const state = {
      scale,
      panX,
      panY,
      gridUnit,
      tokens,
      spells,
    };
    localStorage.setItem('dnd_battlemap_state', JSON.stringify(state));
  }, [scale, panX, panY, gridUnit, tokens, spells]);

  // Clean up Object URL on unmount or map change
  useEffect(() => {
    return () => {
      if (mapImage && mapImage.startsWith('blob:')) {
        URL.revokeObjectURL(mapImage);
      }
    };
  }, [mapImage]);

  // Track global spacebar status for panning
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.code === 'Space' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        setIsSpacePressed(true);
        document.body.classList.add('panning-mode');
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        document.body.classList.remove('panning-mode');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.classList.remove('panning-mode');
    };
  }, []);

  // Map dropped file loading
  const handleMapDropped = (file) => {
    if (mapImage && mapImage.startsWith('blob:')) {
      URL.revokeObjectURL(mapImage);
    }
    const objectUrl = URL.createObjectURL(file);
    setMapImage(objectUrl);
  };

  // Zoom Button Handlers
  const handleZoomIn = () => {
    if (!mapImage) return;
    setScale((prev) => Math.min(6, prev * 1.2));
  };

  const handleZoomOut = () => {
    if (!mapImage) return;
    setScale((prev) => Math.max(0.08, prev * 0.8));
  };

  const handleZoomReset = () => {
    if (!mapImage) return;
    setScale(1);
    setPanX(10);
    setPanY(10);
  };

  // Spawning Helpers
  const handleAddToken = ({ name, size, desc, faction }) => {
    const newToken = {
      id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      desc,
      faction,
      size,
      x: 50,
      y: 50,
    };
    setTokens((prev) => [...prev, newToken]);
  };

  const handleAddSpell = ({ shape, sizeFeet, element, label }) => {
    const gridUnits = sizeFeet / 5;
    let wUnits = gridUnits;
    let hUnits = gridUnits;

    if (shape === 'circle') {
      wUnits = gridUnits * 2;
      hUnits = gridUnits * 2;
    } else if (shape === 'line') {
      wUnits = gridUnits;
      hUnits = 1;
    }

    const newSpell = {
      id: `spell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label,
      shape,
      element,
      sizeFeet,
      wUnits,
      hUnits,
      x: 100,
      y: 100,
    };
    setSpells((prev) => [...prev, newSpell]);
  };

  // Drag End coordinates update
  const handleTokenDragEnd = (id, newX, newY) => {
    setTokens((prev) =>
      prev.map((t) => (t.id === id ? { ...t, x: newX, y: newY } : t))
    );
  };

  const handleSpellDragEnd = (id, newX, newY) => {
    setSpells((prev) =>
      prev.map((s) => (s.id === id ? { ...s, x: newX, y: newY } : s))
    );
  };

  // Double Click deletion handlers
  const handleTokenDelete = (id) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSpellDelete = (id) => {
    setSpells((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <>
      <Sidebar
        gridUnit={gridUnit}
        setGridUnit={setGridUnit}
        isMapActive={!!mapImage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onAddToken={handleAddToken}
        onAddSpell={handleAddSpell}
      />

      <MapViewport
        mapImage={mapImage}
        scale={scale}
        panX={panX}
        panY={panY}
        isSpacePressed={isSpacePressed}
        onMapDropped={handleMapDropped}
        onPanChange={(x, y) => {
          setPanX(x);
          setPanY(y);
        }}
        onZoomChange={(s, x, y) => {
          setScale(s);
          setPanX(x);
          setPanY(y);
        }}
        onSaveState={() => {
          // Triggers side effect update save
          setScale((s) => s);
        }}
      >
        {tokens.map((token) => (
          <Token
            key={token.id}
            id={token.id}
            name={token.name}
            desc={token.desc}
            faction={token.faction}
            size={token.size}
            x={token.x}
            y={token.y}
            scale={scale}
            isSpacePressed={isSpacePressed}
            onDragEnd={handleTokenDragEnd}
            onDelete={handleTokenDelete}
          />
        ))}

        {spells.map((spell) => (
          <SpellTemplate
            key={spell.id}
            id={spell.id}
            shape={spell.shape}
            element={spell.element}
            sizeFeet={spell.sizeFeet}
            label={spell.label}
            wUnits={spell.wUnits}
            hUnits={spell.hUnits}
            x={spell.x}
            y={spell.y}
            scale={scale}
            isSpacePressed={isSpacePressed}
            onDragEnd={handleSpellDragEnd}
            onDelete={handleSpellDelete}
          />
        ))}
      </MapViewport>
    </>
  );
}

export default App;
