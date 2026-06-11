const BASE_URL = import.meta.env.BASE_URL || '/';

export const DEFAULT_MAPS = [
  {
    id: 'blank',
    name: 'Blank Grid Map',
    label: 'Blank',
    path: `${BASE_URL}maps/blank_map.png`,
  },
  {
    id: 'forest',
    name: 'Forest Clearing',
    label: 'Forest',
    path: `${BASE_URL}maps/forest_clearing.png`,
  },
  {
    id: 'dungeon',
    name: 'Dungeon Crypt',
    label: 'Dungeon',
    path: `${BASE_URL}maps/dungeon_room.png`,
  },
  {
    id: 'cavern',
    name: 'Cave Cavern',
    label: 'Cavern',
    path: `${BASE_URL}maps/cave_cavern.png`,
  },
  {
    id: 'tavern',
    name: 'Cozy Tavern',
    label: 'Tavern',
    path: `${BASE_URL}maps/tavern_floor.png`,
  },
];

