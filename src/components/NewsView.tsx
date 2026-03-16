"use client";

import { useState } from "react";
import { createNews, markAsRead, deleteNews } from "@/app/(app)/news/actions";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { name: string };
  reads: { user: { name: string }; userId: string }[];
}

export default function NewsView({
  news,
  role,
  currentUserId,
}: {
  news: NewsItem[];
  role: string;
  currentUserId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedReads, setSelectedReads] = useState<string | null>(null);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ar-JO", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* زر إضافة خبر (للمدير فقط) */}
      {role === "MANAGER" && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          {showForm ? "إلغاء" : "➕ نشر خبر جديد"}
        </button>
      )}

      {/* نموذج إضافة خبر */}
      {showForm && (
        <form
          action={async (formData) => {
            await createNews(formData);
            setShowForm(false);
          }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4"
        >
          <h3 className="font-bold text-lg">نشر خبر جديد</h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1">العنوان</label>
            <input name="title" required className="w-full p-2 rounded-lg border border-gray-200" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">المحتوى</label>
            <textarea name="content" required rows={5} className="w-full p-2 rounded-lg border border-gray-200 resize-none" />
          </div>
          <button type="submit" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg hover:opacity-90">
            نشر
          </button>
        </form>
      )}

      {/* قائمة الأخبار */}
      {news.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center text-gray-400">
          لا يوجد أخبار حالياً
        </div>
      ) : (
        news.map((item) => {
          const isRead = item.reads.some((r) => r.userId === currentUserId);
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl p-6 shadow-sm border ${
                isRead ? "border-gray-100" : "border-[var(--color-primary)] border-2"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    {!isRead && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-primary)] text-white">
                        جديد
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{item.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>✍️ {item.author.name}</span>
                    <span>📅 {formatDate(item.createdAt)}</span>
                    {role === "MANAGER" && (
                      <button
                        onClick={() => setSelectedReads(selectedReads === item.id ? null : item.id)}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        👁️ {item.reads.length} قراءة
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!isRead && (
                    <form action={async () => { await markAsRead(item.id); }}>
                      <button type="submit" className="text-green-600 hover:bg-green-50 px-3 py-1 rounded text-sm">
                        ✅ تم القراءة
                      </button>
                    </form>
                  )}
                  {role === "MANAGER" && (
                    <form action={async () => {
                      if (confirm("هل أنت متأكد من حذف هذا الخبر؟")) {
                        await deleteNews(item.id);
                      }
                    }}>
                      <button type="submit" className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm">
                        🗑️ حذف
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* قائمة القراء (للمدير) */}
              {selectedReads === item.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="font-semibold text-sm mb-2">الذين قرأوا هذا الخبر:</h4>
                  {item.reads.length === 0 ? (
                    <p className="text-sm text-gray-400">لم يقرأ أحد هذا الخبر بعد</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {item.reads.map((r, i) => (
                        <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                          ✅ {r.user.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
