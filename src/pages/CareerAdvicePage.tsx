import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, BookOpen, Clock, Tag, ArrowLeft, Heart, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";
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
    <div className="min-h-screen bg-[var(--surface-muted)] text-[var(--ink-700)] flex flex-col">
      {/* Header */}
      <div className="bg-[var(--surface-dark)]">
        <SubpageNav />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 space-y-8">
        {activeArticle ? (
          /* Detailed Article View */
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-6">
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
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getCategoryColor(activeArticle.category)}`}>
                  {getCategoryLabel(activeArticle.category)}
                </span>
                <span className="text-[var(--ink-500)] text-xs flex items-center gap-1">
                  <Clock size={12} /> {activeArticle.readTime} min read
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
          /* Article Directory Grid */
          <div className="space-y-6">
            {/* Editorial Heading */}
            <div className="text-center max-w-2xl mx-auto space-y-3 py-6">
              <h2 className="font-serif text-3xl font-extrabold tracking-tight text-[var(--ink-900)]">
                SheEnableAI <span className="text-[var(--brand-pink)]">Career Hub</span>
              </h2>
              <p className="text-sm text-[var(--ink-500)] leading-relaxed">
                Empowering career insights, tech leadership blueprints, and data-driven diversity research, custom-curated for ambitious women in Pakistan's software sectors.
              </p>
            </div>

            {/* Filter controls */}
            <div className="grid md:grid-cols-3 gap-4 bg-[var(--surface)] border border-[var(--ink-200)] rounded-3xl p-4 shadow-card">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-500)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles, topics, keywords..."
                  className="w-full bg-white border border-[var(--ink-300)] rounded-2xl pl-10 pr-4 py-3 text-xs text-[var(--ink-900)] focus:outline-none focus:border-[var(--brand-pink)] placeholder:text-[var(--ink-500)]"
                />
              </div>

              {/* Category selector */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full bg-white border border-[var(--ink-300)] hover:bg-[var(--ink-100)] text-xs text-[var(--ink-700)] focus:ring-2 focus:ring-[var(--brand-pink)]/10 focus:outline-none shadow-none cursor-pointer rounded-2xl px-4 py-3 h-auto flex items-center justify-between transition-colors">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[var(--ink-200)] rounded-xl shadow-2xl min-w-[200px] p-1">
                  <SelectItem value="all" className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-soft)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2">
                    All Categories
                  </SelectItem>
                  <SelectItem value="CAREER_ADVICE" className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-soft)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2">
                    Career Advice
                  </SelectItem>
                  <SelectItem value="COMPANY_BLOG" className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-soft)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2">
                    Company Blog
                  </SelectItem>
                  <SelectItem value="DEI_RESEARCH" className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-soft)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2">
                    DEI & Salary Studies
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loading skeletons */}
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-[var(--surface)] border border-[var(--ink-200)] rounded-3xl p-5 space-y-4 animate-pulse">
                    <div className="w-full h-40 bg-[var(--ink-100)] rounded-2xl" />
                    <div className="h-4 bg-[var(--ink-100)] rounded w-1/3" />
                    <div className="h-6 bg-[var(--ink-100)] rounded w-3/4" />
                    <div className="h-10 bg-[var(--ink-100)] rounded" />
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-20 bg-[var(--surface)] border border-[var(--ink-200)] rounded-3xl text-[var(--ink-500)] flex flex-col items-center gap-2">
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
                    className="bg-[var(--surface)] border border-[var(--ink-200)] hover:border-[var(--brand-pink)]/50 rounded-3xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col"
                  >
                    {article.coverUrl && (
                      <div className="overflow-hidden h-44 relative border-b border-[var(--ink-200)]">
                        <img
                          src={article.coverUrl}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {article.isFeatured && (
                          <span className="absolute top-3 left-3 bg-[var(--brand-pink)] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                            <Sparkles size={8} fill="white" /> Featured
                          </span>
                        )}
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getCategoryColor(article.category)}`}>
                            {getCategoryLabel(article.category)}
                          </span>
                          <span className="text-[10px] text-[var(--ink-500)] flex items-center gap-0.5">
                            <Clock size={10} /> {article.readTime} min
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
                        <span className="text-[10px] text-[var(--brand-pink)] group-hover:underline font-bold flex items-center gap-0.5">
                          Read More →
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
    </div>
  );
}
