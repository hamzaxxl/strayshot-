import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  userId: string;
  type: 'review' | 'comment';
  sourceId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const NotificationsDropdown: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;
    try {
      await setDoc(doc(db, 'notifications', notification.id), { read: true }, { merge: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-zinc-900"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <Link
                    key={notif.id}
                    to={notif.type === 'review' ? `/profile/${user?.uid}` : `/listing/${notif.sourceId}`}
                    onClick={() => {
                      handleMarkAsRead(notif);
                      setIsOpen(false);
                    }}
                    className={`block p-4 border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors ${!notif.read ? 'bg-zinc-800/30' : ''}`}
                  >
                    <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-zinc-400'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
