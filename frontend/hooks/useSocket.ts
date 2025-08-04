import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../lib/store/useAuthStore';
import { useBoardStore } from '../lib/store/useBoardStore';

interface SocketMessage {
  type: string;
  data: any;
}

export const useSocket = (boardId?: string) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { user } = useAuthStore();
  const { optimisticUpdateTask, optimisticMoveTask, optimisticDeleteTask } = useBoardStore();

  useEffect(() => {
    if (!user || !boardId) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/${token}`;
    
    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        setError(null);
        
        // Subscribe to board updates
        socket.send(JSON.stringify({
          type: 'subscribe_board',
          board_id: boardId
        }));
      };

      socket.onmessage = (event) => {
        try {
          const message: SocketMessage = JSON.parse(event.data);
          handleSocketMessage(message);
        } catch (err) {
          console.error('Error parsing socket message:', err);
        }
      };

      socket.onclose = () => {
        setConnected(false);
      };

      socket.onerror = (error) => {
        setError('WebSocket connection failed');
        setConnected(false);
      };

    } catch (err) {
      setError('Failed to create WebSocket connection');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user, boardId]);

  const handleSocketMessage = (message: SocketMessage) => {
    switch (message.type) {
      case 'task_created':
        // Task was created by another user
        if (message.data.task) {
          useBoardStore.getState().fetchBoard(boardId!);
        }
        break;
        
      case 'task_updated':
        // Task was updated by another user
        if (message.data.task) {
          optimisticUpdateTask(message.data.task.id, message.data.task);
        }
        break;
        
      case 'task_moved':
        // Task was moved by another user
        if (message.data.task) {
          optimisticUpdateTask(message.data.task.id, {
            column_id: message.data.task.column_id,
            position: message.data.task.position,
            status: message.data.task.status
          });
        }
        break;
        
      case 'task_deleted':
        // Task was deleted by another user
        if (message.data.task_id) {
          optimisticDeleteTask(message.data.task_id);
        }
        break;
        
      case 'board_updated':
        // Board was updated, refresh
        useBoardStore.getState().fetchBoard(boardId!);
        break;
        
      default:
        console.log('Unknown socket message type:', message.type);
    }
  };

  const sendMessage = (message: SocketMessage) => {
    if (socketRef.current && connected) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  return {
    connected,
    error,
    sendMessage
  };
};