import { createContext, useContext } from 'react';

export const CanvasPortalContext = createContext<HTMLElement | null>(null);

export const useCanvasPortal = (): HTMLElement | null => useContext(CanvasPortalContext);

export const getCanvasPopupContainer = (canvas: HTMLElement | null, fallback: HTMLElement): HTMLElement =>
    canvas ?? fallback;
