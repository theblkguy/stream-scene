// Essential types that don't depend on ContentScheduler
export interface ProjectFile {
  id: number;
  name: string;
  type: string;
  size: number;
  url: string;
  projectId: number;
  uploadedAt: string;
  thumbnailUrl?: string;
  metadata?: {
    duration?: number;
    resolution?: string;
    [key: string]: unknown;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  description?: string;
  type: 'task' | 'event' | 'reminder';
  priority?: 'low' | 'medium' | 'high';
}