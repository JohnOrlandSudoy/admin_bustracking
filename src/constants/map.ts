/** Default map center — Metro Manila, Philippines */
export const DEFAULT_MAP_CENTER: [number, number] = [14.5995, 120.9842];

export const DEFAULT_MAP_ZOOM = 6;
export const TERMINAL_PICKER_ZOOM = 16;

export const MAP_TILE_CONFIG = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

/** Rough bounding box for Philippines (Photon `bbox`: west,south,east,north) */
export const PH_PHOTON_BBOX = '116.0,4.5,127.0,21.5';
