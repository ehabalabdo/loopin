import { getNews } from "./actions";
import { requireAuth } from "@/lib/auth";
import NewsView from "@/components/NewsView";

export default async function NewsPage() {
  const session = await requireAuth();
  const news = await getNews();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">الأخبار والإعلانات</h1>
      <NewsView
        news={JSON.parse(JSON.stringify(news))}
        role={session.role}
        currentUserId={session.id}
      />
    </div>
  );
}
