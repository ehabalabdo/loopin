"use client";

import { useState, useRef } from "react";
import { createNews, markAsRead, deleteNews } from "@/app/(app)/news/actions";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
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
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ar-JO", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMediaUrl(data.url);
      setMediaType(data.mediaType);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "فشل رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* زر إضافة خبر (للمدير فقط) */}
      {role === "MANAGER" && (
        <button
          onClick={() => { setShowForm(!showForm); setMediaUrl(""); setMediaType(""); }}
          className="bg-[#181719] text-white px-6 py-3 rounded-lg hover:opacity-90 font-bold text-base"
        >
          {showForm ? "❌ إلغاء" : "➕ نشر خبر جديد"}
        </button>
      )}

      {/* نموذج إضافة خبر */}
      {showForm && (
        <form
          action={async (formData) => {
            setPublishing(true);
            formData.append("mediaUrl", mediaUrl);
            formData.append("mediaType", mediaType);
            await createNews(formData);
            setShowForm(false);
            setMediaUrl("");
            setMediaType("");
            setPublishing(false);
          }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-bold text-lg">نشر خبر جديد</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium border border-blue-200"
              >
                {uploading ? "⏳ رفع..." : "📎 صورة / فيديو"}
              </button>
              <button
                type="submit"
                disabled={publishing}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-bold text-base disabled:opacity-50"
              >
                {publishing ? "⏳ نشر..." : "📢 نشر"}
              </button>
            </div>
          </div>

          <input name="title" required placeholder="عنوان الخبر..." className="w-full p-3 rounded-lg border border-gray-200 text-base" />
          <textarea name="content" required rows={3} placeholder="محتوى الخبر..." className="w-full p-3 rounded-lg border border-gray-200 resize-none text-base" />

          {/* رفع صورة أو فيديو */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
            onChange={handleFileUpload}
            className="hidden"
          />
          {mediaUrl && (
            <div className="flex items-center gap-3">
              {mediaType === "image" && (
                <img src={mediaUrl} alt="معاينة" className="max-h-32 rounded-lg object-cover" />
              )}
              {mediaType === "video" && (
                <video src={mediaUrl} controls className="max-h-32 rounded-lg" />
              )}
              <button
                type="button"
                onClick={() => { setMediaUrl(""); setMediaType(""); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 border border-red-200 text-sm"
              >
                🗑️ إزالة
              </button>
            </div>
          )}
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
                isRead ? "border-gray-100" : "border-[#9ddad0] border-2"
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    {!isRead && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-[#9ddad0] text-[#181719] font-bold">
                        جديد
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{item.content}</p>

                  {/* عرض الوسائط */}
                  {item.mediaUrl && item.mediaType === "image" && (
                    <img src={item.mediaUrl} alt="" className="mb-3 max-w-full max-h-80 rounded-lg object-cover" />
                  )}
                  {item.mediaUrl && item.mediaType === "video" && (
                    <video src={item.mediaUrl} controls className="mb-3 max-w-full max-h-80 rounded-lg" />
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                    <span>✍️ {item.author.name}</span>
                    <span>📅 {formatDate(item.createdAt)}</span>
                    {role === "MANAGER" && (
                      <button
                        onClick={() => setSelectedReads(selectedReads === item.id ? null : item.id)}
                        className="text-[#9ddad0] hover:underline font-medium"
                      >
                        👁️ {item.reads.length} قراءة
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {!isRead && (
                    <form action={async () => { await markAsRead(item.id); }}>
                      <button type="submit" className="bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg text-sm font-medium border border-green-200">
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
                      <button type="submit" className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium border border-red-200">
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
