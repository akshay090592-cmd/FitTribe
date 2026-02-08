// Initialize Firebase Cloud Messaging
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from '../utils/supabaseClient';

// User provided configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLD8js1XKCBQv-8oyHuIHHI_ChcJQsxKM",
  authDomain: "fittribe-tracker.firebaseapp.com",
  projectId: "fittribe-tracker",
  storageBucket: "fittribe-tracker.firebasestorage.app",
  messagingSenderId: "1020887087658",
  appId: "1:1020887087658:web:27d9da58d73c5d09346153",
  measurementId: "G-R0995L4XDG"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// User provided VAPID key
const VAPID_KEY = "BMqx16vICaoBtA6IZyCQG9-s4-TIFlo3_8ughLgnc58T54MYis0RYxJin3o6IeNTEPOYwONlrhRoP6b468UBu8o";

export const requestNotificationPermission = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (token) {
        // Save token to Supabase profiles
        const { error } = await supabase
          .from('profiles')
          .update({ fcm_token: token })
          .eq('id', userId);

        if (error) {
          console.error('Error saving FCM token:', error);
        } else {
          console.log('FCM token saved successfully');
        }
      }
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
