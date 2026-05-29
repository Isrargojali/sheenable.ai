import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, Tag, ArrowLeft, BookOpen, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import logo from "@/assets/sheEnableAI-removebg-preview.png";

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
      const res = await axios.get("http://localhost:5000/api/articles");
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
    <div className="min-h-screen bg-[#1A0D1F] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0F0A1A]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="SheEnableAI logo" className="h-10 object-contain" />
        </Link>
        <Link
          to="/jobs"
          className="px-4 py-2 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 border border-[#22C55E]/20 rounded-full text-xs font-bold text-[#22C55E] transition-all"
        >
          Explore Careers
        </Link>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 space-y-8">
        {activeArticle ? (
          /* Detailed Blog View */
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-6">
            <button
              onClick={() => setActiveArticle(null)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all text-white/70"
            >
              <ArrowLeft size={12} /> Back to Blog
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
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[10px] font-bold">
                  {activeArticle.category === "COMPANY_BLOG" ? "Company Update" : "Diversity Research"}
                </span>
                <span className="text-white/40 text-xs flex items-center gap-1">
                  <Clock size={12} /> {activeArticle.readTime} min read
                </span>
              </div>

              <h1 className="font-serif text-3xl font-extrabold text-white leading-tight">
                {activeArticle.title}
              </h1>

              {/* Author Badge */}
              <div className="flex items-center gap-3 border-y border-white/5 py-4">
                {activeArticle.author.avatarUrl && (
                  <img
                    src={activeArticle.author.avatarUrl}
                    alt={activeArticle.author.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                )}
                <div>
                  <div className="text-xs font-bold text-white">{activeArticle.author.name}</div>
                  <div className="text-[10px] text-white/40">{activeArticle.author.role || "Corporate Relations"}</div>
                </div>
              </div>

              {/* Blog Content */}
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
          /* Blog Listing Grid */
          <div className="space-y-6">
            {/* Heading */}
            <div className="text-center max-w-2xl mx-auto space-y-3 py-6">
              <h2 className="font-serif text-3xl font-extrabold tracking-tight">
                Company News & <span className="text-[#22C55E]">DEI Policy Logs</span>
              </h2>
              <p className="text-sm text-white/50 leading-relaxed">
                Stay updated with SheEnableAI company milestones, community achievements, and specialized reports on women inclusion in Pakistan's software industry.
              </p>
            </div>

            {/* Filter */}
            <div className="relative bg-[#0F0A1A] border border-white/5 rounded-3xl p-4 shadow-lg">
              <Search size={14} className="absolute left-8 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search diversity research papers, newsletters, policy updates..."
                className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#22C55E]"
              />
            </div>

            {/* Articles Grid */}
            {isLoading ? (
              <div className="text-center py-20 animate-pulse">
                <span className="text-xs text-white/40">Loading blog archives...</span>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-20 bg-[#0F0A1A] border border-white/5 rounded-3xl text-white/30 flex flex-col items-center gap-2">
                <BookOpen size={36} className="text-white/20" />
                <div className="text-sm font-bold">No blog logs matched your criteria</div>
                <p className="text-[10px] text-white/20">Try widening your search queries.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {filteredArticles.map((article) => (
                  <div
                    key={article._id}
                    onClick={() => setActiveArticle(article)}
                    className="bg-[#0F0A1A] border border-white/5 hover:border-white/10 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col"
                  >
                    {article.coverUrl && (
                      <div className="overflow-hidden h-48 relative border-b border-white/5">
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
                          <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[9px] font-bold">
                            {article.category === "COMPANY_BLOG" ? "Corporate Update" : "DEI Research"}
                          </span>
                          <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                            <Clock size={10} /> {article.readTime} min read
                          </span>
                        </div>
                        <h3 className="font-serif text-sm font-extrabold group-hover:text-[#22C55E] transition-colors leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 text-[10px] text-white/40">
                        <span>By {article.author.name}</span>
                        <span className="text-[#22C55E] group-hover:underline font-bold">
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
    </div>
  );
}
