import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Download, Copy, Wand2, Check } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiAI, apiProfile } from "@/lib/api";

export default function CVBuilderPage() {
  const [notes, setNotes] = useState("4 years React + TypeScript, AWS, MongoDB. Led a team of 4 at TechSolutions, shipping a dashboard used by 50k users.");
  
  // Track if we have saved successfully
  const [saved, setSaved] = useState(false);

  // 1. Fetch existing CV
  const { data: profileData, refetch } = useQuery({
    queryKey: ["candidateCv"],
    queryFn: apiProfile.getCv,
  });

  // 2. Generate CV mutation
  const gen = useMutation({ mutationFn: apiAI.generateCV });
  
  // 3. Save CV mutation
  const saveMutation = useMutation({
    mutationFn: apiProfile.saveCv,
    onSuccess: () => {
      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 3000);
    }
  });

  // The active CV to show is the newly generated one, or the one saved in DB
  const cv = gen.data || (profileData as any)?.cv;

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (cv) {
      saveMutation.mutate(cv);
    }
  };

  return (
    <DashboardShell
      title="CV Builder"
      subtitle="AI-generated, ATS-optimized resume in seconds"
      actions={
        <>
          <BtnPrimary onClick={() => cv && navigator.clipboard.writeText(JSON.stringify(cv, null, 2))}>
            <Copy size={12} /> Copy JSON
          </BtnPrimary>
          <BtnPrimary 
            onClick={handleSave} 
            disabled={!cv || saveMutation.isPending}
            className={saved ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-500" : ""}
          >
            {saved ? <><Check size={12} /> Saved</> : saveMutation.isPending ? "Saving..." : "Save to Profile"}
          </BtnPrimary>
        </>
      }
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cv-print-area, #cv-print-area * { visibility: visible; }
          #cv-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
        }
      `}</style>
      
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4 print:hidden">
          <SectionCard title="Tell us about you" subtitle="Paste rough notes — our AI will format the rest">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={9}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
              placeholder="e.g. 5 years marketing, led campaign for X brand, MBA from LUMS…"
            />
            <BtnPrimary
              onClick={() => gen.mutate(notes)}
              disabled={gen.isPending || !notes.trim()}
              className="w-full justify-center mt-3"
            >
              {gen.isPending ? <>Generating…</> : <><Wand2 size={12} /> Generate with AI</>}
            </BtnPrimary>
          </SectionCard>

          <SectionCard title="ATS tips">
            <ul className="text-[11px] text-muted-foreground space-y-2 leading-relaxed">
              <li>✅ Include 5-8 hard skills relevant to the role</li>
              <li>✅ Use action verbs (Led, Shipped, Reduced)</li>
              <li>✅ Add quantifiable results (50k users, 40% faster)</li>
              <li>❌ Avoid graphics, columns, or fancy fonts</li>
            </ul>
          </SectionCard>
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          <SectionCard
            title="Preview"
            subtitle="ATS-friendly, single-column layout"
            actions={cv && (
              <BtnOutline onClick={handlePrint}>
                <Download size={12} /> PDF
              </BtnOutline>
            )}
          >
            {!cv && !gen.isPending && (
              <div className="text-center py-12">
                <Sparkles size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                <div className="text-sm font-semibold text-foreground mb-1">Your CV will appear here</div>
                <div className="text-[12px] text-muted-foreground">Click "Generate with AI" to start</div>
              </div>
            )}
            {gen.isPending && (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-2 text-sm text-primary">
                  <Sparkles size={16} className="animate-pulse" /> AI is writing your CV…
                </div>
              </div>
            )}
            {cv && (
              <div id="cv-print-area" className="bg-white border border-border rounded-xl p-6 lg:p-8 shadow-sm">
                <div className="border-b border-border pb-4 mb-4">
                  <h2 className="font-serif text-2xl text-foreground">{cv.name}</h2>
                  <div className="text-sm text-muted-foreground mt-0.5">{cv.title}</div>
                </div>

                {cv.summary && (
                  <Section heading="Summary">
                    <p className="text-[12px] text-ink-500 leading-relaxed">{cv.summary}</p>
                  </Section>
                )}

                {cv.skills && cv.skills.length > 0 && (
                  <Section heading="Skills">
                    <div className="flex flex-wrap gap-1.5">
                      {cv.skills.map((s: string) => (
                        <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-semibold">{s}</span>
                      ))}
                    </div>
                  </Section>
                )}

                {cv.experience && cv.experience.length > 0 && (
                  <Section heading="Experience">
                    {cv.experience.map((e: any, i: number) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <div className="flex items-baseline justify-between">
                          <div className="text-[13px] font-bold text-foreground">{e.title}</div>
                          <div className="text-[10px] text-muted-foreground">{e.from} – {e.to}</div>
                        </div>
                        <div className="text-[11px] text-muted-foreground mb-1">{e.company}</div>
                        <ul className="text-[11px] text-ink-500 list-disc list-inside space-y-0.5">
                          {e.bullets && e.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
                        </ul>
                      </div>
                    ))}
                  </Section>
                )}

                {cv.education && cv.education.length > 0 && (
                  <Section heading="Education">
                    {cv.education.map((ed: any, i: number) => (
                      <div key={i} className="flex items-baseline justify-between">
                        <div className="text-[12px] font-semibold text-foreground">{ed.degree}</div>
                        <div className="text-[11px] text-muted-foreground">{ed.school} · {ed.year}</div>
                      </div>
                    ))}
                  </Section>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] text-primary mb-2">{heading}</h3>
      {children}
    </div>
  );
}
