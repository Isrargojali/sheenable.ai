import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, Tag, ArrowLeft, BookOpen, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";

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
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink-700)] flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Hero Section (Dark) */}
      <section className="bg-[var(--surface-dark)] text-white py-16">
        <div className="relative max-w-[1200px] mx-auto px-6 text-center max-w-2xl space-y-3">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            Company News & <span className="italic text-[var(--brand-pink)]">DEI Policy Logs</span>
          </h2>
          <p className="text-sm text-[var(--on-dark-secondary)] leading-relaxed">
            Stay updated with SheEnableAI company milestones, community achievements, and specialized reports on women inclusion in Pakistan's software industry.
          </p>
        </div>
      </section>

      {/* Main Content Area (Light) */}
      <main className="flex-1 bg-[var(--surface)] text-[var(--ink-700)] py-12">
        <div className="max-w-[1200px] mx-auto w-full px-6 space-y-8">
          {activeArticle ? (
            /* Detailed Blog View */
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-6 text-[var(--ink-700)]">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 bg-[var(--ink-100)] hover:bg-[var(--ink-200)] border border-[var(--ink-300)] text-[var(--ink-700)] rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft size={12} /> Back to Blog
              </button>

              {activeArticle.coverUrl && (
                <img
                  src={activeArticle.coverUrl}
                  alt={activeArticle.title}
                  className="w-full h-80 object-cover rounded-3xl border border-[var(--ink-200)] shadow-xl"
                />
              )}

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-[var(--ink-100)] border border-[var(--ink-200)] text-[var(--ink-700)] rounded-full text-[10px] font-bold">
                    {activeArticle.category === "COMPANY_BLOG" ? "Company Update" : "Diversity Research"}
                  </span>
                  <span className="text-[var(--ink-500)] text-xs flex items-center gap-1">
                    <Clock size={12} /> {activeArticle.readTime} min read
                  </span>
                </div>

                <h1 className="font-serif text-3xl font-extrabold text-[var(--ink-900)] leading-tight">
                  {activeArticle.title}
                </h1>

                {/* Author Badge */}
                <div className="flex items-center gap-3 border-y border-[var(--ink-200)] py-4">
                  {activeArticle.author.avatarUrl && (
                    <img
                      src={activeArticle.author.avatarUrl}
                      alt={activeArticle.author.name}
                      className="w-10 h-10 rounded-full object-cover border border-[var(--ink-200)]"
                    />
                  )}
                  <div>
                    <div className="text-xs font-bold text-[var(--ink-900)]">{activeArticle.author.name}</div>
                    <div className="text-[10px] text-[var(--ink-500)]">{activeArticle.author.role || "Corporate Relations"}</div>
                  </div>
                </div>

                {/* Blog Content */}
                <div
                  className="prose prose-sm max-w-none text-[var(--ink-700)] leading-relaxed space-y-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: activeArticle.content }}
                />

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[var(--ink-200)]">
                  {activeArticle.tags.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 bg-[var(--ink-100)] border border-[var(--ink-200)] rounded-full text-[10px] text-[var(--ink-700)] font-bold flex items-center gap-1">
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
              <div className="relative bg-white border border-[var(--ink-200)] rounded-3xl p-4 shadow-[var(--shadow-card)]">
                <Search size={14} className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--ink-500)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search diversity research papers, newsletters, policy updates..."
                  className="w-full bg-white border border-[var(--ink-300)] rounded-2xl pl-12 pr-4 py-3 text-xs text-[var(--ink-900)] focus:outline-none focus:border-[var(--brand-pink)]"
                />
              </div>

              {/* Articles Grid */}
              {isLoading ? (
                <div className="text-center py-20 animate-pulse">
                  <span className="text-xs text-[var(--ink-500)]">Loading blog archives...</span>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-20 bg-white border border-[var(--ink-200)] rounded-3xl text-[var(--ink-500)] flex flex-col items-center gap-2 shadow-[var(--shadow-card)]">
                  <BookOpen size={36} className="text-[var(--ink-400)]" />
                  <div className="text-sm font-bold text-[var(--ink-700)]">No blog logs matched your criteria</div>
                  <p className="text-[10px] text-[var(--ink-500)]">Try widening your search queries.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {filteredArticles.map((article) => (
                    <div
                      key={article._id}
                      onClick={() => setActiveArticle(article)}
                      className="bg-white border border-[var(--ink-200)] hover:border-[var(--brand-pink)]/30 rounded-3xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col text-[var(--ink-700)]"
                    >
                      {article.coverUrl && (
                        <div className="overflow-hidden h-48 relative border-b border-[var(--ink-200)]">
                          <img
                            src={article.coverUrl}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 bg-[var(--ink-100)] border border-[var(--ink-200)] text-[var(--ink-700)] rounded-full text-[9px] font-bold">
                              {article.category === "COMPANY_BLOG" ? "Corporate Update" : "DEI Research"}
                            </span>
                            <span className="text-[10px] text-[var(--ink-500)] flex items-center gap-0.5">
                              <Clock size={10} className="text-[var(--brand-pink)]" /> {article.readTime} min read
                            </span>
                          </div>
                          <h3 className="font-serif text-sm font-extrabold text-[var(--ink-900)] group-hover:text-[var(--brand-pink)] transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-[11px] text-[var(--ink-500)] leading-relaxed line-clamp-2">
                            {article.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-[var(--ink-200)] pt-3 mt-1 text-[10px] text-[var(--ink-500)]">
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
