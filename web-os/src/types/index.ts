export interface AppDefinition {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconBg?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  defaultWidth?: number;
  defaultHeight?: number;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  isClosing?: boolean;
  zIndex: number;
  componentProps?: Record<string, unknown>;
}
