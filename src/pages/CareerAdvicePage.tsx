import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, BookOpen, Clock, Tag, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import SubpageNav from "@/components/landing/SubpageNav";
import useSEO from "@/hooks/useSEO";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Article {
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
  isFeatured?: boolean;
}

export default function CareerAdvicePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  useSEO({
    title: "Career Advice & Hub for Women in Pakistan | SheEnableAI",
    description: "Expert career advice, resume tips, and interview preparation guides for women in tech in Pakistan. Accelerate your career with pre-vetted insights.",
  });

  // Fetch articles from backend API
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["articles", selectedCategory],
    queryFn: async () => {
      const res = await api.get<{ data: Article[] }>("/articles", {
        params: { category: selectedCategory === "all" ? "" : selectedCategory }
      });
      return res.data.data;
    }
  });

  // Filter articles by search query
  const filteredArticles = (articles || []).filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const getCategoryLabel = (cat: string) => {
    if (cat === "CAREER_ADVICE") return "Career Growth";
    if (cat === "COMPANY_BLOG") return "Company News";
    return "DEI Research";
  };

  const getCategoryColor = (cat: string) => {
    if (cat === "CAREER_ADVICE") return "bg-[var(--brand-pink-soft)] text-[var(--brand-pink)] border border-[var(--brand-pink)]/20";
    if (cat === "COMPANY_BLOG") return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
    return "bg-sky-500/10 text-sky-600 border border-sky-500/20";
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink-700)] flex flex-col">
      {/* Dark Header / Navigation */}
      <div className="bg-[var(--surface-dark)]">
        <SubpageNav />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {activeArticle ? (
          /* Detailed Article View */
          <div className="max-w-3xl mx-auto w-full p-6 space-y-6 animate-fade-in py-12">
            <button
              onClick={() => setActiveArticle(null)}
              className="px-4 py-2 bg-[var(--ink-100)] hover:bg-[var(--ink-200)] text-[var(--ink-900)] rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ArrowLeft size={12} /> Back to Directory
            </button>

            {activeArticle.coverUrl && (
              <img
                src={activeArticle.coverUrl}
                alt={activeArticle.title}
                className="w-full h-80 object-cover rounded-3xl border border-[var(--ink-200)] shadow-lg"
              />
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-semibold uppercase px-[10px] py-[3px] rounded-full bg-[var(--ink-100)] text-[var(--ink-700)]">
                  {getCategoryLabel(activeArticle.category)}
                </span>
                <span className="text-[var(--ink-500)] text-xs flex items-center gap-1.5">
                  <Clock size={12} strokeWidth={1.75} className="text-[var(--ink-500)]" />
                  <span>{activeArticle.readTime} min read</span>
                </span>
              </div>

              <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-[var(--ink-900)] leading-tight">
                {activeArticle.title}
              </h1>

              {/* Author Badge */}
              <div className="flex items-center gap-3 border-y border-[var(--ink-200)] py-4">
                {activeArticle.author.avatarUrl ? (
                  <img
                    src={activeArticle.author.avatarUrl}
                    alt={activeArticle.author.name}
                    className="w-10 h-10 rounded-full object-cover border border-[var(--ink-200)]"
                  />
                ) : (
                  <div className="w-10 h-10 bg-[var(--ink-100)] text-[var(--ink-700)] rounded-full flex items-center justify-center font-bold">
                    {activeArticle.author.name[0]}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-[var(--ink-900)]">{activeArticle.author.name}</div>
                  <div className="text-[10px] text-[var(--ink-500)]">{activeArticle.author.role || "Expert Contributor"}</div>
                </div>
              </div>

              {/* Article Content */}
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
          /* Directory View */
          <>
            {/* Dark Hero Section (Title + Search Bar) */}
            <header className="bg-[var(--surface-dark)] text-white pb-12 pt-6">
              <div className="max-w-[1200px] mx-auto w-full px-6 text-center max-w-2xl space-y-6">
                <div className="space-y-3">
                  <h1 className="font-serif text-3xl font-extrabold tracking-tight text-white">
                    Career Advice for <span className="italic text-[var(--brand-pink)]">Women in Tech in Pakistan</span>
                  </h1>
                  <p className="text-sm text-[var(--on-dark-secondary)] leading-relaxed">
                    Pre-vetted blueprints, resume strategies, and interview insights compiled by Pakistan's top female tech leaders.
                  </p>
                </div>

                {/* Filter controls */}
                <div className="grid md:grid-cols-3 gap-4 bg-white/5 border border-[var(--on-dark-border)] rounded-3xl p-4 shadow-lg max-w-3xl mx-auto">
                  {/* Search */}
                  <div className="md:col-span-2 relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-dark-secondary)]" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search articles, topics, keywords..."
                      className="w-full bg-white/5 border border-[var(--on-dark-border)] rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-[var(--on-dark-secondary)] focus:outline-none focus:border-[var(--brand-pink)] transition-all"
                    />
                  </div>

                  {/* Category selector */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full bg-white/5 border border-[var(--on-dark-border)] hover:bg-white/10 text-xs text-[var(--on-dark-secondary)] focus:ring-2 focus:ring-[var(--brand-pink)]/20 focus:outline-none shadow-none cursor-pointer rounded-2xl px-4 py-3 h-auto flex items-center justify-between transition-colors">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--surface-dark)] border border-[var(--on-dark-border)] rounded-xl shadow-2xl min-w-[200px] p-1">
                      <SelectItem value="all" className="text-xs font-semibold text-[var(--on-dark-secondary)] focus:bg-[var(--brand-pink-soft)]/20 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2">
                        All Categories
                      </SelectItem>
                      <SelectItem value="CAREER_ADVICE" className="text-xs font-semibold text-[var(--on-dark-secondary)] focus:bg-[var(--brand-pink-soft)]/20 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2">
                        Career Advice
                      </SelectItem>
                      <SelectItem value="COMPANY_BLOG" className="text-xs font-semibold text-[var(--on-dark-secondary)] focus:bg-[var(--brand-pink-soft)]/20 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2">
                        Company Blog
                      </SelectItem>
                      <SelectItem value="DEI_RESEARCH" className="text-xs font-semibold text-[var(--on-dark-secondary)] focus:bg-[var(--brand-pink-soft)]/20 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2">
                        DEI & Salary Studies
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </header>

            {/* Articles Grid section switches to --surface (white) */}
            <main className="flex-1 bg-[var(--surface)] text-[var(--ink-700)]">
              <div className="max-w-[1200px] mx-auto w-full p-6 py-12">
                
                {/* Career Advice Intro Paragraph */}
                <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6 mb-8 text-xs text-[var(--ink-700)] leading-relaxed shadow-sm">
                  Navigating a career in tech as a woman in Pakistan comes with unique opportunities and challenges. The SheEnableAI Career Hub provides actionable advice on salary negotiation, returning to the workforce after a break, building a standout technical resume, and preparing for engineering and design interviews at top local and global companies. Read our latest guides to take control of your career trajectory.
                </div>

                {isLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="bg-white border border-[var(--ink-200)] rounded-[var(--radius-card)] p-5 space-y-4 animate-pulse">
                        <div className="w-full h-40 bg-[var(--ink-100)] rounded-2xl" />
                        <div className="h-4 bg-[var(--ink-100)] rounded w-1/3" />
                        <div className="h-6 bg-[var(--ink-100)] rounded w-3/4" />
                        <div className="h-10 bg-[var(--ink-100)] rounded" />
                      </div>
                    ))}
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="text-center py-20 bg-white border border-[var(--ink-200)] rounded-[var(--radius-card)] text-[var(--ink-500)] flex flex-col items-center gap-2">
                    <BookOpen size={36} className="text-[var(--ink-400)]" />
                    <div className="text-sm font-bold">No articles matched your criteria</div>
                    <p className="text-[10px] text-[var(--ink-400)]">Try clearing filters or checking your spelling.</p>
                  </div>
                ) : (
                  /* Articles Grid */
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map((article) => (
                      <div
                        key={article._id}
                        onClick={() => setActiveArticle(article)}
                        className="bg-white border border-[var(--ink-200)] hover:border-[var(--brand-pink)]/40 rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col"
                      >
                        {article.coverUrl && (
                          <div className="overflow-hidden h-44 relative border-b border-[var(--ink-200)]">
                            <img
                              src={article.coverUrl}
                              alt={article.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {article.isFeatured && (
                              <span className="absolute top-3 left-3 bg-[var(--brand-pink)] text-white text-[11px] font-semibold px-[10px] py-[3px] rounded-full uppercase tracking-wider">
                                Featured
                              </span>
                            )}
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold uppercase px-[10px] py-[3px] rounded-full bg-[var(--ink-100)] text-[var(--ink-700)]">
                                {getCategoryLabel(article.category)}
                              </span>
                              <span className="text-[10px] text-[var(--ink-500)] flex items-center gap-1">
                                <Clock size={12} strokeWidth={1.75} className="text-[var(--ink-500)]" />
                                <span>{article.readTime} min</span>
                              </span>
                            </div>
                            <h3 className="font-serif text-sm font-extrabold text-[var(--ink-900)] group-hover:text-[var(--brand-pink)] transition-colors leading-snug">
                              {article.title}
                            </h3>
                            <p className="text-[11px] text-[var(--ink-500)] leading-relaxed line-clamp-2">
                              {article.excerpt}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-[var(--ink-200)] pt-3 mt-1">
                            <span className="text-[10px] font-semibold text-[var(--ink-700)]">By {article.author.name}</span>
                            <span className="text-[13px] font-medium text-[var(--brand-pink)] group-hover:underline flex items-center gap-0.5">
                              Read More →
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
