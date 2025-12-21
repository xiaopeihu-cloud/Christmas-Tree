export interface GestureState {
  isHandDetected: boolean;
  gesture: 'None' | 'Open_Palm' | 'Closed_Fist' | 'Pointing_Up' | 'Victory';
  handPosition: { x: number; y: number }; // Normalized -1 to 1
}

export interface TreeContextType {
  gestureState: GestureState;
  setGestureState: (state: GestureState) => void;
  unleashFactor: number; // 0 to 1 (0 = Tree, 1 = Universe)
  activePhotoId: number | null; // ID of zoomed photo
  simulationMode: boolean; // If true, ignore camera, use sliders
}
