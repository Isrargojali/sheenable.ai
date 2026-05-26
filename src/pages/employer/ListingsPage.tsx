// src/pages/employer/ListingsPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { MoreVertical, MapPin, Users, Share2, Trash2 } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";
import { apiJobs } from "@/lib/api";
import { formatSalary, relativeTime } from "@/lib/utils";
import { toast } from "sonner";

export default function ListingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const { data: jobs = [] } = useQuery({ 
    queryKey: ["myListings"], 
    queryFn: () => apiJobs.getMyListings(),
  });

  // Handle click-away to close active dropdown menu
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Mutation to archive listing
  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiJobs.deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Job listing archived successfully!");
      setActiveMenuId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to archive listing");
    }
  });

  // Share job copy link helper
  const copyLink = (id: string) => {
    const url = `${window.location.origin}/candidate/jobs?applyJobId=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Shareable job apply link copied to clipboard!");
      setActiveMenuId(null);
    }).catch(() => {
      toast.error("Failed to copy shareable link");
    });
  };

  return (
    <DashboardShell
      title="My listings"
      subtitle={`${jobs.length} active posts`}
      actions={
        <Link to="/employer/post-job">
          <BtnPrimary>+ New listing</BtnPrimary>
        </Link>
      }
    >
      <SectionCard noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-secondary/50">
                {["Job", "Type", "Salary", "Applicants", "Status", "Posted", ""].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} className="hover:bg-secondary/30 border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground">{j.title}</div>
                    <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />{j.location ?? "Remote"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{j.type}</span>
                  </td>
                  <td className="px-4 py-3 text-emerald-600 font-bold text-[12px]">
                    {formatSalary(j.salaryMin, j.salaryMax)}
                  </td>
                  <td className="px-4 py-3 text-foreground font-bold inline-flex items-center gap-1">
                    <Users size={11} className="text-muted-foreground" /> {j.applicationCount}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">ACTIVE</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[11px]">{relativeTime(j.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === j.id ? null : j.id);
                        }}
                        className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
                        aria-label="Actions menu"
                      >
                        <MoreVertical size={14} />
                      </button>
                      
                      {activeMenuId === j.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          <button
                            onClick={() => navigate(`/employer/pipeline?jobId=${j.id}`)}
                            className="w-full text-left px-3.5 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary flex items-center gap-2 transition-colors"
                          >
                            <Users size={12} className="text-primary" />
                            <span>View Applicants ({j.applicationCount})</span>
                          </button>
                          
                          <button
                            onClick={() => copyLink(j.id)}
                            className="w-full text-left px-3.5 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary flex items-center gap-2 transition-colors"
                          >
                            <Share2 size={12} className="text-emerald-500" />
                            <span>Copy Shareable Link</span>
                          </button>
                          
                          <div className="h-px bg-border my-1" />
                          
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to archive this job listing? It will no longer be visible to candidates.")) {
                                archiveMutation.mutate(j.id);
                              }
                            }}
                            className="w-full text-left px-3.5 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 size={12} className="text-rose-500" />
                            <span>Archive Listing</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
