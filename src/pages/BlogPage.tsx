import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, Tag, ArrowLeft, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import SubpageNav from "@/components/landing/SubpageNav";
import useSEO from "@/hooks/useSEO";

interface BlogArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: "CAREER_ADVICE" | "COMPANY_BLOG" | "DEI_RESEARCH";
  author: { name: string; role: string; avatarUrl?: string };
  coverUrl?: string;
  readTime: number;
  tags: string[];
  createdAt: string;
}

export default function BlogPage() {
  const [search, setSearch] = useState("");
  const [activeArticle, setActiveArticle] = useState<BlogArticle | null>(null);

  useSEO({
    title: "Company News & DEI Policy Logs | SheEnableAI",
    description: "Stay updated with SheEnableAI milestones, hiring updates, and diversity policy logs in Pakistan's tech landscape.",
  });

  // Fetch articles from backend API matching company and research categories
  const { data: articles, isLoading } = useQuery<BlogArticle[]>({
    queryKey: ["blogArticles"],
    queryFn: async () => {
      const res = await api.get("/articles");
      // Filter out pure candidate career tips for corporate blog index, keep news & research
      return res.data.data.filter((a: BlogArticle) => a.category !== "CAREER_ADVICE");
    }
  });

  const filteredArticles = (articles || []).filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[var(--surface-dark)] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Hero Section */}
      <section className="bg-[var(--surface-dark)] text-white pt-24 pb-16">
        <div className="relative max-w-[1200px] mx-auto px-6 text-center max-w-2xl space-y-3">
          <h1 className="font-serif text-3xl font-extrabold tracking-tight">
            Company News & <span className="italic text-[var(--brand-pink)]">DEI Policy Logs</span>
          </h1>
          <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed max-w-[720px] mx-auto">
            Explore SheEnableAI milestones, community announcements, and specialized reports on female workforce participation in Pakistan's tech sector.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 bg-[var(--surface-dark)] text-white py-12">
        <div className="max-w-[1200px] mx-auto w-full px-6 space-y-8">
          {activeArticle ? (
            /* Detailed Blog View */
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-6 text-[var(--text-on-dark)]">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--border-dark)] text-[var(--text-on-dark-mute)] hover:text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft size={12} /> Back to Blog
              </button>

              {activeArticle.coverUrl && (
                <img
                  src={activeArticle.coverUrl}
                  alt={activeArticle.title}
                  className="w-full h-80 object-cover rounded-3xl border border-[var(--border-dark)] shadow-xl"
                />
              )}

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-[8px] py-[3px] bg-white/8 border border-[var(--border-dark)] text-[var(--text-on-dark-mute)] text-[10px] font-semibold uppercase tracking-wider rounded-full">
                    {activeArticle.category === "COMPANY_BLOG" ? "Company Update" : "Diversity Research"}
                  </span>
                  <span className="text-[var(--text-on-dark-mute)] text-xs flex items-center gap-1">
                    <Clock size={12} className="text-[var(--text-on-dark-mute)]" /> {activeArticle.readTime} min read
                  </span>
                </div>

                <h1 className="font-serif text-3xl font-extrabold text-white leading-tight">
                  {activeArticle.title}
                </h1>

                {/* Author Badge */}
                <div className="flex items-center gap-3 border-y border-[var(--border-dark)] py-4">
                  {activeArticle.author.avatarUrl && (
                    <img
                      src={activeArticle.author.avatarUrl}
                      alt={activeArticle.author.name}
                      className="w-10 h-10 rounded-full object-cover border border-[var(--border-dark)]"
                    />
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">{activeArticle.author.name}</div>
                    <div className="text-[10px] text-[var(--text-on-dark-mute)]">{activeArticle.author.role || "Corporate Relations"}</div>
                  </div>
                </div>

                {/* Blog Content */}
                <div
                  className="prose prose-invert prose-sm max-w-none text-[var(--text-on-dark-mute)] leading-relaxed space-y-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: activeArticle.content }}
                />

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[var(--border-dark)]">
                  {activeArticle.tags.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white/5 border border-[var(--border-dark)] rounded-full text-[10px] text-[var(--text-on-dark-mute)] font-bold flex items-center gap-1">
                      <Tag size={8} /> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Blog Listing Grid */
            <div className="space-y-6">
              {/* Filter */}
              <div className="relative bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-3xl p-4 shadow-xl">
                <Search size={14} className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--text-on-dark-mute)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search diversity research papers, newsletters, policy updates..."
                  className="w-full bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl pl-12 pr-4 py-3 text-xs text-[var(--text-on-dark)] placeholder:text-[var(--text-on-dark-mute)] focus:outline-none focus:border-[var(--brand-pink)]"
                />
              </div>

              {/* Articles Grid */}
              {isLoading ? (
                <div className="text-center py-20 animate-pulse">
                  <span className="text-xs text-[var(--text-on-dark-mute)]">Loading blog archives...</span>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-20 bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-3xl text-[var(--text-on-dark-mute)] flex flex-col items-center gap-2 shadow-xl">
                  <BookOpen size={36} className="text-[var(--text-on-dark-mute)]/70" />
                  <div className="text-sm font-bold text-[var(--text-on-dark)]">No blog logs matched your criteria</div>
                  <p className="text-[10px] text-[var(--text-on-dark-mute)]">Try widening your search queries.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {filteredArticles.map((article) => (
                    <div
                      key={article._id}
                      onClick={() => setActiveArticle(article)}
                      className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] overflow-hidden shadow-xl hover:border-[var(--brand-pink)]/30 transition-all duration-300 group cursor-pointer flex flex-col text-white"
                    >
                      {article.coverUrl && (
                        <div className="w-full overflow-hidden relative border-b border-[var(--border-dark)] aspect-video">
                          <img
                            src={article.coverUrl}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-3.5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-[8px] py-[3px] bg-white/8 border border-[var(--border-dark)] text-[var(--text-on-dark-mute)] text-[10px] font-semibold uppercase tracking-wider rounded-full">
                              {article.category === "COMPANY_BLOG" ? "Corporate Update" : "DEI Research"}
                            </span>
                            <span className="text-xs text-[var(--text-on-dark-mute)] flex items-center gap-1">
                              <Clock size={12} className="text-[var(--text-on-dark-mute)]" /> {article.readTime} min read
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-[var(--text-on-dark)] group-hover:text-[var(--brand-pink)] transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed line-clamp-3">
                            {article.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-[var(--border-dark)] pt-4 mt-1 text-xs text-[var(--text-on-dark-mute)]">
                          <span>By {article.author.name}</span>
                          <span className="text-[var(--brand-pink)] group-hover:underline font-bold">
                            Explore Article →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
