/**
 * useUndoableState
 * State with undo/redo support for controlled inputs.
 *
 * CHANGE LOG & FEATURES:
 *
 * 1. Initial impl
 * - What: Past/present/future stack; setValue adds to history, setValueReplace clears history
 * - Why: React controlled inputs break native browser undo
 * - Dependencies: useState, useCallback
 */
import { useState, useCallback } from "react";

export function useUndoableState(initial: string) {
  const [state, setState] = useState({
    past: [] as string[],
    present: initial,
    future: [] as string[],
  });

  const setValue = useCallback((valueOrUpdater: string | ((prev: string) => string)) => {
    setState((s) => {
      const next =
        typeof valueOrUpdater === "function" ? valueOrUpdater(s.present) : valueOrUpdater;
      if (next === s.present) return s;
      return {
        past: [...s.past, s.present],
        present: next,
        future: [],
      };
    });
  }, []);

  const setValueReplace = useCallback((value: string) => {
    setState((s) => (value === s.present ? s : { past: [], present: value, future: [] }));
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s;
      const prev = s.past[s.past.length - 1];
      return {
        past: s.past.slice(0, -1),
        present: prev,
        future: [s.present, ...s.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      return {
        past: [...s.past, s.present],
        present: next,
        future: s.future.slice(1),
      };
    });
  }, []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  return {
    value: state.present,
    setValue,
    setValueReplace,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
