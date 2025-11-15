// Core game types

export interface Position {
  x: number;
  y: number;
}

export interface Seat {
  position: Position;
  occupied: boolean;
  passengerId: string | null;
}

export interface PassengerState {
  id: string;
  type: PassengerType;
  position: Position;
  mood: number; // 0-100
  stress: number; // 0-100
  socialEnergy: number; // -5 to +5
  noiseLevel: number; // 0-3
  smellLevel: number; // 0-3
  bubbleSize: number; // personal space radius
  isSeated: boolean;
  lastInteractionTime: number;
}

export enum PassengerType {
  OFFICE_WORKER = 'office_worker',
  PUNK = 'punk',
  MOM_WITH_CHILD = 'mom_with_child',
  HOMELESS = 'homeless',
  COUPLE_LEFT = 'couple_left',
  COUPLE_RIGHT = 'couple_right',
  INTROVERT = 'introvert',
  TALKATIVE_OLD_MAN = 'talkative_old_man',
  HIPSTER = 'hipster',
  CHILL_PERSON = 'chill_person',
}

export interface PassengerTemplate {
  type: PassengerType;
  name: string;
  color: string;
  mood: number;
  stress: number;
  socialEnergy: number;
  noiseLevel: number;
  smellLevel: number;
  bubbleSize: number;
  triggers: {
    type: PassengerType;
    stressModifier: number;
  }[];
  description: string;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  coachWidth: number;
  coachHeight: number;
  seatRows: number;
  seatsPerRow: number;
  roundDuration: number; // seconds
  initialQueueSize: number;
  placementTimePerStation: number; // seconds
}

export interface GameState {
  stationNumber: number;
  totalStress: number;
  passengers: PassengerState[];
  queue: PassengerState[];
  seats: Seat[];
  isPlacementPhase: boolean;
  roundTimer: number;
  currentSelectedPassenger: PassengerState | null;
  gameOver: boolean;
  scrollOffset: number;
}
