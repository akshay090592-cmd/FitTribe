import { supabase } from '../utils/supabaseClient';
import { User, GiftTransaction } from '../types';

// Cache for user IDs to avoid repeated DB calls
const userIdCache: Record<string, string> = {};

const getUserIdByName = async (displayName: string): Promise<string | null> => {
  if (userIdCache[displayName]) {
    return userIdCache[displayName];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('display_name', displayName)
    .single();

  if (error || !data) {
    console.error(`Could not find user ID for ${displayName}`, error);
    return null;
  }

  userIdCache[displayName] = data.id;
  return data.id;
};

// Function to send a notification
const sendNotification = async (userId: string, message: string, imageData?: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ user_id: userId, message, read: false, image_data: imageData }]);

  if (error) {
    console.error('Error sending notification:', error);
    return null;
  }
  return data;
};

// 1. Gift/Boost Notifications
export const notifyOnGiftReceived = async (gift: GiftTransaction) => {
  const message = `${gift.from} sent you a ${gift.giftName}!`;

  const recipientId = await getUserIdByName(gift.to);
  if (recipientId) {
    console.log(`Sending notification to ${gift.to} (${recipientId}): ${message}`);
    await sendNotification(recipientId, message);
  }
};


// 2. Tribe Activity Notifications
// 2. Tribe Activity Notifications
export const notifyTribeOnActivity = async (actor: User, activity: string, tribeId: string, imageData?: string) => {
  // Dynamic import to avoid circular dependency if storage imports this service in future
  const { getTribeMembers } = await import('../utils/storage');
  const members = await getTribeMembers(tribeId);
  const message = `${actor} just completed a ${activity}!`;

  for (const member of members) {
    if (member.displayName !== actor) {
      console.log(`Sending notification to ${member.displayName} (${member.id}): ${message}`);
      await sendNotification(member.id, message, imageData);
    }
  }
};

export const notifyTribeOnCommitment = async (actor: User, tribeId: string) => {
  const { getTribeMembers } = await import('../utils/storage');
  const members = await getTribeMembers(tribeId);
  const message = `${actor} committed to workout today! Cheer them on! 🙌`;

  for (const member of members) {
    if (member.displayName !== actor) {
      console.log(`Sending commitment notification to ${member.displayName} (${member.id}): ${message}`);
      await sendNotification(member.id, message);
    }
  }
};

export const notifyNudge = async (from: User, to: User) => {
  const message = `${from} nudged you! Time to get moving! 🐼`;
  const recipientId = await getUserIdByName(to);
  if (recipientId) {
    console.log(`Sending nudge to ${to} (${recipientId}): ${message}`);
    await sendNotification(recipientId, message);
  }
};

export const notifyComment = async (from: string, to: string, commentText: string) => {
  const message = `${from} commented: "${commentText}"`;
  const recipientId = await getUserIdByName(to);
  if (recipientId) {
    console.log(`Sending comment notification to ${to}: ${message}`);
    await sendNotification(recipientId, message);
  }
};

// 3. Persistence Helpers
export const getUnreadNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
  }
};
