import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, BookOpen, Clock, Tag, ArrowLeft, Heart, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";

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
}

export default function CareerAdvicePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // Fetch articles from backend API
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["articles", selectedCategory],
    queryFn: async () => {
      const res = await axios.get("http://localhost:5000/api/articles", {
        params: { category: selectedCategory }
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
    if (cat === "CAREER_ADVICE") return "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20";
    if (cat === "COMPANY_BLOG") return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
    return "bg-pink-500/10 text-pink-400 border border-pink-500/20";
  };

  return (
    <div className="min-h-screen bg-[#1A0D1F] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 space-y-8">
        {activeArticle ? (
          /* Detailed Article View */
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-6">
            <button
              onClick={() => setActiveArticle(null)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all text-white/70"
            >
              <ArrowLeft size={12} /> Back to Directory
            </button>

            {activeArticle.coverUrl && (
              <img
                src={activeArticle.coverUrl}
                alt={activeArticle.title}
                className="w-full h-80 object-cover rounded-3xl border border-white/5 shadow-xl"
              />
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getCategoryColor(activeArticle.category)}`}>
                  {getCategoryLabel(activeArticle.category)}
                </span>
                <span className="text-white/40 text-xs flex items-center gap-1">
                  <Clock size={12} /> {activeArticle.readTime} min read
                </span>
              </div>

              <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-white leading-tight">
                {activeArticle.title}
              </h1>

              {/* Author Badge */}
              <div className="flex items-center gap-3 border-y border-white/5 py-4">
                {activeArticle.author.avatarUrl ? (
                  <img
                    src={activeArticle.author.avatarUrl}
                    alt={activeArticle.author.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-bold">
                    {activeArticle.author.name[0]}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-white">{activeArticle.author.name}</div>
                  <div className="text-[10px] text-white/40">{activeArticle.author.role || "Expert Contributor"}</div>
                </div>
              </div>

              {/* Article Content */}
              <div
                className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed space-y-4 text-sm"
                dangerouslySetInnerHTML={{ __html: activeArticle.content }}
              />

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/5">
                {activeArticle.tags.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white/5 rounded-full text-[10px] text-white/50 font-bold flex items-center gap-1">
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
              <h2 className="font-serif text-3xl font-extrabold tracking-tight">
                SheEnableAI <span className="text-[#22C55E]">Career Hub</span>
              </h2>
              <p className="text-sm text-white/50 leading-relaxed">
                Empowering career insights, tech leadership blueprints, and data-driven diversity research, custom-curated for ambitious women in Pakistan's software sectors.
              </p>
            </div>

            {/* Filter controls */}
            <div className="grid md:grid-cols-3 gap-4 bg-[#0F0A1A] border border-white/5 rounded-3xl p-4 shadow-lg">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles, topics, keywords..."
                  className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              {/* Category selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white/70 focus:outline-none focus:border-[#22C55E]"
              >
                <option value="">All Categories</option>
                <option value="CAREER_ADVICE">Career Advice</option>
                <option value="COMPANY_BLOG">Company Blog</option>
                <option value="DEI_RESEARCH">DEI & Salary Studies</option>
              </select>
            </div>

            {/* Loading skeletons */}
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-5 space-y-4 animate-pulse">
                    <div className="w-full h-40 bg-white/5 rounded-2xl" />
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                    <div className="h-6 bg-white/5 rounded w-3/4" />
                    <div className="h-10 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-20 bg-[#0F0A1A] border border-white/5 rounded-3xl text-white/30 flex flex-col items-center gap-2">
                <BookOpen size={36} className="text-white/20" />
                <div className="text-sm font-bold">No articles matched your criteria</div>
                <p className="text-[10px] text-white/20">Try clearing filters or checking your spelling.</p>
              </div>
            ) : (
              /* Articles Grid */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <div
                    key={article._id}
                    onClick={() => setActiveArticle(article)}
                    className="bg-[#0F0A1A] border border-white/5 hover:border-white/10 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col"
                  >
                    {article.coverUrl && (
                      <div className="overflow-hidden h-44 relative border-b border-white/5">
                        <img
                          src={article.coverUrl}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {article.isFeatured && (
                          <span className="absolute top-3 left-3 bg-[#22C55E] text-[#0F0A1A] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                            <Sparkles size={8} fill="#0F0A1A" /> Featured
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
                          <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                            <Clock size={10} /> {article.readTime} min
                          </span>
                        </div>
                        <h3 className="font-serif text-sm font-extrabold group-hover:text-[#22C55E] transition-colors leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                        <span className="text-[10px] font-semibold text-white/70">By {article.author.name}</span>
                        <span className="text-[10px] text-[#22C55E] group-hover:underline font-bold flex items-center gap-0.5">
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
