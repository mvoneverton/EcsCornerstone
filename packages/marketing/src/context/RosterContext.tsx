import { createContext, useContext, useEffect, useReducer } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RosterState {
  selectedAgentIds: string[];
  teamId: string | null;
}

type RosterAction =
  | { type: 'ADD_AGENT';    id: string }
  | { type: 'REMOVE_AGENT'; id: string }
  | { type: 'SELECT_TEAM';  teamId: string; agentIds: string[] }
  | { type: 'CLEAR' };

interface RosterContextValue extends RosterState {
  addAgent:    (id: string) => void;
  removeAgent: (id: string) => void;
  selectTeam:  (teamId: string, agentIds: string[]) => void;
  clearRoster: () => void;
}

// ── Reducer ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ecs_roster';

function reducer(state: RosterState, action: RosterAction): RosterState {
  switch (action.type) {
    case 'ADD_AGENT':
      if (state.selectedAgentIds.includes(action.id)) return state;
      return { ...state, selectedAgentIds: [...state.selectedAgentIds, action.id] };

    case 'REMOVE_AGENT':
      return {
        ...state,
        selectedAgentIds: state.selectedAgentIds.filter((id) => id !== action.id),
        teamId: null,
      };

    case 'SELECT_TEAM':
      return { selectedAgentIds: action.agentIds, teamId: action.teamId };

    case 'CLEAR':
      return { selectedAgentIds: [], teamId: null };

    default:
      return state;
  }
}

function getInitialState(): RosterState {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as RosterState;
  } catch {
    // ignore parse errors
  }
  return { selectedAgentIds: [], teamId: null };
}

// ── Context ───────────────────────────────────────────────────────────────────

const RosterContext = createContext<RosterContextValue | null>(null);

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  // Persist to sessionStorage on every state change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value: RosterContextValue = {
    ...state,
    addAgent:    (id) => dispatch({ type: 'ADD_AGENT', id }),
    removeAgent: (id) => dispatch({ type: 'REMOVE_AGENT', id }),
    selectTeam:  (teamId, agentIds) => dispatch({ type: 'SELECT_TEAM', teamId, agentIds }),
    clearRoster: () => dispatch({ type: 'CLEAR' }),
  };

  return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
}

export function useRoster(): RosterContextValue {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error('useRoster must be used inside <RosterProvider>');
  return ctx;
}
