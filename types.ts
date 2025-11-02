
export enum ConversationState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
}

export interface TranscriptEntry {
  id: number;
  speaker: 'user' | 'model';
  text: string;
}
