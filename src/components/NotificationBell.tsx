"use client";

import { useState, useEffect, useRef } from "react";

interface NotificationBellProps {
  userId: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    const res = await fetch(`/api/notifications?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: NotificationItem) => !n.isRead).length);
    }
  }

  async function markAsRead(id: string) {
    await fetch(`/api/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNotifications();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-[#181719] transition"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-12 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto z-50">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-[#181719]">الإشعارات</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">لا توجد إشعارات</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${
                  !n.isRead ? "bg-blue-50" : ""
                }`}
              >
                <p className="font-medium text-sm text-[#181719]">{n.title}</p>
                <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(n.createdAt).toLocaleDateString("ar-JO")}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
