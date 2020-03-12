import { createContext, createElement, useContext } from 'react';
import {
  PatchedStore,
  useSelector as useSelectorOrig,
  useTrackedState as useTrackedStateOrig,
} from 'reactive-react-redux';

const initialState = {
  count: 0,
};

export type State = typeof initialState;

export type Action =
  | { type: 'increment' }
  | { type: 'decrement' };

export const reducer = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'increment': return {
      ...state,
      count: state.count + 1,
    };
    case 'decrement': return {
      ...state,
      count: state.count - 1,
    };
    default: return state;
  }
};

// Context based APIs

const Context = createContext(new Proxy({}, {
  get() { throw new Error('use Provider'); },
}) as PatchedStore<State, Action>);

export const Provider: React.FC<{ store: PatchedStore<State, Action> }> = ({
  store,
  children,
}) => createElement(Context.Provider, { value: store }, children);

export const useDispatch = () => useContext(Context).dispatch;

export const useSelector = <Selected>(
  selector: (state: State) => Selected,
) => useSelectorOrig(useContext(Context), selector);

export const useTrackedState = () => useTrackedStateOrig(useContext(Context));
