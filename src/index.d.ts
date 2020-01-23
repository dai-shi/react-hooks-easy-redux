import { Context, ComponentType } from 'react';
import {
  Action,
  Dispatch,
  Store,
} from 'redux';

type CustomContext = Context<unknown>;

export type ProviderProps<S, A extends Action> = {
  store: Store<S, A>;
  customContext?: CustomContext;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProviderType<S = unknown, A extends Action = any>
  = ComponentType<ProviderProps<S, A>>;

export const createCustomContext: () => CustomContext;

export const Provider: ProviderType;

type Opts = {
  customContext?: CustomContext;
};

export const useDispatch: <A extends Action>(opts?: Opts) => Dispatch<A>;

export const useTrackedState: <S extends {}>(opts?: Opts) => S;

export const useSelector: <S, V>(
  selector: (state: S) => V,
  equalityFn?: (a: V, b: V) => boolean | Opts & { equalityFn?: (a: V, b: V) => boolean },
  opts?: Opts,
) => V;

// deep proxy utils

/**
 * If `obj` is a proxy, it will mark the entire object as used.
 * Otherwise, it does nothing.
 */
export const trackMemo: (obj: unknown) => void;

/**
 * If `obj` is a proxy, it will return the original object.
 * Otherwise, it will return null.
 */
export const getUntrackedObject: <T>(obj: T) => T | null;
