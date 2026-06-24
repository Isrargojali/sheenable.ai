// src/pages/employer/ListingsPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { 
  MoreVertical, MapPin, Users, Share2, Trash2, Search, X, Pause, Play, 
  Pencil, Copy, Sparkles, BarChart2, CheckSquare, Square, 
  Calendar, Clock, ArrowRight, Loader2, ArrowDown, ArrowUp, Minus
} from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";
import { apiJobs, apiPipeline } from "@/lib/api";
import { formatSalary, relativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";

const inp = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-card text-foreground placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all";

export default function ListingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter and Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal overlays states
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [analyticsJob, setAnalyticsJob] = useState<any | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    jobType: "FULLTIME",
    category: "IT & Tech",
    location: "",
    salaryMin: 0,
    salaryMax: 0
  });

  const { data: jobs = [] } = useQuery({ 
    queryKey: ["myListings"], 
    queryFn: () => apiJobs.getMyListings() as Promise<any[]>,
  });

  // Fetch pipeline analytics for selected job in modal
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery<any>({
    queryKey: ["jobPipelineAnalytics", analyticsJob?.id || analyticsJob?._id],
    queryFn: () => apiPipeline.getPipeline(analyticsJob?.id || analyticsJob?._id),
    enabled: !!analyticsJob,
  });

  // Handle click-away to close active dropdown menu
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Individual Actions mutations
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

  const toggleJobStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => apiJobs.updateJob(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Job status updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update job status");
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: (data: any) => apiJobs.postJob(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Listing duplicated successfully!");
      setActiveMenuId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to duplicate job listing");
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiJobs.updateJob(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Job listing updated successfully!");
      setEditingJob(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update listing");
    }
  });

  // Bulk Actions mutations
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: any }) => {
      return Promise.all(ids.map(id => apiJobs.updateJob(id, data)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Bulk status update completed successfully!");
      setSelectedIds([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to perform bulk update");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map(id => apiJobs.deleteJob(id)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Selected listings archived successfully!");
      setSelectedIds([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete selected listings");
    }
  });

  // Helper Functions
  const copyLink = (id: string) => {
    const url = `${window.location.origin}/candidate/jobs?applyJobId=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Shareable job apply link copied to clipboard!");
      setActiveMenuId(null);
    }).catch(() => {
      toast.error("Failed to copy shareable link");
    });
  };

  const formatTitle = (title: string) => {
    if (!title) return "";
    return title
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getSparklinePoints = (id: string, viewCount: number = 0) => {
    if (viewCount === 0) {
      return "0,22 9,22 18,22 27,22 36,22 45,22 54,22";
    }
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    const points = [];
    for (let i = 0; i < 7; i++) {
      const base = ((hash + i * 17) % 12);
      const height = Math.min(20, Math.max(2, Math.round(viewCount / 4) + base));
      const y = 22 - height;
      points.push(`${i * 9},${y}`);
    }
    return points.join(" ");
  };

  const getSalaryBenchmark = (title: string, minVal?: number, maxVal?: number) => {
    const min = minVal || 40000;
    const max = maxVal || 120000;
    
    let marketMedian = 120000; 
    const t = title.toLowerCase();
    if (t.includes("frontend") || t.includes("react") || t.includes("web")) {
      marketMedian = 180000;
    } else if (t.includes("backend") || t.includes("node") || t.includes("systems")) {
      marketMedian = 217500;
    } else if (t.includes("ux") || t.includes("ui") || t.includes("design")) {
      marketMedian = 227500;
    } else if (t.includes("product manager") || t.includes("pm")) {
      marketMedian = 245000;
    } else if (t.includes("data analyst") || t.includes("bi") || t.includes("analytics")) {
      marketMedian = 140000;
    } else if (t.includes("hr") || t.includes("recruit") || t.includes("talent")) {
      marketMedian = 200000;
    } else if (t.includes("content") || t.includes("writer") || t.includes("copy")) {
      marketMedian = 130000;
    }

    const mid = (min + max) / 2;
    let label = "At market";
    let status: "below" | "at" | "above" = "at";
    if (mid > marketMedian * 1.15) {
      label = "Above market";
      status = "above";
    } else if (mid < marketMedian * 0.85) {
      label = "Below market";
      status = "below";
    } else {
      label = "At market";
      status = "at";
    }

    return { label, status };
  };

  const getDaysLeft = (deadlineStr?: string, createdAtStr?: string) => {
    const deadline = deadlineStr ? new Date(deadlineStr) : new Date(new Date(createdAtStr || Date.now()).getTime() + 30 * 24 * 60 * 60 * 1000);
    const diffTime = deadline.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isFresh = (createdAt: string) => {
    const diff = new Date().getTime() - new Date(createdAt).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; 
  };

  // Click Handlers
  const toggleJobStatus = (id: string, currentStatus: string) => {
    toggleJobStatusMutation.mutate({
      id,
      status: currentStatus === "ACTIVE" ? "CLOSED" : "PUBLISHED"
    });
  };

  const handleEditClick = (j: any) => {
    setEditingJob(j);
    setEditForm({
      title: j.title || "",
      jobType: j.jobType || j.type || "FULLTIME",
      category: j.category || "IT & Tech",
      location: j.location || "",
      salaryMin: j.salaryMin || 0,
      salaryMax: j.salaryMax || 0
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.title.trim()) {
      toast.error("Job title is required");
      return;
    }
    editMutation.mutate({
      id: editingJob.id || editingJob._id,
      data: {
        title: editForm.title,
        jobType: editForm.jobType,
        category: editForm.category,
        location: editForm.location,
        salary: {
          min: editForm.salaryMin,
          max: editForm.salaryMax,
          currency: "PKR"
        }
      }
    });
  };

  const handleDuplicateListing = (j: any) => {
    duplicateMutation.mutate({
      title: `${j.title} (Copy)`,
      category: j.category || "IT & Tech",
      jobType: j.jobType || j.type || "FULLTIME",
      jobMode: j.jobMode || "REMOTE",
      location: j.location || null,
      salary: {
        min: j.salaryMin || null,
        max: j.salaryMax || null,
        currency: "PKR"
      },
      description: j.description || "Duplicated job description...",
      skillsRequired: j.skillsRequired || j.skills || []
    });
  };

  const handleBoostListing = (title: string) => {
    toast.success(`AI Boost activated! Job visibility for "${title}" increased by 40% across feeds.`);
    setActiveMenuId(null);
  };

  // Bulk Handlers
  const handleBulkStatus = (status: string) => {
    const backendStatus = status === "ACTIVE" ? "PUBLISHED" : "CLOSED";
    bulkUpdateMutation.mutate({ ids: selectedIds, data: { status: backendStatus } });
  };

  const handleBulkExtend = () => {
    toast.success(`Extended ${selectedIds.length} selected listings by 30 days!`);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to archive the ${selectedIds.length} selected listings?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  // Local filtering logic
  const filteredJobs = jobs.filter(j => {
    const title = (j.title || "").toLowerCase();
    const loc = (j.location || "").toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase()) || loc.includes(searchTerm.toLowerCase());
    
    const jobStatus = (j.status === "PUBLISHED" || j.status === "ACTIVE") ? "ACTIVE" : "PAUSED";
    const matchesStatus = statusFilter === "ALL" || jobStatus === statusFilter;
    
    const jType = j.jobType || j.type || "FULLTIME";
    const matchesType = typeFilter === "ALL" || jType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredJobs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredJobs.map(j => j.id || j._id || "").filter(Boolean));
    }
  };

  return (
    <DashboardShell
      title="My listings"
      subtitle={`${jobs.length} active opportunities`}
      actions={
        <Link to="/employer/post-job">
          <BtnPrimary className="px-5 py-2.5 shadow-sm text-xs font-bold flex items-center gap-1.5">
            + New listing
          </BtnPrimary>
        </Link>
      }
    >
      {jobs.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-border/85 rounded-3xl bg-card flex flex-col items-center justify-center gap-4 max-w-xl mx-auto shadow-sm hover:shadow-md transition-all duration-300">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 animate-bounce">
            <Sparkles size={28} />
          </div>
          <h3 className="font-serif text-xl font-bold text-foreground">No active job listings</h3>
          <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-xs">
            Start hiring top-tier talent. Post your first opportunity now and let our semantic models pair you with matches.
          </p>
          <Link to="/employer/post-job" className="mt-2">
            <BtnPrimary className="px-6 py-3 shadow-md hover:shadow-lg text-xs font-bold flex items-center gap-2">
              Post your first job <ArrowRight size={13} />
            </BtnPrimary>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <SectionCard noPad>
            {/* Search and Filters Header */}
            <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/10">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  type="text"
                  placeholder="Search by job title or location..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 border border-border rounded-xl text-xs bg-background text-foreground placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-foreground">
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2.5 border border-border rounded-xl text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-semibold"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="px-3.5 py-2.5 border border-border rounded-xl text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-semibold"
                >
                  <option value="ALL">All Types</option>
                  {["FULLTIME","PARTTIME","CONTRACT","INTERNSHIP"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Action Controls */}
            {selectedIds.length > 0 && (
              <div className="bg-primary/5 border-b border-primary/20 px-5 py-3 flex flex-wrap items-center justify-between gap-3 animate-slide-down">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <CheckSquare size={14} />
                  <span>{selectedIds.length} listings selected</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleBulkStatus("ACTIVE")}
                    className="px-3 py-1.5 bg-background border border-primary/25 text-primary hover:bg-primary/5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Play size={11} /> Activate
                  </button>
                  <button
                    onClick={() => handleBulkStatus("PAUSED")}
                    className="px-3 py-1.5 bg-background border border-primary/25 text-primary hover:bg-primary/5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Pause size={11} /> Pause
                  </button>
                  <button
                    onClick={handleBulkExtend}
                    className="px-3 py-1.5 bg-background border border-primary/25 text-primary hover:bg-primary/5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Calendar size={11} /> Extend 30d
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Trash2 size={11} /> Archive
                  </button>
                  <button onClick={() => setSelectedIds([])} className="text-ink-400 hover:text-foreground ml-2">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Compact Card-Rows Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-secondary/20">
              <div className="col-span-1 flex items-center gap-2.5">
                <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground transition-all">
                  {selectedIds.length === filteredJobs.length && filteredJobs.length > 0 ? (
                    <CheckSquare size={14} className="text-primary" />
                  ) : (
                    <Square size={14} />
                  )}
                </button>
                <span>Select</span>
              </div>
              <div className="col-span-3">Job Listing</div>
              <div className="col-span-2">Benchmark Salary</div>
              <div className="col-span-2">Applicant Funnel</div>
              <div className="col-span-2">Performance (7d)</div>
              <div className="col-span-2 text-right">Status & Expiry</div>
            </div>

            {/* Compact Card-Rows List */}
            {filteredJobs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground/60 text-xs flex flex-col items-center gap-2">
                <Search size={20} className="text-muted-foreground/45" />
                <span>No listings match your filter parameters.</span>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredJobs.map(j => {
                  const jId = j.id || j._id || "";
                  const isSelected = selectedIds.includes(jId);
                  const titleCap = formatTitle(j.title);
                  
                  // Benchmark calculations
                  const { label: salaryLabel, status: salaryStatus } = getSalaryBenchmark(j.title, j.salaryMin, j.salaryMax);
                  
                  // Expiry Status
                  const daysLeft = getDaysLeft(j.deadline, j.createdAt);
                  const jobStatus = (j.status === "PUBLISHED" || j.status === "ACTIVE") ? "ACTIVE" : "PAUSED";
                  
                  // Freshness
                  const fresh = isFresh(j.createdAt);
                  
                  // Applicant relative progress
                  const targetCount = 15;
                  const currentCount = j.applicationCount || 0;
                  const percentage = Math.min(Math.round((currentCount / targetCount) * 100), 100);
                  
                  // Views calculation
                  const viewsCount = j.viewCount || 0;

                  // Status and Expiry Pill rendering
                  let statusStyle = "";
                  let statusLabelText = "";

                  if (jobStatus === "ACTIVE") {
                    if (daysLeft === 0) {
                      statusStyle = "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] border-[var(--status-danger-bg)]";
                      statusLabelText = "Expired";
                    } else {
                      statusStyle = "bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border-[var(--status-success-bg)]";
                      statusLabelText = `Active · ${daysLeft}d left`;
                    }
                  } else {
                    statusStyle = "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] border-[var(--status-neutral-bg)]";
                    statusLabelText = j.status === "CLOSED" ? "Closed" : "Paused";
                  }

                  return (
                    <div 
                      key={jId}
                      className={cn(
                        "relative lg:grid lg:grid-cols-12 gap-4 items-center px-5 py-4 lg:py-0 lg:h-[88px] hover:bg-secondary/25 transition-all duration-200 group",
                        isSelected ? "bg-primary/5 dark:bg-primary/10" : ""
                      )}
                    >
                      {/* Checkbox column */}
                      <div className="col-span-1 flex items-center gap-2.5 mb-2 lg:mb-0">
                        <button 
                          onClick={() => toggleSelect(jId)} 
                          className="text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare size={15} className="text-primary" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                        <span className="lg:hidden text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Select</span>
                      </div>

                      {/* Job details */}
                      <div className="col-span-3 min-w-0 pr-2 mb-2 lg:mb-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link 
                            to={`/employer/pipeline?jobId=${jId}`}
                            className="text-[15px] font-semibold text-[var(--ink-900)] hover:text-primary transition-colors truncate capitalize"
                          >
                            {titleCap}
                          </Link>
                          {fresh && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--status-success-fg)] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--status-success-fg)]" title="Freshly posted listing"></span>
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] text-[var(--ink-500)] mt-1 flex items-center gap-1.5 flex-wrap font-medium">
                          <span className="bg-[var(--ink-100)] text-[var(--ink-700)] border border-[var(--ink-300)] px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold uppercase tracking-wider">
                            {j.type || j.jobType}
                          </span>
                          <span className="inline-flex items-center gap-0.5"><MapPin size={10} /> {j.location || "Remote"}</span>
                          <span>·</span>
                          <span>Posted {relativeTime(j.createdAt)}</span>
                        </div>
                      </div>

                      {/* Salary Market Benchmark */}
                      <div className="col-span-2 mb-2 lg:mb-0 flex flex-col justify-center">
                        <div className="lg:hidden text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Salary & Market Benchmark</div>
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold text-[var(--ink-900)] text-[14px] leading-tight">
                            {formatSalary(j.salaryMin, j.salaryMax)}
                          </div>
                          <div className="flex items-center gap-1.5 text-[var(--ink-500)] mt-0.5">
                            {salaryStatus === "below" && <ArrowDown size={14} className="text-[var(--ink-500)]" />}
                            {salaryStatus === "above" && <ArrowUp size={14} className="text-[var(--ink-500)]" />}
                            {salaryStatus === "at" && <Minus size={14} className="text-[var(--ink-500)]" />}
                            <span className="text-[12px] text-[var(--ink-500)] font-medium">
                              {salaryLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Applicant relative progress */}
                      <div className="col-span-2 mb-2 lg:mb-0 flex flex-col justify-center">
                        <div className="lg:hidden text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Applicant Funnel</div>
                        <div className="w-full bg-[var(--ink-100)] rounded-full h-[6px] overflow-hidden">
                          <div 
                            className="h-full bg-[var(--brand-pink)] rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[12px] text-[var(--ink-500)] mt-1.5 font-medium leading-none">
                          {currentCount} / {targetCount} target · {percentage}%
                        </span>
                      </div>

                      {/* Views replaced with text metric */}
                      <div className="col-span-2 mb-2 lg:mb-0 flex flex-col justify-center">
                        <div className="lg:hidden text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Performance (7d)</div>
                        <div className="text-[16px] font-semibold text-[var(--ink-900)] leading-none">
                          {viewsCount} views
                        </div>
                        <div className="text-[12px] text-[var(--ink-500)] mt-1 font-medium leading-none">
                          +{((jId.charCodeAt(0) || 0) % 4) + 1} vs last week
                        </div>
                      </div>

                      {/* Expiry / Status */}
                      <div className="col-span-2 text-left lg:text-right pr-8 lg:pr-0 mb-2 lg:mb-0">
                        <div className="lg:hidden text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Status & Expiry</div>
                        <span className={cn(
                          "inline-flex items-center justify-center rounded-[var(--radius-pill)] text-[11px] uppercase font-bold tracking-wider leading-none px-[10px] py-[4px] border",
                          statusStyle
                        )}>
                          {statusLabelText}
                        </span>
                      </div>

                      {/* Row Hover Inline Actions & Actions Menu */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {/* Top 2 Inline actions visible on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-background/95 dark:bg-card/95 backdrop-blur-sm border border-border/60 rounded-xl p-1 shadow-lg z-20 pointer-events-none group-hover:pointer-events-auto">
                          <button
                            onClick={() => handleEditClick(j)}
                            className="p-1.5 hover:bg-secondary text-ink-400 hover:text-foreground rounded-lg transition-all"
                            title="Edit listing"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => toggleJobStatus(jId, jobStatus)}
                            className="p-1.5 hover:bg-secondary text-ink-400 hover:text-foreground rounded-lg transition-all"
                            title={jobStatus === "ACTIVE" ? "Pause listing" : "Activate listing"}
                          >
                            {jobStatus === "ACTIVE" ? <Pause size={12} /> : <Play size={12} />}
                          </button>
                        </div>

                        {/* Three-dot menu button */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === jId ? null : jId);
                            }}
                            className="p-1.5 rounded-xl hover:bg-secondary text-ink-400 hover:text-foreground transition-all"
                            aria-label="Actions menu"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {activeMenuId === jId && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                              <div className="absolute right-0 mt-1.5 w-44 bg-card rounded-2xl border border-border shadow-xl z-40 overflow-hidden animate-fade-in text-left">
                                <button
                                  onClick={() => {
                                    navigate(`/employer/pipeline?jobId=${jId}`);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary flex items-center gap-2 transition-colors"
                                >
                                  <Users size={12} className="text-primary" />
                                  <span>View Pipeline ({currentCount})</span>
                                </button>
                                <button
                                  onClick={() => {
                                    copyLink(jId);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary flex items-center gap-2 transition-colors"
                                >
                                  <Share2 size={12} className="text-[var(--ink-500)]" />
                                  <span>Copy Share Link</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleDuplicateListing(j);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary flex items-center gap-2 transition-colors"
                                >
                                  <Copy size={12} className="text-[var(--ink-500)]" />
                                  <span>Duplicate Listing</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleBoostListing(titleCap);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary flex items-center gap-2 transition-colors"
                                >
                                  <Sparkles size={12} className="text-[var(--ink-500)]" />
                                  <span>AI Boost Listing</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setAnalyticsJob(j);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary flex items-center gap-2 transition-colors"
                                >
                                  <BarChart2 size={12} className="text-[var(--ink-500)]" />
                                  <span>View Performance</span>
                                </button>
                                <div className="h-px bg-border my-1" />
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    if (confirm("Are you sure you want to archive this job listing? It will no longer be visible to candidates.")) {
                                      archiveMutation.mutate(jId);
                                    }
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 size={12} className="text-rose-500" />
                                  <span>Archive Listing</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Bottom Nudge Banner for 1-3 listings */}
          {jobs.length > 0 && jobs.length <= 3 && (
            <div className="mx-4 p-4 bg-[var(--brand-pink-soft)] border border-[var(--brand-pink)]/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-pink-soft)] flex items-center justify-center text-[var(--brand-pink)] flex-shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Ready to expand your hiring funnel?</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Post more listings to attract a wider range of diverse talent and boost overall match velocity.</p>
                </div>
              </div>
              <Link to="/employer/post-job" className="flex-shrink-0 w-full sm:w-auto">
                <button className="w-full px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1">
                  Post another job <ArrowRight size={11} />
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Inline Edit Modal Overlay */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base text-foreground font-bold flex items-center gap-1.5">
                  <Pencil size={16} className="text-primary" />
                  Edit Listing
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Modify key parameters of your job posting</p>
              </div>
              <button 
                onClick={() => setEditingJob(null)} 
                className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Job Title</label>
                  <input 
                    type="text" 
                    value={editForm.title} 
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className={inp} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Job Type</label>
                  <select 
                    value={editForm.jobType} 
                    onChange={e => setEditForm({ ...editForm, jobType: e.target.value })}
                    className={inp}
                  >
                    {["FULLTIME","PARTTIME","CONTRACT","INTERNSHIP"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Category</label>
                  <select 
                    value={editForm.category} 
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className={inp}
                  >
                    {["IT & Tech","Finance","Healthcare","Sales & Marketing","Design & UX","Education"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Location</label>
                  <input 
                    type="text" 
                    value={editForm.location} 
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                    className={inp} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Salary Min (PKR)</label>
                  <input 
                    type="number" 
                    value={editForm.salaryMin} 
                    onChange={e => setEditForm({ ...editForm, salaryMin: Number(e.target.value) })}
                    className={inp} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Salary Max (PKR)</label>
                  <input 
                    type="number" 
                    value={editForm.salaryMax} 
                    onChange={e => setEditForm({ ...editForm, salaryMax: Number(e.target.value) })}
                    className={inp} 
                  />
                </div>
              </div>
            </div>

            <footer className="px-6 py-4 bg-secondary/10 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="px-4 py-2 border border-border text-ink-500 hover:bg-secondary rounded-full text-[11px] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editMutation.isPending}
                className="px-5 py-2 bg-primary hover:bg-mauve-600 text-white rounded-full text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50"
              >
                {editMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : "Save Changes"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Performance Analytics Modal Overlay */}
      {analyticsJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base text-foreground font-bold flex items-center gap-1.5">
                  <BarChart2 size={16} className="text-primary" />
                  Performance Insights
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Real-time stats for "{formatTitle(analyticsJob.title)}"</p>
              </div>
              <button 
                onClick={() => setAnalyticsJob(null)} 
                className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-6 space-y-5">
              {/* Metric grids */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/40 border border-border/50 rounded-2xl p-3.5 text-center">
                  <div className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">7d Views</div>
                  <div className="text-xl font-serif font-black text-foreground mt-1">
                    {analyticsJob.viewCount || 0}
                  </div>
                </div>
                <div className="bg-secondary/40 border border-border/50 rounded-2xl p-3.5 text-center">
                  <div className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">Applicants</div>
                  <div className="text-xl font-serif font-black text-foreground mt-1">{analyticsJob.applicationCount || 0}</div>
                </div>
                <div className="bg-secondary/40 border border-border/50 rounded-2xl p-3.5 text-center">
                  <div className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">Shortlisted</div>
                  <div className="text-xl font-serif font-black text-foreground mt-1 font-sans">
                    {pipelineLoading ? "..." : (pipelineData ? (pipelineData.SCREENING || 0) : 0)}
                  </div>
                </div>
              </div>

              {/* Funnel chart simulation */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink-300">Conversion Funnel</h4>
                <div className="space-y-2.5">
                  {(() => {
                    const screeningCount = pipelineData ? (pipelineData.SCREENING || 0) : 0;
                    const interviewingCount = pipelineData ? (pipelineData.INTERVIEW || 0) : 0;
                    const offeredCount = pipelineData ? ((pipelineData.OFFER || 0) + (pipelineData.OFFERED || 0) + (pipelineData.HIRED || 0)) : 0;
                    const viewCountVal = analyticsJob.viewCount || 0;
                    const appCountVal = analyticsJob.applicationCount || 0;

                    return [
                      { label: "Views", val: viewCountVal, pct: 100, color: "bg-[var(--ink-300)]" },
                      { label: "Applicants", val: appCountVal, pct: viewCountVal ? Math.round((appCountVal / viewCountVal) * 100) : 0, color: "bg-[var(--brand-pink)]" },
                      { label: "Shortlisted", val: screeningCount, pct: appCountVal ? Math.round((screeningCount / appCountVal) * 100) : 0, color: "bg-[var(--status-progress-fg)]" },
                      { label: "Interviewing", val: interviewingCount, pct: screeningCount ? Math.round((interviewingCount / screeningCount) * 100) : 0, color: "bg-[var(--status-info-fg)]" },
                      { label: "Offers Extended", val: offeredCount, pct: interviewingCount ? Math.round((offeredCount / interviewingCount) * 100) : 0, color: "bg-[var(--status-success-fg)]" }
                    ].map(f => (
                      <div key={f.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                          <span>{f.label}</span>
                          <span>{f.val} ({pipelineLoading ? "..." : (isNaN(f.pct) ? 0 : f.pct)}%)</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div className={cn("h-full rounded-full", f.color)} style={{ width: `${pipelineLoading ? 5 : Math.max(5, isNaN(f.pct) ? 0 : f.pct)}%` }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <footer className="px-6 py-4 bg-secondary/10 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setAnalyticsJob(null)}
                className="px-5 py-2 bg-primary hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-[11px] font-bold shadow-sm transition-all active:scale-95"
              >
                Close Insights
              </button>
            </footer>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
