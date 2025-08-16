declare module 'react-sketch-canvas' {
  import { CSSProperties, ForwardRefExoticComponent, RefAttributes } from 'react';

  export interface ReactSketchCanvasProps {
    style?: CSSProperties;
    strokeWidth?: number;
    strokeColor?: string;
    canvasColor?: string;
    allowOnlyPointerType?: string;
    width?: string | number;
    height?: string | number;
  }

  // Only export the type for ref, not as a named export
  export type ReactSketchCanvasRef = {
    clearCanvas: () => void;
    eraseMode: (erase: boolean) => void;
    // Add other methods as needed
  };

  const ReactSketchCanvas: ForwardRefExoticComponent<
    ReactSketchCanvasProps & RefAttributes<ReactSketchCanvasRef>
  >;
  export default ReactSketchCanvas;
}