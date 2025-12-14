import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from "react-oidc-context";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const auth = useAuth();
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const socketRef = useRef(null);

    const userId = auth.user?.profile?.sub;
    const token = auth.user?.access_token;

    useEffect(() => {

        if (!userId || !auth.isAuthenticated || !token) return;

        if (socketRef.current &&
            (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        if (socketRef.current) {
            socketRef.current.close();
        }

        const wsBaseUrl = process.env.REACT_APP_WEBSOCKET_URL || "ws://localhost:8087/ws/messages";
        const socketUrl = `${wsBaseUrl}/${userId}?access_token=${token}`;

        console.log("Connecting to WebSocket...");
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket Connected!");
        };

        socket.onmessage = (event) => {
            try {
                const messageData = event.data;
                console.log("Notification:", messageData);

                const messageEvent = JSON.parse(messageData);

                if (String(messageEvent.receiverId) === String(userId)) {
                    console.log("New message detected! Updating state...");
                    setHasNewMessages(prev => true);
                }
            } catch (err) {
                console.error("Error parsing WS message:", err);
            }
        };

        socket.onerror = (error) => console.error("WS Error:", error);

        socket.onclose = () => {
            socketRef.current = null;
        };

        return () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
            socketRef.current = null;
        };
    }, [userId, auth.isAuthenticated, token]);

    const clearNotifications = () => {
        setHasNewMessages(false);
    };

    return (
        <NotificationContext.Provider value={{ hasNewMessages, clearNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
