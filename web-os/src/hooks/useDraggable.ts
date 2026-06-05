import { useRef, useCallback } from 'react';

const getCssZoom = () =>
  parseFloat(getComputedStyle(document.documentElement).zoom) || 1;

export function useDraggable(
  onMove: (x: number, y: number) => void,
  onDrop?: (x: number, y: number) => void,
) {
  const dragging = useRef(false);
  const origin = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });
  const lastPos = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback(
    (e: React.MouseEvent, currentX: number, currentY: number) => {
      e.preventDefault();
      dragging.current = true;
      const zoom = getCssZoom();
      origin.current = { mouseX: e.clientX / zoom, mouseY: e.clientY / zoom, winX: currentX, winY: currentY };
      lastPos.current = { x: currentX, y: currentY };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const z = getCssZoom();
        const dx = ev.clientX / z - origin.current.mouseX;
        const dy = ev.clientY / z - origin.current.mouseY;
        const x = origin.current.winX + dx;
        const y = origin.current.winY + dy;
        lastPos.current = { x, y };
        onMove(x, y);
      };

      const onMouseUp = () => {
        dragging.current = false;
        onDrop?.(lastPos.current.x, lastPos.current.y);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [onMove, onDrop],
  );

  return { onMouseDown };
}
