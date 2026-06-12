import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapViewport from './components/MapViewport';
import Token from './components/Token';
import SpellTemplate from './components/SpellTemplate';
import { saveMapToDB, getMapFromDB, clearMapFromDB } from './utils/db';

// Helper to load initial state from localStorage with legacy migration
const getInitialBoardState = () => {
  const raw = localStorage.getItem('dnd_battlemaps_state');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.maps && parsed.maps.length > 0) {
        return {
          maps: parsed.maps,
          activeMapId: parsed.activeMapId || parsed.maps[0].id,
        };
      }
    } catch (e) {
      console.error('Failed to parse saved board state:', e);
    }
  }

  // Legacy Migration Check
  const legacyRaw = localStorage.getItem('dnd_battlemap_state');
  if (legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw);
      const defaultMap = {
        id: 'map-default',
        name: 'Default Battlemap',
        gridUnit: legacy.gridUnit ? parseInt(legacy.gridUnit, 10) : 60,
        scale: legacy.scale ?? 1,
        panX: legacy.panX ?? 10,
        panY: legacy.panY ?? 10,
        tokens: legacy.tokens ?? [],
        spells: legacy.spells ?? [],
      };
      return {
        maps: [defaultMap],
        activeMapId: 'map-default',
      };
    } catch (e) {
      console.error('Failed to migrate legacy single map state:', e);
    }
  }

  // Default configuration
  return {
    maps: [
      {
        id: 'map-default',
        name: 'Default Battlemap',
        gridUnit: 60,
        scale: 1,
        panX: 10,
        panY: 10,
        tokens: [],
        spells: [],
      },
    ],
    activeMapId: 'map-default',
  };
};

function App() {
  const initialState = getInitialBoardState();

  // Core multi-map states
  const [maps, setMaps] = useState(initialState.maps);
  const [activeMapId, setActiveMapId] = useState(initialState.activeMapId);
  const [mapImage, setMapImage] = useState('');
  const [shouldFitActiveMap, setShouldFitActiveMap] = useState(false);

  // UI state
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('isSidebarOpen');
    return saved !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('isSidebarOpen', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Active Map helper getter
  const activeMap =
    maps.find((m) => m.id === activeMapId) ||
    maps[0] ||
    {
      id: 'map-default',
      name: 'Default Battlemap',
      gridUnit: 60,
      scale: 1,
      panX: 10,
      panY: 10,
      tokens: [],
      spells: [],
    };

  // Helper to update properties of the active map in state
  const updateActiveMap = (updater) => {
    setMaps((prev) =>
      prev.map((m) => (m.id === activeMapId ? { ...m, ...updater(m) } : m))
    );
  };

  // Load map image from IndexedDB whenever activeMapId changes
  useEffect(() => {
    let isCurrent = true;
    const loadActiveMapImage = async () => {
      try {
        const file = await getMapFromDB(activeMapId);
        if (!isCurrent) return;

        if (mapImage && mapImage.startsWith('blob:')) {
          URL.revokeObjectURL(mapImage);
        }

        if (file) {
          if (typeof file === 'string') {
            let processed = file;
            if (file.startsWith('/maps/')) {
              const base = import.meta.env.BASE_URL || '/';
              processed = base + file.substring(1);
            }
            setMapImage(processed);
          } else {
            const objectUrl = URL.createObjectURL(file);
            setMapImage(objectUrl);
          }
        } else {
          setMapImage('');
        }
      } catch (err) {
        console.error('Failed to restore active map from IndexedDB:', err);
        if (isCurrent) setMapImage('');
      }
    };

    loadActiveMapImage();
    return () => {
      isCurrent = false;
    };
  }, [activeMapId]);

  // Sync state to localStorage whenever maps or activeMapId changes
  useEffect(() => {
    const state = {
      maps,
      activeMapId,
    };
    localStorage.setItem('dnd_battlemaps_state', JSON.stringify(state));
  }, [maps, activeMapId]);

  // Clean up Object URL on unmount
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

  // Handle global paste event (Ctrl+V or tap-and-paste) for images & URLs
  useEffect(() => {
    const handlePaste = async (e) => {
      // Ignore paste events in text inputs or textareas so typing works normally
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const file = items[i].getAsFile();
            if (file) {
              handleMapDropped(file);
              return;
            }
          }
        }
      }

      const text = e.clipboardData?.getData('text');
      if (text) {
        const trimmed = text.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          e.preventDefault();
          handleMapUrlSubmit(trimmed);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [activeMapId, mapImage]);

  // Map file upload / dropped handler
  const handleMapDropped = async (file) => {
    if (mapImage && mapImage.startsWith('blob:')) {
      URL.revokeObjectURL(mapImage);
    }
    
    setShouldFitActiveMap(true);
    
    if (typeof file === 'string') {
      setMapImage(file);
    } else {
      const objectUrl = URL.createObjectURL(file);
      setMapImage(objectUrl);
    }

    try {
      await saveMapToDB(activeMapId, file);
    } catch (err) {
      console.error('Failed to save map image to database:', err);
    }
  };

  // Map URL load handler with CORS safety
  const handleMapUrlSubmit = async (url) => {
    if (!url) return;
    try {
      // Try to fetch it to save as Blob (offline storage support)
      const res = await fetch(url);
      const blob = await res.blob();
      
      // Verify it's an image
      if (blob.type.startsWith('image/')) {
        await handleMapDropped(blob);
      } else {
        // Fallback to storing string URL directly if fetch succeeded but type is weird
        await handleMapDropped(url);
      }
    } catch (e) {
      console.warn('CORS or network error fetching image, storing URL string fallback:', e);
      // Fallback: save URL string directly in DB and load it
      await handleMapDropped(url);
    }
  };

  // Zoom Button Handlers
  const handleZoomIn = () => {
    if (!mapImage) return;
    updateActiveMap((m) => ({ scale: Math.min(6, m.scale * 1.2) }));
  };

  const handleZoomOut = () => {
    if (!mapImage) return;
    updateActiveMap((m) => ({ scale: Math.max(0.08, m.scale * 0.8) }));
  };

  const handleZoomReset = () => {
    if (!mapImage) return;
    updateActiveMap(() => ({ scale: 1, panX: 10, panY: 10 }));
  };

  // Creature Spawning Helper
  const handleAddToken = ({ name, size, desc, faction }) => {
    const newToken = {
      id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      desc,
      faction,
      size,
      x: 50,
      y: 50,
      markers: [],
    };
    updateActiveMap((m) => ({ tokens: [...m.tokens, newToken] }));
  };

  const handleToggleTokenMarker = (id, markerId) => {
    updateActiveMap((m) => ({
      tokens: m.tokens.map((t) => {
        if (t.id !== id) return t;
        const currentMarkers = t.markers ?? [];
        const isSelected = currentMarkers.includes(markerId);
        const nextMarkers = isSelected
          ? currentMarkers.filter((mId) => mId !== markerId)
          : [...currentMarkers, markerId];
        return { ...t, markers: nextMarkers };
      }),
    }));
  };

  // Spell Template Spawning Helper
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
      rotation: 0,
    };
    updateActiveMap((m) => ({ spells: [...m.spells, newSpell] }));
  };

  const handleSpellRotate = (id, newRotation) => {
    updateActiveMap((m) => ({
      spells: m.spells.map((s) => (s.id === id ? { ...s, rotation: newRotation } : s)),
    }));
  };

  // Drag End handlers
  const handleTokenDragEnd = (id, newX, newY) => {
    updateActiveMap((m) => ({
      tokens: m.tokens.map((t) => (t.id === id ? { ...t, x: newX, y: newY } : t)),
    }));
  };

  const handleSpellDragEnd = (id, newX, newY) => {
    updateActiveMap((m) => ({
      spells: m.spells.map((s) => (s.id === id ? { ...s, x: newX, y: newY } : s)),
    }));
  };

  // Double Click deletion handlers
  const handleTokenDelete = (id) => {
    updateActiveMap((m) => ({ tokens: m.tokens.filter((t) => t.id !== id) }));
  };

  const handleSpellDelete = (id) => {
    updateActiveMap((m) => ({ spells: m.spells.filter((s) => s.id !== id) }));
  };

  // Battlemap Manager Operations
  const handleCreateMap = (name) => {
    const newMap = {
      id: `map-${Date.now()}`,
      name,
      gridUnit: 60,
      scale: 1,
      panX: 10,
      panY: 10,
      tokens: [],
      spells: [],
    };
    setMaps((prev) => [...prev, newMap]);
    setActiveMapId(newMap.id);
  };

  const handleRenameMap = (id, newName) => {
    setMaps((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: newName } : m))
    );
  };

  const handleDeleteMap = async (id) => {
    if (maps.length <= 1) return;

    if (activeMapId === id) {
      const remaining = maps.filter((m) => m.id !== id);
      setActiveMapId(remaining[0].id);
    }

    setMaps((prev) => prev.filter((m) => m.id !== id));

    try {
      await clearMapFromDB(id);
    } catch (err) {
      console.error('Failed to remove map image from database:', err);
    }
  };

  return (
    <>
      <Sidebar
        gridUnit={activeMap.gridUnit}
        setGridUnit={(val) => updateActiveMap(() => ({ gridUnit: val }))}
        isMapActive={!!mapImage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onAddToken={handleAddToken}
        onAddSpell={handleAddSpell}
        maps={maps}
        activeMapId={activeMapId}
        onSwitchMap={setActiveMapId}
        onCreateMap={handleCreateMap}
        onRenameMap={handleRenameMap}
        onDeleteMap={handleDeleteMap}
        isOpen={isSidebarOpen}
        onLoadMapImage={handleMapDropped}
        onLoadMapUrl={handleMapUrlSubmit}
        mapImage={mapImage}
      />

      <button
        type="button"
        className={`sidebar-toggle ${isSidebarOpen ? '' : 'collapsed'}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
        aria-label={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
      >
        <span className="toggle-icon">◀</span>
      </button>

      <MapViewport
        mapImage={mapImage}
        scale={activeMap.scale}
        panX={activeMap.panX}
        panY={activeMap.panY}
        gridUnit={activeMap.gridUnit}
        isSpacePressed={isSpacePressed}
        onMapDropped={handleMapDropped}
        onLoadUrl={handleMapUrlSubmit}
        shouldFitActiveMap={shouldFitActiveMap}
        onResetFit={() => setShouldFitActiveMap(false)}
        onPanChange={(x, y) => updateActiveMap(() => ({ panX: x, panY: y }))}
        onZoomChange={(s, x, y) =>
          updateActiveMap(() => ({ scale: s, panX: x, panY: y }))
        }
        onSaveState={() => {
          // Triggers side effect update save
          setMaps((m) => [...m]);
        }}
      >
        {activeMap.tokens.map((token) => (
          <Token
            key={token.id}
            id={token.id}
            name={token.name}
            desc={token.desc}
            faction={token.faction}
            size={token.size}
            x={token.x}
            y={token.y}
            scale={activeMap.scale}
            isSpacePressed={isSpacePressed}
            markers={token.markers ?? []}
            onDragEnd={handleTokenDragEnd}
            onToggleMarker={handleToggleTokenMarker}
            onDelete={handleTokenDelete}
          />
        ))}

        {activeMap.spells.map((spell) => (
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
            rotation={spell.rotation ?? 0}
            scale={activeMap.scale}
            isSpacePressed={isSpacePressed}
            onDragEnd={handleSpellDragEnd}
            onRotate={handleSpellRotate}
            onDelete={handleSpellDelete}
          />
        ))}
      </MapViewport>
    </>
  );
}

export default App;
