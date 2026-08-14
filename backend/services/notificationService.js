const Notification = require('../models/Notification');
const { getIO, getUserSocketId } = require('../socket');

/**
 * Creates a notification in the database and emits it in real-time
 * to the target user if they are currently connected via Socket.io.
 */
async function sendNotification({ userId, type, title, message, link = '', relatedId = null }) {
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    link,
    relatedId,
  });

  try {
    const io = getIO();
    const socketId = getUserSocketId(userId.toString());
    if (io && socketId) {
      io.to(socketId).emit('notification:new', notification);
    }
  } catch (err) {
    // Socket layer not ready or user offline — notification is still persisted.
    console.warn('Socket emit skipped:', err.message);
  }

  return notification;
}

async function sendBulkNotification(userIds, payload) {
  const results = await Promise.all(
    userIds.map((userId) => sendNotification({ ...payload, userId }))
  );
  return results;
}

module.exports = { sendNotification, sendBulkNotification };
