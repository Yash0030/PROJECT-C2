// import { Server } from 'socket.io';
// import crypto from 'crypto';
// import { db } from '../db/client.js';

// export function initSocket(httpServer) {
//   const io = new Server(httpServer, {
//     cors: {
//       origin: process.env.WEB_ORIGIN || 'http://localhost:5173',
//       credentials: true,
//     },
//   });

//   io.use(async (socket, next) => {
//     const token = socket.handshake.auth?.token;
//     if (!token) return next(new Error('Missing session token'));

//     const hash = crypto.createHash('sha256').update(token).digest('hex');

//     try {
//       const { rows } = await db().query(
//         `SELECT id, is_suspended FROM users  WHERE id=$1`, [hash]
//       );
//       if (!rows[0] || rows[0].is_suspended) return next(new Error('Invalid session'));
//       socket.sessionHash = hash;
//       next();
//     } catch (err) {
//       next(new Error('Auth error'));
//     }
//   });

//   io.on('connection', (socket) => {
//     // Personal room for DMs (join request results, kicks)
//     socket.join(`session:${socket.sessionHash}`);

//     // Join a group room
//     socket.on('join_group', async ({ groupId }) => {
//       const { rows } = await db().query(
//         `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_kicked=FALSE`,
//         [groupId, socket.sessionHash]
//       );
//       if (rows[0]) socket.join(groupId);
//     });

//     // Creator room (for join request notifications)
//     socket.on('watch_requests', async ({ groupId }) => {
//       const { rows } = await db().query(
//         `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_creator=TRUE`,
//         [groupId, socket.sessionHash]
//       );
//       if (rows[0]) socket.join(`creator:${groupId}`);
//     });

//     socket.on('leave_group', ({ groupId }) => {
//       socket.leave(groupId);
//     });

//     socket.on('disconnect', () => {});
//   });

//   console.log('✅  Socket.io initialised');
//   return io;
// }

import { Server } from 'socket.io';
import { db } from '../db/client.js';
import { verifyToken } from '../services/jwt.js';

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.WEB_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Missing session token'));

    try {
      const payload = await verifyToken(token);

      const { rows } = await db().query(
        `SELECT id, is_suspended FROM users WHERE id = $1`,
        [payload.sub]
      );
      if (!rows[0] || rows[0].is_suspended) return next(new Error('Invalid session'));

      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error('Auth error'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`session:${socket.userId}`);

    socket.on('join_group', async ({ groupId }) => {
      const { rows } = await db().query(
        `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_kicked=FALSE`,
        [groupId, socket.userId]
      );
      if (rows[0]) socket.join(groupId);
    });

    socket.on('watch_requests', async ({ groupId }) => {
      const { rows } = await db().query(
        `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_creator=TRUE`,
        [groupId, socket.userId]
      );
      if (rows[0]) socket.join(`creator:${groupId}`);
    });

    socket.on('leave_group', ({ groupId }) => {
      socket.leave(groupId);
    });

    socket.on('typing', ({ groupId, isTyping, anonName }) => {
      socket.to(groupId).emit('typing', { userId: socket.userId, isTyping, anonName });
    });

    socket.on('disconnect', () => {});
  });

  console.log('✅  Socket.io initialised');
  return io;
}