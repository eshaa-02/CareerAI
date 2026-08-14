'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { Notification } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  notifications: Notification[];
  unreadCount: number;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  'http://localhost:5000';

export function SocketProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?._id) {
      setConnected(false);

      if (socket) {
        socket.disconnect();
        setSocket(null);
      }

      return;
    }

    const token =
      Cookies.get('token') ||
      localStorage.getItem('token');

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token,
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);

      setConnected(true);

      // Join user's personal room
      newSocket.emit('join_user', user._id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Notifications
    newSocket.on(
      'notification:new',
      (notification: Notification) => {
        setNotifications((prev) => [
          notification,
          ...prev,
        ]);

        setUnreadCount((prev) => prev + 1);

        toast(notification.title, {
          icon: '🔔',
        });
      }
    );

    setSocket(newSocket);

    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        unreadCount,
        setNotifications,
        setUnreadCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      'useSocket must be used within SocketProvider'
    );
  }

  return context;
}