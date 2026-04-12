// import { useState, useEffect, useCallback } from 'react';
// import { messagesApi } from '../api/index.js';
// import { getSocket } from './useSocket.js';

// export function useChat(groupId, token) {
//   const [messages, setMessages]   = useState([]);
//   const [loading, setLoading]     = useState(true);
//   const [sending, setSending]     = useState(false);
//   const [error, setError]         = useState(null);

//   // Initial load
//   useEffect(() => {
//     if (!groupId) return;
//     setLoading(true);
//     messagesApi.list(groupId)
//       .then(msgs => { setMessages(msgs); setLoading(false); })
//       .catch(err  => { setError(err.message); setLoading(false); });
//   }, [groupId]);

//   // Real-time
//   useEffect(() => {
//     if (!groupId || !token) return;
//     const socket = getSocket(token);
//     if (!socket) return;

//     socket.emit('join_group', { groupId });

//     const onMessage = (msg) => {
//       setMessages(prev => [...prev, msg]);
//     };
//     socket.on('new_message', onMessage);

//     return () => {
//       socket.off('new_message', onMessage);
//       socket.emit('leave_group', { groupId });
//     };
//   }, [groupId, token]);

//   const send = useCallback(async (content) => {
//     setSending(true);
//     setError(null);
//     try {
//       const msg = await messagesApi.send(groupId, content);
//       setMessages(prev => [...prev, msg]);
//     } catch (err) {
//       setError(err.response?.data?.error || 'Failed to send');
//     } finally {
//       setSending(false);
//     }
//   }, [groupId]);

//   const flag = useCallback(async (messageId) => {
//     try {
//       await messagesApi.flag(groupId, messageId);
//       setMessages(prev =>
//         prev.map(m => m.id === messageId
//           ? { ...m, flagCount: (m.flagCount || 0) + 1 }
//           : m
//         )
//       );
//     } catch {}
//   }, [groupId]);

//   return { messages, loading, sending, error, send, flag };
// }


import { useState, useEffect, useCallback } from 'react';
import { messagesApi } from '../api/index.js';
import { getSocket } from './useSocket.js';

export function useChat(groupId, token, currentUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState(null);

  // Initial load
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    messagesApi.list(groupId)
      .then(msgs => {
        // Mark which messages are mine using user_id from server
        const marked = msgs.map(m => ({
          ...m,
          isMine: m.is_mine ?? m.user_id === currentUserId,
        }));
        setMessages(marked);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [groupId, currentUserId]);

  // Real-time
  useEffect(() => {
    if (!groupId || !token) return;
    const socket = getSocket(token);
    if (!socket) return;

    socket.emit('join_group', { groupId });

    const onMessage = (msg) => {
      setMessages(prev => {
        // Avoid duplicates (message already added optimistically on send)
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, { ...msg, isMine: msg.user_id === currentUserId }];
      });
    };
    socket.on('new_message', onMessage);

    return () => {
      socket.off('new_message', onMessage);
      socket.emit('leave_group', { groupId });
    };
  }, [groupId, token, currentUserId]);

  const send = useCallback(async (content) => {
    setSending(true);
    setError(null);
    try {
      const msg = await messagesApi.send(groupId, content);
      // Add optimistically with isMine: true
      setMessages(prev => [...prev, { ...msg, isMine: true }]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  }, [groupId]);

  const flag = useCallback(async (messageId) => {
    try {
      await messagesApi.flag(groupId, messageId);
      setMessages(prev =>
        prev.map(m => m.id === messageId
          ? { ...m, flagCount: (m.flagCount || 0) + 1 }
          : m
        )
      );
    } catch {}
  }, [groupId]);

  return { messages, loading, sending, error, send, flag };
}