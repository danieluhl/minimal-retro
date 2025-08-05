export interface CardItem {
  id: string;
  text: string;
  votes: number;
  backgroundColor: string;
  seconds: number;
  isTimerRunning: boolean;
  lastModified: number;
  cardNumber: number;
  userVotes: Record<string, number>; // username -> vote count
}

export type CardColumns = {
  discuss: CardItem[];
  done: CardItem[];
  action: CardItem[];
};

export type BroadcastEventType = 
  | 'CARD_ADDED'
  | 'CARD_UPDATED' 
  | 'CARD_DELETED'
  | 'CARD_MOVED'
  | 'CARD_VOTED'
  | 'CARDS_SORTED'
  | 'TIMER_UPDATED'
  | 'USER_JOINED'
  | 'USER_LEFT'
  | 'FULL_STATE_SYNC';

export interface BroadcastEvent {
  type: BroadcastEventType;
  timestamp: number;
  username: string;
  payload: any;
}

export interface CardAddedPayload {
  column: keyof CardColumns;
  card: CardItem;
}

export interface CardUpdatedPayload {
  column: keyof CardColumns;
  cardId: string;
  updates: Partial<CardItem>;
}

export interface CardDeletedPayload {
  column: keyof CardColumns;
  cardId: string;
}

export interface CardMovedPayload {
  fromColumn: keyof CardColumns;
  toColumn: keyof CardColumns;
  cardId: string;
  card: CardItem;
}

export interface CardVotedPayload {
  column: keyof CardColumns;
  cardId: string;
  votes: number;
}

export interface CardsSortedPayload {
  column: keyof CardColumns;
  cards: CardItem[];
}

export interface TimerUpdatedPayload {
  column: keyof CardColumns;
  cardId: string;
  seconds: number;
  isTimerRunning: boolean;
}

export interface UserJoinedPayload {
  username: string;
}

export interface UserLeftPayload {
  username: string;
}

export interface FullStateSyncPayload {
  cards: CardColumns;
  activeUsers: string[];
}