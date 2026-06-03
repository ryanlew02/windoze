import { useRef, useCallback } from 'react';

export function useDraggable(onMove: (x: number, y: number) => void) {
  const dragging = useRef(false);
  const origin = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });

  const onMouseDown = useCallback(
    (e: React.MouseEvent, currentX: number, currentY: number) => {
      e.preventDefault();
      dragging.current = true;
      origin.current = { mouseX: e.clientX, mouseY: e.clientY, winX: currentX, winY: currentY };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const dx = ev.clientX - origin.current.mouseX;
        const dy = ev.clientY - origin.current.mouseY;
        onMove(origin.current.winX + dx, origin.current.winY + dy);
      };

      const onMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [onMove]
  );

  return { onMouseDown };
}
