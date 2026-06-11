import React, { useState, useRef } from 'react';

const Sidebar = ({
  gridUnit,
  setGridUnit,
  isMapActive,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onAddToken,
  onAddSpell,
  maps,
  activeMapId,
  onSwitchMap,
  onCreateMap,
  onRenameMap,
  onDeleteMap,
  isOpen = true,
  onLoadMapImage,
  onLoadMapUrl,
}) => {
  // Spawn creature state
  const [tokenName, setTokenName] = useState('');
  const [tokenSize, setTokenSize] = useState('1');
  const [tokenDesc, setTokenDesc] = useState('');
  const [tokenFaction, setTokenFaction] = useState('friendly');

  // Spell state
  const [spellShape, setSpellShape] = useState('circle');
  const [spellSize, setSpellSize] = useState('20');
  const [spellElement, setSpellElement] = useState('fire');
  const [spellLabel, setSpellLabel] = useState('');

  // Editing state for rename
  const [editingMapId, setEditingMapId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Map upload states
  const [sidebarUrl, setSidebarUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleSidebarUrlSubmit = (e) => {
    e.preventDefault();
    if (sidebarUrl.trim()) {
      onLoadMapUrl(sidebarUrl.trim());
      setSidebarUrl('');
    }
  };

  const handleSidebarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadMapImage(file);
    }
  };

  const handleSpawnToken = (e) => {
    e.preventDefault();
    if (!isMapActive) {
      alert('Please drop a map file into the canvas box layout first.');
      return;
    }
    const name = tokenName.trim() || '??';
    const desc = tokenDesc.trim() || 'No context stats.';
    onAddToken({ name, size: tokenSize, desc, faction: tokenFaction });
    
    // Reset inputs
    setTokenName('');
    setTokenDesc('');
  };

  const handleCastSpell = (e) => {
    e.preventDefault();
    if (!isMapActive) {
      alert('Load a map layout workspace before casting spells!');
      return;
    }
    const label = spellLabel.trim() || 'Spell Effect';
    onAddSpell({
      shape: spellShape,
      sizeFeet: parseInt(spellSize, 10),
      element: spellElement,
      label,
    });

    // Reset label
    setSpellLabel('');
  };

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-content">
        <h2>DM Workspace</h2>

        <div className="input-group">
          <label>Battlemaps Manager</label>
          <div className="map-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {maps.map((map) => {
              const isActive = map.id === activeMapId;
              const isEditing = map.id === editingMapId;
              return (
                <div
                  key={map.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isActive ? 'rgba(168, 50, 50, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? 'var(--accent-color)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '6px',
                    padding: '4px 8px',
                    boxShadow: isActive ? '0 0 10px rgba(168, 50, 50, 0.2)' : 'none',
                  }}
                >
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editingName.trim()) {
                          onRenameMap(map.id, editingName.trim());
                          setEditingMapId(null);
                        }
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', flexGrow: 1 }}
                    >
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingMapId(null);
                          }
                        }}
                        autoFocus
                        style={{
                          flexGrow: 1,
                          padding: '2px 4px',
                          fontSize: '0.85rem',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid var(--accent-color)',
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          width: 'auto',
                          padding: '2px 4px',
                          fontSize: '0.75rem',
                          background: 'transparent',
                          border: 'none',
                          boxShadow: 'none',
                          cursor: 'pointer',
                          color: '#10b981',
                        }}
                        title="Save"
                      >
                        ✔️
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingMapId(null)}
                        style={{
                          width: 'auto',
                          padding: '2px 4px',
                          fontSize: '0.75rem',
                          background: 'transparent',
                          border: 'none',
                          boxShadow: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                        }}
                        title="Cancel"
                      >
                        ❌
                      </button>
                    </form>
                  ) : (
                    <>
                      <div
                        onClick={() => onSwitchMap(map.id)}
                        style={{
                          flexGrow: 1,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: isActive ? '600' : '400',
                          color: isActive ? '#fff' : 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          padding: '4px 0',
                        }}
                        title={map.name}
                      >
                        {map.name}
                      </div>
                      <button
                        onClick={() => {
                          setEditingMapId(map.id);
                          setEditingName(map.name);
                        }}
                        style={{
                          width: 'auto',
                          padding: '2px 6px',
                          fontSize: '0.75rem',
                          background: 'transparent',
                          border: 'none',
                          boxShadow: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                        title="Rename"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (maps.length <= 1) {
                            alert('You must have at least one battlemap!');
                            return;
                          }
                          if (window.confirm(`Delete battlemap "${map.name}"? This will also delete all of its tokens and spells.`)) {
                            onDeleteMap(map.id);
                          }
                        }}
                        disabled={maps.length <= 1}
                        style={{
                          width: 'auto',
                          padding: '2px 6px',
                          fontSize: '0.75rem',
                          background: 'transparent',
                          border: 'none',
                          boxShadow: 'none',
                          color: maps.length <= 1 ? 'var(--text-muted)' : '#ef4444',
                          cursor: maps.length <= 1 ? 'not-allowed' : 'pointer',
                          opacity: maps.length <= 1 ? 0.4 : 1,
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create Map Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.elements.newMapName.value.trim();
              if (name) {
                onCreateMap(name);
                e.target.reset();
              }
            }}
            style={{ display: 'flex', gap: '8px', marginTop: '4px' }}
          >
            <input
              type="text"
              name="newMapName"
              placeholder="New Map Name"
              required
              style={{ flexGrow: 1, padding: '6px 8px', fontSize: '0.8rem' }}
            />
            <button type="submit" style={{ width: '40px', padding: '6px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
              +
            </button>
          </form>

          {/* Load Map Floorplan section */}
          <div className="input-group" style={{ marginTop: '12px', gap: '4px' }}>
            <label style={{ fontSize: '0.7rem', opacity: 0.85 }}>Load Map Layout</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                📁 Choose File...
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleSidebarFileChange}
              />
              <form onSubmit={handleSidebarUrlSubmit} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Paste image URL..."
                  value={sidebarUrl}
                  onChange={(e) => setSidebarUrl(e.target.value)}
                  style={{ flexGrow: 1, padding: '6px 8px', fontSize: '0.8rem' }}
                />
                <button
                  type="submit"
                  style={{
                    width: 'auto',
                    padding: '6px 10px',
                    background: 'var(--accent-color)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Load
                </button>
              </form>
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div className="input-group">
          <label htmlFor="grid-slider">Grid/Token Scale: {gridUnit}px</label>
          <input
            type="range"
            id="grid-slider"
            min="15"
            max="360"
            value={gridUnit}
            onChange={(e) => setGridUnit(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="input-group">
          <label>Map Controls</label>
          <div className="zoom-controls">
            <button onClick={onZoomIn}>In</button>
            <button onClick={onZoomOut}>Out</button>
            <button onClick={onZoomReset}>Reset</button>
          </div>
        </div>

        <hr className="divider" />

        <h3>Spawn Creature</h3>
        <form onSubmit={handleSpawnToken} className="input-group" style={{ gap: '12px' }}>
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="token-name">Initials</label>
              <input
                type="text"
                id="token-name"
                placeholder="M"
                maxLength={3}
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="token-size">Size</label>
              <select
                id="token-size"
                value={tokenSize}
                onChange={(e) => setTokenSize(e.target.value)}
              >
                <option value="1">Medium (1x1)</option>
                <option value="2">Large (2x2)</option>
                <option value="3">Huge (3x3)</option>
                <option value="4">Gargantuan (4x4)</option>
                <option value="6">Colossal (6x6)</option>
                <option value="8">Titanic (8x8)</option>
                <option value="12">Behemoth (12x12)</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="token-desc">Description</label>
            <input
              type="text"
              id="token-desc"
              placeholder="Manshoon, Evil Wizard"
              value={tokenDesc}
              onChange={(e) => setTokenDesc(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="token-faction">Faction</label>
            <select
              id="token-faction"
              value={tokenFaction}
              onChange={(e) => setTokenFaction(e.target.value)}
            >
              <option value="friendly">Player / Ally (Green)</option>
              <option value="hostile">Enemy (Red)</option>
              <option value="neutral">Neutral (Orange)</option>
            </select>
          </div>

          <button type="submit">Spawn Token</button>
        </form>

        <hr className="divider" />

        <h3>Spell AoE Templates</h3>
        <form onSubmit={handleCastSpell} className="input-group" style={{ gap: '12px' }}>
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="spell-shape">Shape</label>
              <select
                id="spell-shape"
                value={spellShape}
                onChange={(e) => setSpellShape(e.target.value)}
              >
                <option value="circle">Radius / Sphere</option>
                <option value="cube">Cube / Square</option>
                <option value="cone">Cone (Face Down)</option>
                <option value="line">Line (Wall / Beam)</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="spell-size">Size (Feet)</label>
              <select
                id="spell-size"
                value={spellSize}
                onChange={(e) => setSpellSize(e.target.value)}
              >
                <option value="5">5 ft</option>
                <option value="10">10 ft</option>
                <option value="15">15 ft</option>
                <option value="20">20 ft</option>
                <option value="30">30 ft</option>
                <option value="40">40 ft</option>
                <option value="60">60 ft</option>
              </select>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="spell-element">Element / Type</label>
              <select
                id="spell-element"
                value={spellElement}
                onChange={(e) => setSpellElement(e.target.value)}
              >
                <option value="fire">Fire / Evocation</option>
                <option value="cold">Cold / Ice</option>
                <option value="acid">Acid / Poison</option>
                <option value="lightning">Lightning / Force</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="spell-label">Spell Label</label>
              <input
                type="text"
                id="spell-label"
                placeholder="Fireball"
                value={spellLabel}
                onChange={(e) => setSpellLabel(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="spell-btn">Cast Template</button>
        </form>

        <div className="help-text">
          • <strong>Align Grid:</strong> Adjust the top slider until tokens cleanly fit the map squares.<br />
          • <strong>Pan view:</strong> Drag background (Touch) or hold <code>Spacebar</code> + drag (Desktop).<br />
          • <strong>Zoom map:</strong> Pinch map (Touch) or scroll mouse wheel (Desktop).<br />
          • <strong>Token Menu:</strong> Touch &amp; hold (Touch) or right-click token (Desktop).<br />
          • <strong>Rotate spells:</strong> Tap spell (Touch) or hover + <code>Shift</code> + scroll / press <code>R</code> (Desktop).<br />
          • <strong>Delete anything:</strong> Double-tap (Touch) or double-click item (Desktop).
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
