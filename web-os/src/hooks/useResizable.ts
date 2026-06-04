import { useRef, useCallback } from 'react';

export type ResizeDir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

interface Origin {
  mouseX: number;
  mouseY: number;
  winX: number;
  winY: number;
  winW: number;
  winH: number;
  dir: ResizeDir;
}

export function useResizable(
  onResize: (x: number, y: number, w: number, h: number) => void,
  minW = 300,
  minH = 200,
) {
  const active = useRef(false);
  const origin = useRef<Origin>({ mouseX: 0, mouseY: 0, winX: 0, winY: 0, winW: 0, winH: 0, dir: 'se' });

  const onMouseDown = useCallback(
    (e: React.MouseEvent, dir: ResizeDir, winX: number, winY: number, winW: number, winH: number) => {
      e.preventDefault();
      e.stopPropagation();
      active.current = true;
      origin.current = { mouseX: e.clientX, mouseY: e.clientY, winX, winY, winW, winH, dir };

      const onMouseMove = (ev: MouseEvent) => {
        if (!active.current) return;
        const { mouseX, mouseY, winX, winY, winW, winH, dir } = origin.current;
        const dx = ev.clientX - mouseX;
        const dy = ev.clientY - mouseY;

        let x = winX, y = winY, w = winW, h = winH;

        if (dir.includes('e')) w = Math.max(minW, winW + dx);
        if (dir.includes('s')) h = Math.max(minH, winH + dy);
        if (dir.includes('w')) { w = Math.max(minW, winW - dx); x = winX + winW - w; }
        if (dir.includes('n')) { h = Math.max(minH, winH - dy); y = winY + winH - h; }

        onResize(x, y, w, h);
      };

      const onMouseUp = () => {
        active.current = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [onResize, minW, minH],
  );

  return { onMouseDown };
}
