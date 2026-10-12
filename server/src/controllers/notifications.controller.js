import { prisma } from '../config/db.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: req.user.userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        metadata: true,
        isRead: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    // Enrich ride request notifications with current booking status
    const bookingIds = notifications
      .filter((n) => n.type === 'RIDE_REQUEST_RECEIVED' && n.metadata?.bookingId)
      .map((n) => n.metadata.bookingId);

    let bookingsMap = {};
    if (bookingIds.length > 0) {
      const liveBookings = await prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        select: { id: true, status: true }
      });
      bookingsMap = Object.fromEntries(liveBookings.map((b) => [b.id, b.status]));
    }

    const enrichedNotifications = notifications.map((n) => {
      if (n.type === 'RIDE_REQUEST_RECEIVED' && n.metadata?.bookingId) {
        const liveStatus = bookingsMap[n.metadata.bookingId] || null;
        return {
          ...n,
          metadata: {
            ...n.metadata,
            bookingStatus: liveStatus
          }
        };
      }
      return n;
    });

    return res.status(200).json({
      success: true,
      count: enrichedNotifications.length,
      notifications: enrichedNotifications
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        recipientId: req.user.userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification: updated
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        recipientId: req.user.userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};
