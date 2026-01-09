// test/mocks/socketMock.ts
// Mock Socket.io server and client for testing

import { EventEmitter } from 'events';
import sinon from 'sinon';

/**
 * Mock Socket.io server
 */
export class MockSocketIOServer extends EventEmitter {
  public sockets: Map<string, MockSocket> = new Map();
  public events: Array<{ event: string; data: any }> = [];

  constructor() {
    super();
  }

  // Mock server methods
  to(room: string) {
    return {
      emit: (event: string, data: any) => {
        // Emit to all sockets in the room
        this.sockets.forEach((socket) => {
          if (socket.rooms.has(room)) {
            socket.emit(event, data);
          }
        });
      },
    };
  }

  emit(event: string, data: any) {
    this.events.push({ event, data });
    super.emit(event, data);
  }

  // Mock socket connection
  on(event: 'connection', callback: (socket: MockSocket) => void) {
    super.on(event, callback);
    return this;
  }

  // Create a mock socket
  createMockSocket(id: string = `socket-${Date.now()}`): MockSocket {
    const socket = new MockSocket(id, this);
    this.sockets.set(id, socket);
    this.emit('connection', socket);
    return socket;
  }

  // Get all events emitted
  getEmittedEvents(): Array<{ event: string; data: any }> {
    return [...this.events];
  }

  // Clear all events
  clearEvents(): void {
    this.events = [];
  }
}

/**
 * Mock Socket.io client socket
 */
export class MockSocket extends EventEmitter {
  public id: string;
  public rooms: Set<string> = new Set();
  public server: MockSocketIOServer;
  public connected: boolean = true;
  public disconnected: boolean = false;
  public handshake: any = {
    headers: {},
    query: {},
    auth: {},
  };

  constructor(id: string, server: MockSocketIOServer) {
    super();
    this.id = id;
    this.server = server;
    this.rooms.add(id); // Socket is always in its own room
  }

  // Mock socket methods
  join(room: string) {
    this.rooms.add(room);
    return this;
  }

  leave(room: string) {
    this.rooms.delete(room);
    return this;
  }

  to(room: string) {
    return {
      emit: (event: string, data: any) => {
        this.server.to(room).emit(event, data);
      },
    };
  }

  emit(event: string, data: any) {
    super.emit(event, data);
    return this;
  }

  disconnect() {
    this.connected = false;
    this.disconnected = true;
    this.server.sockets.delete(this.id);
    this.emit('disconnect', 'Client disconnected');
    return this;
  }

  broadcast: {
    to: (room: string) => {
      emit: (event: string, data: any) => void;
    };
    emit: (event: string, data: any) => void;
  } = {
    to: (room: string) => ({
      emit: (event: string, data: any) => {
        // Emit to all sockets in room except this one
        this.server.sockets.forEach((socket) => {
          if (socket.id !== this.id && socket.rooms.has(room)) {
            socket.emit(event, data);
          }
        });
      },
    }),
    emit: (event: string, data: any) => {
      // Emit to all sockets except this one
      this.server.sockets.forEach((socket) => {
        if (socket.id !== this.id) {
          socket.emit(event, data);
        }
      });
    },
  };
}

/**
 * Create a mock Socket.io server
 */
export const createMockSocketIOServer = (): MockSocketIOServer => {
  return new MockSocketIOServer();
};

/**
 * Create a mock Socket.io client
 */
export const createMockSocketClient = (server: MockSocketIOServer, id?: string): MockSocket => {
  return server.createMockSocket(id);
};

/**
 * Helper to wait for a socket event
 */
export const waitForSocketEvent = (
  socket: MockSocket,
  event: string,
  timeout: number = 5000
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};
