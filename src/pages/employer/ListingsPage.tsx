// src/pages/employer/ListingsPage.tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MoreVertical, MapPin, Eye, Users } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";
import { apiJobs } from "@/lib/api";
import { formatSalary, relativeTime } from "@/lib/utils";

export default function ListingsPage() {
  const { data: jobs = [] } = useQuery({ queryKey: ["myListings"], queryFn: apiJobs.getMyListings });

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
                    <button className="p-1.5 hover:bg-secondary rounded-lg"><MoreVertical size={14} /></button>
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
