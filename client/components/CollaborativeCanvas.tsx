import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import InlineLoading from './InlineLoading';

interface Point {
  x: number;
  y: number;
}

interface SavedDrawing {
  id: string;
  name: string;
  data: string;
  timestamp: number;
  fileRecordId?: number;
  isLocal?: boolean;
}

interface DrawingEvent {
  type: 'draw' | 'erase' | 'text' | 'clear' | 'undo' | 'redo' | 'background-color';
  points?: Point[];
  color?: string;
  width?: number;
  tool?: string;
  text?: string;
  position?: Point;
  backgroundColor?: string;
  timestamp: number;
}

interface Collaborator {
  id: string;
  name: string;
  cursor: Point;
  lastSeen: number;
  isGuest?: boolean;
}

interface CanvasProps {
  canvasId: string;
  shareToken?: string;
  isOwner?: boolean;
  allowAnonymousEdit?: boolean;
  onCollaboratorChange?: (collaboratorId: string, action: 'joined' | 'left') => void;
  initialBackgroundColor?: string;
}

interface CanvasSession {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  duration: number;
  collaborators: string[];
  canvasId: string;
  createdAt: string;
}

interface ShareData {
  shareUrl: string;
  shareToken: string;
  expiresAt: string;
  fullUrl?: string;
  accessCount?: number;
}

// Color preset arrays
const BRUSH_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#A52A2A', // Brown
  '#808080', // Gray
  '#FF69B4', // Hot Pink
  '#32CD32', // Lime Green
  '#4169E1', // Royal Blue
  '#DC143C', // Crimson
];

const BACKGROUND_COLORS = [
  '#FFFFFF', // Pure White
  '#1F2937', // Dark Gray
  '#000000', // Pure Black
  '#FEF3C7', // Light Yellow
  '#DBEAFE', // Light Blue
  '#D1FAE5', // Light Green
  '#FEE2E2', // Light Red/Pink
  '#E0E7FF', // Light Purple
  '#F3E8FF', // Light Lavender
  '#FCE7F3', // Light Rose
  '#F0F9FF', // Very Light Blue
  '#F7FEE7', // Very Light Green
];

const CollaborativeCanvas: React.FC<CanvasProps> = ({
  canvasId,
  shareToken,
  isOwner = false,
  allowAnonymousEdit = false,
  onCollaboratorChange,
  initialBackgroundColor = '#FFFFFF'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'brush' | 'eraser' | 'text'>('pen');
  const [brushColor, setBrushColor] = useState('#000000');
  const [penSize, setPenSize] = useState(2);
  const [brushSize, setBrushSize] = useState(8);
  const [brushWidth, setBrushWidth] = useState(2); // Current active size
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [strokes, setStrokes] = useState<DrawingEvent[]>([]);
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(new Map());
  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [textInput, setTextInput] = useState({ x: 0, y: 0, text: '', active: false });
  const [guestName, setGuestName] = useState('');
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [scheduledSessions, setScheduledSessions] = useState<CanvasSession[]>([]);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    collaborators: ''
  });
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Save/Load functionality states
  const { user } = useAuth();
  const [savedDrawings, setSavedDrawings] = useState<SavedDrawing[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [currentDrawingName, setCurrentDrawingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadSuccess, setLoadSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [shareData, setShareData] = useState<ShareData>({
    shareUrl: '',
    shareToken: '',
    expiresAt: ''
  });
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [brushPath, setBrushPath] = useState<Point[]>([]); // For smooth brush strokes
  
  // Pan functionality removed - users can rely on browser zoom instead
  
  // Mobile toolbar collapse state
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  
  // Removed zoom functionality - users can rely on browser zoom

  // User type and permissions
  const userType: 'owner' | 'collaborator' | 'visitor' = 
    isOwner ? 'owner' : 
    (user ? 'collaborator' : 'visitor');

  const permissions = {
    canClear: userType === 'owner',          // Only host can delete whole canvas
    canSave: userType === 'owner',           // Only host can save to site
    canLoad: userType === 'owner',           // Only host can load other drawings
    canUndo: userType === 'owner',           // Only host can undo others' changes
    canRedo: userType === 'owner',           // Only host can redo others' changes
    canChangeBackground: userType !== 'visitor',
    canSchedule: userType === 'owner',       // Only host can schedule drawing sessions
    canShare: userType === 'owner',          // Only host can generate canvas links
    canChangePenColor: true,                 // All users can change pen color
    canChangePenSize: true,                  // All users can change pen size
    canDraw: true,                           // All users can draw
    canExport: true                          // All users can export
  };

  // Effect to close modals when clicking outside or changing tools
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.color-picker-modal') && !target.closest('.preset-button')) {
        setShowColorPicker(false);
        setShowBackgroundPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modals when tool changes
  useEffect(() => {
    setShowColorPicker(false);
    setShowBackgroundPicker(false);
  }, [currentTool]);

  // WebSocket initialization with environment detection
  useEffect(() => {
    let socketInstance: Socket | null = null;

    // Only initialize socket in production or when explicitly enabled in development
    const shouldInitializeSocket = process.env.NODE_ENV === 'production' || 
                                   process.env.REACT_APP_ENABLE_WEBSOCKET === 'true';

    if (shouldInitializeSocket) {
      try {
        const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
        socketInstance = io(serverUrl, {
          transports: ['polling', 'websocket'], // Prioritize polling for Cloudflare compatibility
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          forceNew: true, // Force new connection
          upgrade: true, // Allow transport upgrades
          timeout: 10000, // Increase timeout for slow connections
          secure: window.location.protocol === 'https:', // Use secure connection for HTTPS sites
          rejectUnauthorized: false // For development/self-signed certificates
        });

        socketInstance.on('connect', () => {
          setIsConnected(true);
          setSocket(socketInstance);
          
          // Handle user identification based on auth status and host role
          if (!user) {
            setShowGuestDialog(true);
          } else {
            // Authenticated users: hosts use firstName, collaborators use email
            const displayName = isOwner ? user.firstName : user.email;
            socketInstance?.emit('user-identify', {
              guestName: displayName,
              guestIdentifier: socketInstance.id,
              canvasId,
              isAuthenticated: true
            });
            // Join canvas room
            socketInstance?.emit('join-canvas', canvasId);
          }
        });

        socketInstance.on('disconnect', () => {
          setIsConnected(false);
        });

        socketInstance.on('connect_error', () => {
          setIsConnected(false);
        });

        socketInstance.on('reconnect_attempt', () => {
          // Reconnection attempt in progress
        });

        socketInstance.on('reconnect', () => {
          setIsConnected(true);
        });

        socketInstance.on('reconnect_error', () => {
          // Reconnection failed
        });

        socketInstance.on('canvas-update', (updateData: any) => {
          // Handle incoming drawing events from other users
          if (updateData.canvasData && updateData.operation === 'draw') {
            const drawingEvent = updateData.canvasData;
            
            // Add to strokes state
            setStrokes(prev => [...prev, drawingEvent]);
            
            // Immediately draw the received stroke on the canvas
            const canvas = canvasRef.current;
            if (canvas && drawingEvent.points && drawingEvent.points.length > 1) {
              
              // Draw lines between consecutive points
              for (let i = 1; i < drawingEvent.points.length; i++) {
                const from = drawingEvent.points[i - 1];
                const to = drawingEvent.points[i];
                
                // Use the drawLine function to render the stroke
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  if (drawingEvent.tool === 'pen') {
                    ctx.lineCap = 'butt';
                    ctx.lineJoin = 'miter';
                    ctx.lineWidth = Math.max(1, drawingEvent.width * 0.7);
                  } else if (drawingEvent.tool === 'brush') {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.lineWidth = drawingEvent.width;
                    ctx.globalAlpha = 0.8;
                  } else {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.lineWidth = drawingEvent.width;
                  }
                  
                  if (drawingEvent.tool === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                  } else {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = drawingEvent.color;
                  }

                  ctx.beginPath();
                  ctx.moveTo(from.x, from.y);
                  ctx.lineTo(to.x, to.y);
                  ctx.stroke();
                  
                  // Reset alpha for other operations
                  if (drawingEvent.tool === 'brush') {
                    ctx.globalAlpha = 1.0;
                  }
                }
              }
            }
          } else if (updateData.operation === 'clear') {
            // Clear the canvas
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx && canvas) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = backgroundColor;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            setStrokes([]);
          } else if (updateData.operation === 'background-color') {
            // Update background color from host
            if (updateData.canvasData && updateData.canvasData.backgroundColor) {
              setBackgroundColor(updateData.canvasData.backgroundColor);
            }
          }
        });

        socketInstance.on('collaborator-joined', (data: any) => {
          let displayName: string;
          
          if (data.user?.isAuthenticated && data.user?.guestName) {
            // Authenticated user - show their email
            displayName = data.user.guestName;
          } else if (data.user?.guestName && data.user.guestName.trim()) {
            // Guest user with custom name
            displayName = data.user.guestName.trim();
          } else if (data.visitorNumber) {
            // Guest user without custom name - use visitor number from server
            displayName = `visitor_${data.visitorNumber}`;
          } else {
            // Fallback
            displayName = `visitor_${data.socketId.slice(-2)}`;
          }
          
          const collaborator: Collaborator = {
            id: data.socketId,
            name: displayName,
            cursor: { x: 0, y: 0 },
            lastSeen: Date.now(),
            isGuest: !data.user?.isAuthenticated
          };
          setCollaborators(prev => new Map(prev.set(collaborator.id, collaborator)));
          onCollaboratorChange?.(collaborator.id, 'joined');
          
          // If this user is the host, send current background color to the new collaborator
          if (isOwner && socketInstance.connected) {
            const backgroundEvent: DrawingEvent = {
              type: 'background-color',
              backgroundColor,
              timestamp: Date.now()
            };
            socketInstance.emit('canvas-update', { 
              canvasData: backgroundEvent, 
              canvasId,
              operation: 'background-color',
              targetSocketId: data.socketId // Send only to the new user
            });
          }
        });

        socketInstance.on('collaborator-left', (data: any) => {
          setCollaborators(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.socketId);
            return newMap;
          });
          onCollaboratorChange?.(data.socketId, 'left');
        });

        socketInstance.on('cursor-move', (data: { x: number; y: number; socketId: string }) => {
          setCollaborators(prev => {
            const newMap = new Map(prev);
            const collaborator = newMap.get(data.socketId);
            if (collaborator) {
              newMap.set(data.socketId, { ...collaborator, cursor: { x: data.x, y: data.y } });
            }
            return newMap;
          });
        });

        // Handle initial canvas state when joining
        socketInstance.on('canvas-state', (data: { canvasData: DrawingEvent[] | { version?: number; objects?: unknown[]; background?: string; events?: DrawingEvent[] }; version?: number }) => {
          if (data.canvasData) {
            // Clear current state
            setStrokes([]);
            
            let events: DrawingEvent[] = [];
            
            // Handle different canvas data formats
            if (Array.isArray(data.canvasData)) {
              // New format: array of DrawingEvent objects
              events = data.canvasData;
            } else if (data.canvasData && typeof data.canvasData === 'object') {
              // Legacy format: object with events array or background
              if ('events' in data.canvasData && Array.isArray(data.canvasData.events)) {
                events = data.canvasData.events;
              }
              if ('background' in data.canvasData && data.canvasData.background) {
                setBackgroundColor(data.canvasData.background);
              }
            }
            
            // Process each drawing event
            const drawingEvents: DrawingEvent[] = [];
            
            events.forEach((event: DrawingEvent) => {
              if (event.type === 'background-color' && event.backgroundColor) {
                setBackgroundColor(event.backgroundColor);
              } else if (event.type === 'draw' || event.type === 'erase' || event.type === 'text') {
                // Add drawing events to the array
                drawingEvents.push(event);
              } else if (event.type === 'clear') {
                // Clear all drawing events up to this point
                drawingEvents.length = 0;
              } else if (event.type === 'undo' && drawingEvents.length > 0) {
                // Remove the last drawing event
                drawingEvents.pop();
              }
            });
            
            // Apply all accumulated drawing events
            setStrokes(drawingEvents);
          }
        });

      } catch (error) {

      }
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [canvasId, shareToken, onCollaboratorChange]);

  // Initialize canvas with responsive sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      // Set canvas size to fit viewport with some padding
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate available space (accounting for toolbars)
      const availableWidth = viewportWidth - 40; // 20px padding on each side
      const availableHeight = viewportHeight - 200; // Space for toolbars
      
      // Maintain aspect ratio but fit within screen
      const aspectRatio = 4/3; // 800x600 aspect ratio
      let canvasWidth, canvasHeight;
      
      if (availableWidth / availableHeight > aspectRatio) {
        // Height is the limiting factor
        canvasHeight = Math.max(400, availableHeight);
        canvasWidth = canvasHeight * aspectRatio;
      } else {
        // Width is the limiting factor  
        canvasWidth = Math.max(600, availableWidth);
        canvasHeight = canvasWidth / aspectRatio;
      }

      // Set canvas size with high DPI support
      const dpr = window.devicePixelRatio || 1;
      
      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      
      // Scale the canvas back down using CSS
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      canvas.style.backgroundColor = backgroundColor;
    };

    // Initial size
    updateCanvasSize();
    
    // Update on resize
    window.addEventListener('resize', updateCanvasSize);
    
    // Get context and scale it to account for device pixel ratio
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Set high-quality line rendering defaults
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Clear and set background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    }

    // Cleanup resize listener
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [backgroundColor]);

  // Removed zoom transforms - users rely on browser zoom

  // Adjust brush size when tool changes
  useEffect(() => {
    if (currentTool === 'pen') {
      setBrushWidth(penSize);
    } else if (currentTool === 'brush') {
      setBrushWidth(brushSize);
    } else if (currentTool === 'eraser') {
      setBrushWidth(brushSize); // Eraser uses brush size
    }
  }, [currentTool, penSize, brushSize]);

  // Update tool-specific sizes when brushWidth changes
  const handleSizeChange = useCallback((newSize: number) => {
    setBrushWidth(newSize);
    if (currentTool === 'pen') {
      setPenSize(newSize);
    } else if (currentTool === 'brush' || currentTool === 'eraser') {
      setBrushSize(newSize);
    }
  }, [currentTool]);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Simple coordinate calculation (no pan offset needed)
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    return {
      x: canvasX * (canvas.width / rect.width),
      y: canvasY * (canvas.height / rect.height)
    };
  }, []);

  // Enhanced touch support with pressure sensitivity
  const getTouchCanvasPoint = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return { x: 0, y: 0, pressure: 1.0 };

    const touch = e.touches[0];
    const canvasElement = e.currentTarget;
    
    // Get touch coordinates relative to the canvas element  
    const rect = canvasElement.getBoundingClientRect();
    const canvasX = touch.clientX - rect.left;
    const canvasY = touch.clientY - rect.top;
    
    // Scale from display size to canvas internal size
    const scaleX = canvas.width / canvasElement.clientWidth;
    const scaleY = canvas.height / canvasElement.clientHeight;
    
    const finalX = canvasX * scaleX;
    const finalY = canvasY * scaleY;
    
    // Get pressure (if available, otherwise default to 1.0)
    const pressure = (touch as unknown as { force?: number; pressure?: number }).force || 
                    (touch as unknown as { force?: number; pressure?: number }).pressure || 1.0;

    return {
      x: finalX,
      y: finalY,
      pressure: Math.max(0.1, Math.min(1.0, pressure)) // Clamp between 0.1 and 1.0
    };
  }, []); // No dependencies needed  // Add haptic feedback for tool changes (mobile only)
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Enhanced tool change with haptic feedback
  const handleToolChange = useCallback((newTool: 'pen' | 'brush' | 'eraser' | 'text') => {
    setCurrentTool(newTool);
    triggerHapticFeedback('light');
    
    // Update brush width based on tool
    if (newTool === 'pen') {
      setBrushWidth(penSize);
    } else if (newTool === 'brush' || newTool === 'eraser') {
      setBrushWidth(brushSize);
    }
  }, [penSize, brushSize, triggerHapticFeedback]);

  // Professional high-quality brush with superior smoothing and realistic texture
  const drawBrushStroke = useCallback((from: Point, to: Point, color: string, width: number, pressure = 1.0) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Maximum quality rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Calculate stroke dynamics
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const velocity = Math.min(distance / 8, 1.0);
    const steps = Math.max(3, Math.floor(distance / 0.8)); // Ultra-high resolution
    
    // Advanced brush rendering with multiple techniques
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      
      // Catmull-Rom spline interpolation for ultra-smooth curves
      const smoothT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = from.x + (to.x - from.x) * smoothT;
      const y = from.y + (to.y - from.y) * smoothT;
      
      // Sophisticated pressure dynamics
      const velocityInfluence = 0.8 + (1.0 - velocity) * 0.2;
      const positionVariation = 1.0 + Math.sin(t * Math.PI * 6) * 0.05; // Micro-variations
      const pressureVariation = 0.95 + Math.random() * 0.1; // Natural randomness
      const finalPressure = pressure * velocityInfluence * positionVariation * pressureVariation;
      const brushRadius = (width * finalPressure) / 2;
      
      // Multi-layer brush rendering for depth and texture
      
      // Layer 1: Core opacity with perfect blending
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(0.4, 0.2 + finalPressure * 0.2);
      
      const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, brushRadius);
      coreGradient.addColorStop(0, color);
      coreGradient.addColorStop(0.6, color);
      coreGradient.addColorStop(1, color + '00');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Layer 2: Texture layer with reduced opacity
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = Math.min(0.15, 0.08 + finalPressure * 0.07);
      
      const textureGradient = ctx.createRadialGradient(x, y, 0, x, y, brushRadius * 0.8);
      textureGradient.addColorStop(0, color);
      textureGradient.addColorStop(0.5, color);
      textureGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = textureGradient;
      ctx.beginPath();
      ctx.arc(x, y, brushRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Layer 3: High-fidelity bristle simulation
      const bristleCount = Math.max(4, Math.floor(brushRadius * 0.8));
      for (let j = 0; j < bristleCount; j++) {
        const bristleAngle = (j / bristleCount) * Math.PI * 2 + t * 0.1; // Slight rotation
        const bristleRadius = brushRadius * (0.15 + Math.random() * 0.25);
        const bristleDistance = brushRadius * (0.3 + Math.random() * 0.4);
        
        const bristleX = x + Math.cos(bristleAngle) * bristleDistance;
        const bristleY = y + Math.sin(bristleAngle) * bristleDistance;
        
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = (0.03 + Math.random() * 0.05) * finalPressure;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(bristleX, bristleY, Math.max(0.5, bristleRadius), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    // Ensure clean state reset
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }, []);

  const drawLine = useCallback((from: Point, to: Point, color: string, width: number, tool: string, erase = false, pressure = 1.0) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (erase) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      return;
    }

    if (tool === 'brush') {
      drawBrushStroke(from, to, color, width, pressure);
      return;
    }

    // Pen tool - clean, precise lines
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = tool === 'pen' ? Math.max(1, width * 0.7) : width;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1.0;
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, [drawBrushStroke]);

  const saveStroke = useCallback((event: DrawingEvent) => {
    setStrokes(prev => {
      const newStrokes = [...prev, event];
      return newStrokes;
    });
    
    // Emit to collaborators if socket is connected
    if (socket && socket.connected) {
      socket.emit('canvas-update', {
        canvasData: event,
        operation: event.type,
        timestamp: event.timestamp
      });
    }
  }, [socket, canvasId]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageData = canvas.toDataURL();
    setDrawingHistory(prev => {
      const newHistory = [...prev.slice(Math.max(0, prev.length - 19)), imageData]; // Keep last 20 states
      return newHistory;
    });
    setHistoryStep(prev => prev + 1);
  }, []);

  const undo = useCallback(() => {
    if (historyStep > 0 && drawingHistory.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;
      
      setHistoryStep(prev => prev - 1);
      
      if (historyStep > 1) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = drawingHistory[historyStep - 2];
      } else {
        // First undo - clear canvas and set background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Remove last stroke from strokes array
      setStrokes(prev => prev.slice(0, -1));
    }
  }, [historyStep, drawingHistory, backgroundColor]);

  const redo = useCallback(() => {
    if (historyStep < drawingHistory.length) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = drawingHistory[historyStep];
      setHistoryStep(prev => prev + 1);
    }
  }, [historyStep, drawingHistory]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all strokes
    strokes.forEach(stroke => {
      if (stroke.type === 'draw' || stroke.type === 'erase') {
        if (stroke.points && stroke.points.length >= 2) {
          for (let i = 1; i < stroke.points.length; i++) {
            drawLine(
              stroke.points[i - 1],
              stroke.points[i],
              stroke.color || '#000000',
              stroke.width || 3,
              stroke.tool || 'brush',
              stroke.type === 'erase'
            );
          }
        }
      } else if (stroke.type === 'text') {
        if (stroke.position && stroke.text) {
          ctx.fillStyle = stroke.color || '#000000';
          ctx.font = '16px Arial';
          ctx.fillText(stroke.text, stroke.position.x, stroke.position.y);
        }
      } else if (stroke.type === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
  }, [strokes, drawLine, backgroundColor]);

  // Mouse event handlers with collaboration support
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    
    if (currentTool === 'text') {
      setTextInput({ x: point.x, y: point.y, text: '', active: true });
      return;
    }
    
    setIsDrawing(true);
    setLastPoint(point);
    saveToHistory(); // Save state before drawing
  }, [getCanvasPoint, currentTool, saveToHistory]);

  const handleTextSubmit = useCallback((text: string) => {
    if (!text.trim()) {
      setTextInput({ x: 0, y: 0, text: '', active: false });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Draw text immediately
    ctx.fillStyle = brushColor;
    ctx.font = '16px Arial';
    ctx.fillText(text, textInput.x, textInput.y);

    // Save text event
    const textEvent: DrawingEvent = {
      type: 'text',
      position: { x: textInput.x, y: textInput.y },
      text: text,
      color: brushColor,
      timestamp: Date.now()
    };

    saveStroke(textEvent);
    setTextInput({ x: 0, y: 0, text: '', active: false });
  }, [textInput, brushColor, saveStroke]);

  // Share functionality
  const generateShareLink = useCallback(async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Call the short links API to generate a short code
      const response = await fetch('/api/short-links/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ canvasId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create short link');
      }
      
      const shortLinkData = await response.json();
      
      setShareData({
        shareUrl: shortLinkData.shortUrl,
        shareToken: shortLinkData.shortCode,
        expiresAt: shortLinkData.expiresAt,
        fullUrl: shortLinkData.fullUrl, // Keep the full URL as backup
        accessCount: shortLinkData.accessCount
      });
      
    } catch (error) {
      console.error('Error generating short link:', error);
      // Fallback to the old method if API fails
      const shareToken = canvasId;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const shareUrl = `${window.location.origin}/canvas/shared/${shareToken}`;
      
      setShareData({
        shareUrl,
        shareToken,
        expiresAt
      });
    }
  }, [canvasId]);

  // Calendar functionality
  const scheduleSession = useCallback(async () => {
    try {
      const session: CanvasSession = {
        id: Math.random().toString(36).substring(2, 15),
        title: sessionForm.title,
        description: sessionForm.description,
        scheduledDate: `${sessionForm.scheduledDate}T${sessionForm.scheduledTime}`,
        duration: sessionForm.duration,
        collaborators: sessionForm.collaborators.split(',').map(email => email.trim()),
        canvasId,
        createdAt: new Date().toISOString()
      };
      
      setScheduledSessions(prev => [...prev, session]);
      setShowCalendarModal(false);
      setSessionForm({
        title: '',
        description: '',
        scheduledDate: '',
        scheduledTime: '',
        duration: 60,
        collaborators: ''
      });
    } catch (error) {

    }
  }, [sessionForm, canvasId]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    
    // Emit cursor position to collaborators
    if (socket && socket.connected) {
      socket.emit('cursor-move', { x: point.x, y: point.y, canvasId });
    }
    
    if (!isDrawing || !lastPoint) return;
    
    // Draw immediately for visual feedback (mouse has default pressure of 1.0)
    drawLine(lastPoint, point, brushColor, brushWidth, currentTool, currentTool === 'eraser', 1.0);
    
    // Save stroke data
    const strokeEvent: DrawingEvent = {
      type: currentTool === 'eraser' ? 'erase' : 'draw',
      points: [lastPoint, point],
      color: brushColor,
      width: brushWidth,
      tool: currentTool,
      timestamp: Date.now()
    };
    
    saveStroke(strokeEvent);
    setLastPoint(point);
  }, [isDrawing, lastPoint, getCanvasPoint, drawLine, brushColor, brushWidth, currentTool, saveStroke, socket]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  // Handle username submission for guest users
  const handleUsernameSubmit = useCallback((username: string) => {
    const trimmedName = username.trim();
    const finalName = trimmedName.length > 0 && trimmedName.length <= 9 ? trimmedName : '';
    
    setGuestName(finalName);
    setShowGuestDialog(false);
    
    if (socket) {
      socket.emit('user-identify', {
        guestName: finalName,
        guestIdentifier: socket.id,
        canvasId,
        isAuthenticated: false
      });
      // Join canvas room after identifying
      socket.emit('join-canvas', canvasId);
    }
  }, [socket, canvasId]);

  // Touch handlers for drawing only (pan removed - use browser zoom instead)
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      // Single finger - drawing mode only
      const point = getTouchCanvasPoint(e);
      
      if (currentTool === 'text') {
        setTextInput({ x: point.x, y: point.y, text: '', active: true });
        return;
      }
      
      setIsDrawing(true);
      setLastPoint(point);
      saveToHistory(); // Save state before drawing
    }
    // Multi-touch is now handled by browser for zooming
  }, [getTouchCanvasPoint, currentTool, saveToHistory]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDrawing) {
      // Single finger - drawing mode only
      const pointData = getTouchCanvasPoint(e);
      const point = { x: pointData.x, y: pointData.y };
      
      // Emit cursor position to collaborators
      if (socket && socket.connected) {
        socket.emit('cursor-move', { x: point.x, y: point.y, canvasId });
      }
      
      if (!lastPoint) return;
      
      // Draw immediately for visual feedback with pressure sensitivity
      drawLine(lastPoint, point, brushColor, brushWidth, currentTool, currentTool === 'eraser', pointData.pressure);
      
      // Save stroke data
      const strokeEvent: DrawingEvent = {
        type: currentTool === 'eraser' ? 'erase' : 'draw',
        points: [lastPoint, point],
        color: brushColor,
        width: brushWidth,
        tool: currentTool,
        timestamp: Date.now()
      };
      
      saveStroke(strokeEvent);
      setLastPoint(point);
    }
    // Multi-touch handled by browser for zooming
  }, [isDrawing, lastPoint, getTouchCanvasPoint, drawLine, brushColor, brushWidth, currentTool, saveStroke, socket, canvasId]);

  const handleTouchEnd = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    
    const clearEvent: DrawingEvent = {
      type: 'clear',
      timestamp: Date.now()
    };
    saveStroke(clearEvent);
  }, [saveStroke]);

  // Load all saved drawings from localStorage and database
  const loadAllDrawings = useCallback(async () => {

    const localDrawings: SavedDrawing[] = [];
    const dbDrawings: SavedDrawing[] = [];

    // Load from localStorage
    const saved = localStorage.getItem('canvas-drawings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        localDrawings.push(...parsed);

      } catch (error) {

      }
    }

    // Load from database if user is logged in
    if (user) {
      try {

        const response = await fetch('/api/files?type=image/png', {
          credentials: 'include'
        });
        if (response.ok) {
          const filesResponse = await response.json();

          
          // Handle both array and object responses
          const files = Array.isArray(filesResponse) ? filesResponse : (filesResponse.files || []);
          
          const canvasFiles = files.filter((file: any) => 
            file.type === 'image/png' && 
            file.tags && 
            file.tags.includes('canvas')
          );

          // If no files with 'canvas' tag, try a broader filter for PNG files
          if (canvasFiles.length === 0) {
            const pngFiles = files.filter((file: any) => 
              file.type === 'image/png' || 
              (file.name && file.name.toLowerCase().endsWith('.png'))
            );

            
            // Use PNG files as canvas files for now
            for (const file of pngFiles) {
              try {
                dbDrawings.push({
                  id: `db-${file.id}`,
                  name: file.name.replace('.png', ''),
                  data: file.url, // Use the S3 URL directly for images
                  timestamp: new Date(file.uploadedAt).getTime(),
                  fileRecordId: file.id,
                  isLocal: false
                });

              } catch (error) {

              }
            }
          } else {
            // Use the properly tagged canvas files
            for (const file of canvasFiles) {
              try {
                dbDrawings.push({
                  id: `db-${file.id}`,
                  name: file.name.replace('.png', ''),
                  data: file.url, // Use the S3 URL directly for images
                  timestamp: new Date(file.uploadedAt).getTime(),
                  fileRecordId: file.id,
                  isLocal: false
                });

              } catch (error) {

              }
            }
          }
        } else {

        }
      } catch (error) {

      }
    }

    // Combine and sort by timestamp (newest first)
    const allDrawings = [...localDrawings, ...dbDrawings]
      .sort((a, b) => b.timestamp - a.timestamp);
    

    setSavedDrawings(allDrawings);
  }, [user, setSavedDrawings]);

  // Load all drawings on component mount
  useEffect(() => {
    loadAllDrawings();
  }, [loadAllDrawings]);

  // Save drawing function
  const saveDrawing = useCallback(async () => {
    if (!canvasRef.current || !currentDrawingName.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    
    try {
      const canvas = canvasRef.current;
      const canvasData = canvas.toDataURL('image/png');
      const timestamp = Date.now();
      const drawingId = timestamp.toString();
      
      const newDrawing: SavedDrawing = {
        id: drawingId,
        name: currentDrawingName.trim(),
        data: canvasData,
        timestamp,
        isLocal: !user // Mark as local-only if user is not logged in
      };

      // Always save to localStorage for offline access
      const localDrawings = [...savedDrawings.filter(d => d.isLocal), newDrawing];
      localStorage.setItem('canvas-drawings', JSON.stringify(localDrawings));

      // Save to database if user is logged in
      if (user) {
        try {
          // Convert canvas to blob
          const response = await fetch(canvasData);
          const blob = await response.blob();
          const fileName = `${currentDrawingName.trim()}_${timestamp}.png`;
          
          // Create a file to upload
          const file = new File([blob], fileName, { type: 'image/png' });
          
          // Upload to S3 using the same pattern as FileUpload
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await fetch('/api/s3/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            
            // Create file record in database
            const fileData = {
              name: fileName,
              originalName: fileName,
              type: 'image/png',
              size: blob.size,
              url: uploadData.url,
              s3Key: uploadData.key,
              tags: ['canvas', 'drawing'],
            };



            const fileResponse = await fetch('/api/files/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(fileData),
            });

            if (fileResponse.ok) {
              const savedFile = await fileResponse.json();
              
              // Update the drawing with database info
              newDrawing.fileRecordId = savedFile.id;
              newDrawing.isLocal = false;
              newDrawing.id = `db-${savedFile.id}`;
              

            } else {
              throw new Error('Failed to create file record');
            }
          } else {
            throw new Error('S3 upload failed');
          }
        } catch (dbError) {

          // Keep the local version even if database save failed
        }
      }

      // Update state with new drawing
      setSavedDrawings(prev => [newDrawing, ...prev.filter(d => d.id !== drawingId)]);
      setCurrentDrawingName("");
      setShowSaveDialog(false);
      
      const message = user 
        ? `"${newDrawing.name}" saved successfully!` 
        : `"${newDrawing.name}" saved locally (login to save to cloud)!`;
      setSaveSuccess(message);
      
      // Refresh the drawings list to get the latest from database
      if (user) {
        setTimeout(() => loadAllDrawings(), 1000); // Give the server a moment to process
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {

      setSaveError('Failed to save drawing. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [canvasRef, currentDrawingName, user, savedDrawings, setSavedDrawings, setIsSaving, setSaveError, setSaveSuccess, setCurrentDrawingName, setShowSaveDialog]);

  // Load drawing function
  const loadDrawing = useCallback(async (drawing: SavedDrawing) => {
    if (!canvasRef.current) return;
    setIsLoading(true);
    setLoadError(null);
    setLoadSuccess(null);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setLoadError('Unable to access canvas context');
        return;
      }

      // Handle different data formats for backward compatibility
      const imageData = drawing.data;
      
      // Check if the data is a valid image source
      if (!imageData || (typeof imageData !== 'string')) {
        setLoadError('Invalid drawing data format.');
        return;
      }

      // If the data doesn't start with "data:" and isn't a URL, it might be old JSON format
      if (!imageData.startsWith('data:') && !imageData.startsWith('http')) {
        setLoadError('This drawing uses an old format that cannot be loaded. Please save a new drawing.');
        return;
      }

      const img = new Image();
      // Enable CORS for loading images from S3
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Clear canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the loaded image
        ctx.drawImage(img, 0, 0);
        setShowLoadDialog(false);
        setLoadSuccess(`"${drawing.name}" loaded successfully!`);
        setIsLoading(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setLoadSuccess(null), 3000);
      };
      img.onerror = (error) => {

        setLoadError('Failed to load image data. The drawing may be corrupted.');
        setIsLoading(false);
      };
      
      img.src = imageData;
    } catch (error) {

      setLoadError('Failed to load drawing. Please try again.');
      setIsLoading(false);
    }
  }, [canvasRef, setIsLoading, setLoadError, setLoadSuccess, setShowLoadDialog]);

  // Delete drawing function
  const deleteDrawing = useCallback((drawingId: string) => {
    const drawingToDelete = savedDrawings.find(d => d.id === drawingId);
    const updatedDrawings = savedDrawings.filter(d => d.id !== drawingId);
    setSavedDrawings(updatedDrawings);
    localStorage.setItem('canvas-drawings', JSON.stringify(updatedDrawings));
    
    if (drawingToDelete) {

    }
  }, [savedDrawings, setSavedDrawings]);

  // Export canvas as image
  const exportAsImage = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `canvas-drawing-${Date.now()}.png`;
      link.href = imageData;
      link.click();

    } catch (error) {

    } finally {
      setIsExporting(false);
    }
  }, [canvasRef, setIsExporting]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Mobile Toolbar Toggle Button */}
      <div className="md:hidden bg-gray-800 border-b border-gray-700 p-2 flex justify-between items-center">
        <span className="text-sm font-medium">Canvas Tools</span>
        <button
          onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title={isToolbarCollapsed ? "Show Toolbar" : "Hide Toolbar"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isToolbarCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            )}
          </svg>
        </button>
      </div>
      
      {/* Toolbar */}
      <div className={`bg-gray-800 border-b border-gray-700 ${isToolbarCollapsed ? 'md:block hidden' : 'block'}`}>
        {/* Top Row - Connection Status and Actions */}
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
              {collaborators.size > 0 && (
                <span className="text-xs text-gray-400">
                  ({collaborators.size} collaborator{collaborators.size !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>

          {/* Share and Calendar Actions - Only for owners/collaborators */}
          <div className="flex items-center space-x-2">
            {/* User type indicator for visitors */}
            {userType === 'visitor' && (
              <span className="text-xs text-orange-400 bg-orange-900/30 px-2 py-1 rounded">
                Visitor Mode
              </span>
            )}
            
            {permissions.canShare && (
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded flex items-center space-x-1"
                title="Share Canvas"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                <span className="text-sm hidden md:inline">Share</span>
              </button>
            )}
            
            {permissions.canSchedule && (
              <button
                onClick={() => setShowCalendarModal(true)}
                className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded flex items-center space-x-1"
                title="Schedule Session"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="text-sm hidden md:inline">Schedule</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row - Tools and Controls */}
        <div className="flex flex-wrap items-center p-2 gap-2">
          {/* Tools */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleToolChange('pen')}
              className={`p-2 rounded ${currentTool === 'pen' ? 'bg-blue-600' : 'bg-gray-700'}`}
              title="Pen - Precise lines"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => handleToolChange('brush')}
              className={`p-2 rounded ${currentTool === 'brush' ? 'bg-blue-600' : 'bg-gray-700'}`}
              title="Brush - Artistic strokes with pressure"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.5 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 4a4 4 0 11-8 0 4 4 0 018 0zM16 14a2 2 0 11-4 0 2 2 0 014 0z"/>
                <path d="M8.5 8.5L11 6 16 11l-2.5 2.5L8.5 8.5z"/>
              </svg>
            </button>
            <button
              onClick={() => handleToolChange('eraser')}
              className={`p-2 rounded ${currentTool === 'eraser' ? 'bg-blue-600' : 'bg-gray-700'}`}
              title="Eraser"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.707 3.293a1 1 0 010 1.414L5.414 8l3.293 3.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0zM11.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 8l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => handleToolChange('text')}
              className={`p-2 rounded ${currentTool === 'text' ? 'bg-blue-600' : 'bg-gray-700'}`}
              title="Text"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v2H7V5zm6 4H7v2h6V9zm-6 4h6v2H7v-2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Color picker */}
          <div className="flex items-center space-x-2">
            <span className="text-xs">Color:</span>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer"
              title="Brush Color"
            />
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              title="Color Presets"
            >
              ▼
            </button>
          </div>

          {/* Background Color - Hidden for visitors */}
          {permissions.canChangeBackground && (
            <div className="flex items-center space-x-2">
              <span className="text-xs">BG:</span>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setBackgroundColor(newColor);
                  redrawCanvas();
                  
                  // Broadcast background color change to all collaborators
                  if (socket && socket.connected) {
                    const backgroundEvent: DrawingEvent = {
                      type: 'background-color',
                      backgroundColor: newColor,
                      timestamp: Date.now()
                    };
                    socket.emit('canvas-update', { 
                      canvasData: backgroundEvent, 
                      canvasId,
                      operation: 'background-color' 
                    });
                  }
                }}
                className="w-6 h-6 rounded cursor-pointer"
                title="Background Color"
              />
              <button
                onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                title="Background Presets"
              >
                ▼
              </button>
            </div>
          )}

          {/* Size controls */}
          <div className="flex items-center space-x-2">
            <span className="text-xs">Size:</span>
            <input
              type="range"
              min={currentTool === 'pen' ? '1' : '3'}
              max={currentTool === 'pen' ? '10' : '30'}
              value={brushWidth}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="w-16"
            />
            <span className="text-xs w-6">{brushWidth}</span>
          </div>

          {/* Zoom controls removed - users can use browser zoom (Ctrl+scroll or pinch) */}

          {/* Clear button - Hidden for visitors */}
          {permissions.canClear && (
            <button
              onClick={clearCanvas}
              className="p-2 bg-red-600 hover:bg-red-700 rounded"
              title="Clear Canvas"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Undo/Redo buttons - Hidden for visitors */}
          {(permissions.canUndo || permissions.canRedo) && (
            <div className="flex items-center space-x-1">
              {permissions.canUndo && (
                <button
                  onClick={undo}
                  disabled={historyStep <= 0}
                  className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 rounded"
                  title="Undo"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              {permissions.canRedo && (
                <button
                  onClick={redo}
                  disabled={historyStep >= drawingHistory.length}
                  className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 rounded"
                  title="Redo"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Save/Load/Export buttons */}
          <div className="flex items-center space-x-1">
            {permissions.canSave && (
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={isSaving}
                className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 rounded"
                title="Save Drawing"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z" />
                  <path d="M5 3a2 2 0 00-2 2v1a1 1 0 002 0V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 102 0V5a2 2 0 00-2-2H5z" />
                </svg>
              </button>
            )}
            {permissions.canLoad && (
              <button
                onClick={() => setShowLoadDialog(true)}
                disabled={isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 rounded"
                title="Load Drawing"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </button>
            )}
            {permissions.canExport && (
              <button
                onClick={exportAsImage}
                disabled={isExporting}
                className="p-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 rounded"
                title="Export as Image"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Color Picker Modal */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-4 z-20 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg color-picker-modal"
          >
            <h3 className="text-sm font-semibold mb-3">Brush Color Presets</h3>
            <div className="grid grid-cols-6 gap-2">
              {BRUSH_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setBrushColor(color);
                    setShowColorPicker(false);
                  }}
                  className={`w-8 h-8 rounded border-2 ${
                    brushColor === color ? 'border-white' : 'border-gray-500'
                  } hover:border-white transition-colors`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Color Picker Modal */}
      <AnimatePresence>
        {showBackgroundPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-64 z-20 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg color-picker-modal"
          >
            <h3 className="text-sm font-semibold mb-3">Background Color Presets</h3>
            <div className="grid grid-cols-4 gap-2">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setBackgroundColor(color);
                    setShowBackgroundPicker(false);
                    redrawCanvas();
                    
                    // Broadcast background color change to all collaborators
                    if (socket && socket.connected) {
                      const backgroundEvent: DrawingEvent = {
                        type: 'background-color',
                        backgroundColor: color,
                        timestamp: Date.now()
                      };
                      socket.emit('canvas-update', { 
                        canvasData: backgroundEvent, 
                        canvasId,
                        operation: 'background-color' 
                      });
                    }
                  }}
                  className={`w-8 h-8 rounded border-2 ${
                    backgroundColor === color ? 'border-white' : 'border-gray-500'
                  } hover:border-white transition-colors`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Input Modal */}
      <AnimatePresence>
        {textInput.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          >
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Add Text</h3>
              <input
                type="text"
                value={textInput.text}
                onChange={(e) => setTextInput(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Enter text to add to canvas..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSubmit(textInput.text);
                  } else if (e.key === 'Escape') {
                    setTextInput({ x: 0, y: 0, text: '', active: false });
                  }
                }}
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setTextInput({ x: 0, y: 0, text: '', active: false })}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTextSubmit(textInput.text)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
                >
                  Add Text
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          >
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Share Canvas</h3>
              
              {shareData.shareUrl ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Share URL:</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={shareData.shareUrl}
                        readOnly
                        className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-l text-white text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(shareData.shareUrl)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-r"
                        title="Copy to clipboard"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Link expires: {new Date(shareData.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Generate a shareable link for this canvas</p>
                  <button
                    onClick={generateShareLink}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded"
                  >
                    Generate Share Link
                  </button>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          >
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Schedule Canvas Session</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Session Title</label>
                  <input
                    type="text"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Team Brainstorming Session"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={sessionForm.description}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the session..."
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white h-20"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={sessionForm.scheduledDate}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Time</label>
                    <input
                      type="time"
                      value={sessionForm.scheduledTime}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={sessionForm.duration}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    min="15"
                    max="480"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Collaborators (emails, comma-separated)</label>
                  <input
                    type="text"
                    value={sessionForm.collaborators}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, collaborators: e.target.value }))}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={scheduleSession}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded"
                  disabled={!sessionForm.title || !sessionForm.scheduledDate || !sessionForm.scheduledTime}
                >
                  Schedule Session
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-900 overflow-hidden">
        <div className="relative border border-gray-600 rounded-lg shadow-lg">
          <div className="flex items-center justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              className="cursor-crosshair"
              style={{ 
                display: 'block', 
                touchAction: 'pinch-zoom',  // Allow browser zoom but prevent default pan
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
          </div>
          
          {/* Collaborative Cursors */}
          {Array.from(collaborators.entries()).map(([id, collaborator]) => (
            <div
              key={id}
              className="absolute pointer-events-none z-10"
              style={{
                left: collaborator.cursor.x,
                top: collaborator.cursor.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                <div className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded shadow-lg whitespace-nowrap">
                  {collaborator.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Mobile Toolbar (when main toolbar is collapsed) */}
      {isToolbarCollapsed && (
        <div className="md:hidden fixed bottom-4 right-4 z-40">
          <div className="flex flex-col space-y-2">
            {/* Tool Selection */}
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-2 flex space-x-2">
              <button
                onClick={() => handleToolChange('pen')}
                className={`p-2 rounded ${currentTool === 'pen' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                title="Pen"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => handleToolChange('brush')}
                className={`p-2 rounded ${currentTool === 'brush' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                title="Brush"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.5 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 4a4 4 0 11-8 0 4 4 0 018 0zM16 14a2 2 0 11-4 0 2 2 0 014 0z"/>
                  <path d="M8.5 8.5L11 6 16 11l-2.5 2.5L8.5 8.5z"/>
                </svg>
              </button>
              <button
                onClick={() => handleToolChange('eraser')}
                className={`p-2 rounded ${currentTool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                title="Eraser"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.707 3.293a1 1 0 010 1.414L5.414 8l3.293 3.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0zM11.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 8l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Color and Size */}
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-2 flex items-center space-x-2">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
                title="Color"
              />
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-300">Size:</span>
                <span className="text-xs w-6 text-center">{brushWidth}</span>
              </div>
            </div>
            
            {/* Expand Toolbar Button */}
            <button
              onClick={() => setIsToolbarCollapsed(false)}
              className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              title="Show Full Toolbar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            className="bg-slate-800 border border-purple-500/20 rounded-xl p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold text-purple-300 mb-4">Save Drawing</h3>
            
            {/* Success Message */}
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-900/50 border border-green-500/50 text-green-200 rounded-lg text-sm"
              >
                {saveSuccess}
              </motion.div>
            )}
            
            {/* Error Message */}
            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg text-sm"
              >
                {saveError}
                <button
                  onClick={() => setSaveError(null)}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </motion.div>
            )}
            
            {/* Saving Progress */}
            {isSaving && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <InlineLoading 
                  size="sm" 
                  speed="fast" 
                  text="Saving drawing..."
                />
              </motion.div>
            )}
            
            <input
              type="text"
              value={currentDrawingName}
              onChange={(e) => setCurrentDrawingName(e.target.value)}
              placeholder="Enter drawing name..."
              className="w-full px-4 py-2 bg-slate-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentDrawingName.trim()) {
                  saveDrawing();
                }
                if (e.key === 'Escape') {
                  setShowSaveDialog(false);
                  setCurrentDrawingName("");
                }
              }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setCurrentDrawingName("");
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDrawing}
                disabled={!currentDrawingName.trim() || isSaving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors min-w-[80px] flex items-center justify-center"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            className="bg-slate-800 border border-purple-500/20 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-300">Load Drawing</h3>
              <button
                onClick={() => setShowLoadDialog(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Success Message */}
            {loadSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-900/50 border border-green-500/50 text-green-200 rounded-lg text-sm"
              >
                {loadSuccess}
              </motion.div>
            )}
            
            {/* Error Message */}
            {loadError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg text-sm"
              >
                {loadError}
                <button
                  onClick={() => setLoadError(null)}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </motion.div>
            )}

            {/* Loading Progress */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <InlineLoading 
                  size="sm" 
                  speed="fast" 
                  text="Loading drawing..."
                />
              </motion.div>
            )}

            {/* Drawings List */}
            <div className="max-h-96 overflow-y-auto">
              {savedDrawings.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p>No saved drawings found</p>
                  <p className="text-sm mt-1">Start creating and save your first drawing!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedDrawings.map((drawing) => (
                    <motion.div
                      key={drawing.id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 border border-purple-500/20 rounded-lg hover:bg-slate-700/70 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{drawing.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>{new Date(drawing.timestamp).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(drawing.timestamp).toLocaleTimeString()}</span>
                          {drawing.isLocal && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-400">Local only</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadDrawing(drawing)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                        >
                          {isLoading ? 'Loading...' : 'Load'}
                        </button>
                        <button
                          onClick={() => deleteDrawing(drawing.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Username Dialog for Guest Users */}
      {showGuestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Join Canvas</h2>
            <p className="text-gray-300 text-sm mb-4">
              Enter your name to join this collaborative canvas (optional, max 9 characters):
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const username = (formData.get('username') as string) || '';
                handleUsernameSubmit(username);
              }}
            >
              <input
                type="text"
                name="username"
                placeholder="Your name (optional)"
                maxLength={9}
                className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
                autoFocus
              />
              <div className="flex space-x-3 justify-end">
                <button
                  type="button"
                  onClick={() => handleUsernameSubmit('')}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Join as Visitor
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Join
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeCanvas;