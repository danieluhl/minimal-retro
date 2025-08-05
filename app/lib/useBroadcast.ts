import { useEffect, useRef, useCallback } from 'react';
import type { 
  BroadcastEvent, 
  CardColumns, 
  CardItem,
  BroadcastEventType,
  CardAddedPayload,
  CardUpdatedPayload,
  CardDeletedPayload,
  CardMovedPayload,
  CardVotedPayload,
  CardsSortedPayload,
  TimerUpdatedPayload,
  UserJoinedPayload,
  UserLeftPayload,
  FullStateSyncPayload
} from './broadcast-types';

const CHANNEL_NAME = 'retro-board';

export function useBroadcast(
  username: string | null,
  onStateUpdate: (cards: CardColumns, activeUsers: string[]) => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const cardsRef = useRef<CardColumns>({ discuss: [], done: [], action: [] });
  const activeUsersRef = useRef<string[]>([]);

  // Initialize broadcast channel
  useEffect(() => {
    if (typeof window === 'undefined' || !username) return;

    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    
    channelRef.current.onmessage = (event) => {
      const broadcastEvent: BroadcastEvent = event.data;
      handleBroadcastEvent(broadcastEvent);
    };

    // Request full state sync when joining
    broadcast('FULL_STATE_SYNC', {});

    return () => {
      channelRef.current?.close();
    };
  }, [username]);

  const broadcast = useCallback((type: BroadcastEventType, payload: any) => {
    if (!channelRef.current || !username) return;

    const event: BroadcastEvent = {
      type,
      timestamp: Date.now(),
      username,
      payload
    };

    channelRef.current.postMessage(event);
  }, [username]);

  const handleBroadcastEvent = useCallback((event: BroadcastEvent) => {
    // Don't process our own events
    if (event.username === username) return;

    switch (event.type) {
      case 'CARD_ADDED':
        handleCardAdded(event.payload as CardAddedPayload);
        break;
      case 'CARD_UPDATED':
        handleCardUpdated(event.payload as CardUpdatedPayload);
        break;
      case 'CARD_DELETED':
        handleCardDeleted(event.payload as CardDeletedPayload);
        break;
      case 'CARD_MOVED':
        handleCardMoved(event.payload as CardMovedPayload);
        break;
      case 'CARD_VOTED':
        handleCardVoted(event.payload as CardVotedPayload);
        break;
      case 'CARDS_SORTED':
        handleCardsSorted(event.payload as CardsSortedPayload);
        break;
      case 'TIMER_UPDATED':
        handleTimerUpdated(event.payload as TimerUpdatedPayload);
        break;
      case 'USER_JOINED':
        handleUserJoined(event.payload as UserJoinedPayload);
        break;
      case 'USER_LEFT':
        handleUserLeft(event.payload as UserLeftPayload);
        break;
      case 'FULL_STATE_SYNC':
        handleFullStateSync(event.payload as FullStateSyncPayload);
        break;
    }
  }, [username]);

  const handleCardAdded = (payload: CardAddedPayload) => {
    cardsRef.current = {
      ...cardsRef.current,
      [payload.column]: [payload.card, ...cardsRef.current[payload.column]]
    };
    updateState();
  };

  const handleCardUpdated = (payload: CardUpdatedPayload) => {
    cardsRef.current = {
      ...cardsRef.current,
      [payload.column]: cardsRef.current[payload.column].map(card => {
        if (card.id === payload.cardId) {
          // Only apply update if incoming change is newer (conflict resolution)
          const incomingTimestamp = payload.updates.lastModified || Date.now();
          if (incomingTimestamp > (card.lastModified || 0)) {
            return { ...card, ...payload.updates };
          }
          return card; // Keep existing if it's newer
        }
        return card;
      })
    };
    updateState();
  };

  const handleCardDeleted = (payload: CardDeletedPayload) => {
    cardsRef.current = {
      ...cardsRef.current,
      [payload.column]: cardsRef.current[payload.column].filter(card => card.id !== payload.cardId)
    };
    updateState();
  };

  const handleCardMoved = (payload: CardMovedPayload) => {
    cardsRef.current = {
      ...cardsRef.current,
      [payload.fromColumn]: cardsRef.current[payload.fromColumn].filter(card => card.id !== payload.cardId),
      [payload.toColumn]: [payload.card, ...cardsRef.current[payload.toColumn]]
    };
    updateState();
  };

  const handleCardVoted = (payload: CardVotedPayload) => {
    cardsRef.current = {
      ...cardsRef.current,
      [payload.column]: cardsRef.current[payload.column].map(card => {
        if (card.id === payload.cardId) {
          // For votes, always take the latest (could implement vote merging if needed)
          return { ...card, votes: payload.votes, lastModified: Date.now() };
        }
        return card;
      })
    };
    updateState();
  };

  const handleCardsSorted = (payload: CardsSortedPayload) => {
    cardsRef.current = {
      ...cardsRef.current,
      [payload.column]: payload.cards
    };
    updateState();
  };

  const handleTimerUpdated = (payload: TimerUpdatedPayload) => {
    cardsRef.current = {
      ...cardsRef.current,
      [payload.column]: cardsRef.current[payload.column].map(card => {
        if (card.id === payload.cardId) {
          // For timers, always take the latest update
          return { ...card, seconds: payload.seconds, isTimerRunning: payload.isTimerRunning, lastModified: Date.now() };
        }
        return card;
      })
    };
    updateState();
  };

  const handleUserJoined = (payload: UserJoinedPayload) => {
    if (!activeUsersRef.current.includes(payload.username)) {
      activeUsersRef.current = [...activeUsersRef.current, payload.username];
      updateState();
    }
  };

  const handleUserLeft = (payload: UserLeftPayload) => {
    activeUsersRef.current = activeUsersRef.current.filter(user => user !== payload.username);
    updateState();
  };

  const handleFullStateSync = (payload: FullStateSyncPayload) => {
    if (payload.cards && payload.activeUsers) {
      cardsRef.current = payload.cards;
      activeUsersRef.current = payload.activeUsers;
      updateState();
    }
  };

  const updateState = () => {
    onStateUpdate(cardsRef.current, activeUsersRef.current);
    // Persist to localStorage
    localStorage.setItem('retro-cards', JSON.stringify(cardsRef.current));
    localStorage.setItem('active-users', JSON.stringify(activeUsersRef.current));
  };

  // Update internal refs when external state changes
  const updateInternalState = useCallback((cards: CardColumns, activeUsers: string[]) => {
    cardsRef.current = cards;
    activeUsersRef.current = activeUsers;
  }, []);

  return {
    broadcast,
    updateInternalState
  };
}