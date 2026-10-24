import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

export type OnboardingPhase = "Before day one" | "First day" | "First week" | "First month";
export type OnboardingCategory = "People" | "Equipment" | "Access" | "Training" | "Culture";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  phase: OnboardingPhase;
  category: OnboardingCategory;
  owner: string;
  dueDate: string;
  required: boolean;
  completed: boolean;
}

export interface NewHire {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  manager: string;
  startDate: string;
  steps: OnboardingStep[];
}

interface OnboardingChecklistProps {
  hires?: NewHire[];
  isLoading?: boolean;
  error?: string | null;
  today?: string;
  onStepChange?: (hireId: string, stepId: string, completed: boolean) => void;
  onAddStep?: (hireId: string, step: OnboardingStep) => void;
}

const phases: OnboardingPhase[] = ["Before day one", "First day", "First week", "First month"];
const categories: OnboardingCategory[] = ["People", "Equipment", "Access", "Training", "Culture"];

function addDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

const makeSteps = (prefix: string, startDate: string): OnboardingStep[] => [
  { id: `${prefix}-1`, title: "Send welcome note", description: "Share the first-week schedule and arrival details.", phase: "Before day one", category: "People", owner: "People Ops", dueDate: addDays(startDate, -5), required: true, completed: true },
  { id: `${prefix}-2`, title: "Prepare laptop and security key", description: "Enroll the device and confirm the asset handoff.", phase: "Before day one", category: "Equipment", owner: "IT", dueDate: addDays(startDate, -2), required: true, completed: true },
  { id: `${prefix}-3`, title: "Activate core accounts", description: "Create email, chat, password manager, and project access.", phase: "First day", category: "Access", owner: "IT", dueDate: startDate, required: true, completed: false },
  { id: `${prefix}-4`, title: "Manager kickoff", description: "Review the role, success measures, and the 30-day plan.", phase: "First day", category: "People", owner: "Manager", dueDate: startDate, required: true, completed: false },
  { id: `${prefix}-5`, title: "Meet the team", description: "Join introductions with the immediate team and key partners.", phase: "First week", category: "People", owner: "Manager", dueDate: addDays(startDate, 2), required: false, completed: false },
  { id: `${prefix}-6`, title: "Complete security training", description: "Finish privacy, phishing, and incident-reporting modules.", phase: "First week", category: "Training", owner: "Security", dueDate: addDays(startDate, 4), required: true, completed: false },
  { id: `${prefix}-7`, title: "Choose a culture buddy", description: "Pair with a teammate for informal questions and context.", phase: "First week", category: "Culture", owner: "People Ops", dueDate: addDays(startDate, 6), required: false, completed: false },
  { id: `${prefix}-8`, title: "30-day reflection", description: "Capture wins, open questions, and support needed next.", phase: "First month", category: "Culture", owner: "Manager", dueDate: addDays(startDate, 30), required: true, completed: false },
];

export const sampleHires: NewHire[] = [
  { id: "nh-ava", name: "Ava Morgan", initials: "AM", role: "Product Designer", department: "Design", manager: "Amara Okafor", startDate: "2026-10-26", steps: makeSteps("ava", "2026-10-26") },
  { id: "nh-mateo", name: "Mateo Silva", initials: "MS", role: "Frontend Engineer", department: "Engineering", manager: "Jonah Brooks", startDate: "2026-10-28", steps: makeSteps("mateo", "2026-10-28").map((step, index) => ({ ...step, completed: index < 4 })) },
  { id: "nh-zoe", name: "Zoë Laurent", initials: "ZL", role: "Account Executive", department: "Sales", manager: "Diego Morales", startDate: "2026-11-02", steps: makeSteps("zoe", "2026-11-02").map((step, index) => ({ ...step, completed: index === 0 })) },
];

function Icon({ name }: { name: "check" | "search" | "calendar" | "user" | "plus" }) {
  const paths: Record<typeof name, ReactNode> = {
    check: <path d="m5 12 4 4L19 6" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{paths[name]}</svg>;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "No due date" : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function completion(steps: OnboardingStep[]) {
  return steps.length === 0 ? 0 : Math.round((steps.filter((step) => step.completed).length / steps.length) * 100);
}

export function OnboardingChecklist({
  hires = sampleHires,
  isLoading = false,
  error = null,
  today = "2026-10-24",
  onStepChange,
  onAddStep,
}: OnboardingChecklistProps) {
  const [localHires, setLocalHires] = useState(hires);
  const [selectedId, setSelectedId] = useState(hires[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setLocalHires(hires);
    setSelectedId((current) => hires.some((hire) => hire.id === current) ? current : hires[0]?.id ?? "");
  }, [hires]);

  const selected = localHires.find((hire) => hire.id === selectedId) ?? localHires[0];
  const visibleSteps = useMemo(() => {
    if (!selected) return [];
    const needle = query.trim().toLowerCase();
    return selected.steps.filter((step) => {
      const matchesQuery = !needle || `${step.title} ${step.description} ${step.owner}`.toLowerCase().includes(needle);
      const matchesStatus = status === "all" || (status === "complete" ? step.completed : !step.completed);
      const matchesCategory = category === "all" || step.category === category;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [selected, query, status, category]);

  const toggleStep = (stepId: string) => {
    if (!selected) return;
    const current = selected.steps.find((step) => step.id === stepId);
    if (!current) return;
    const nextCompleted = !current.completed;
    setLocalHires((currentHires) => currentHires.map((hire) => hire.id === selected.id ? {
      ...hire,
      steps: hire.steps.map((step) => step.id === stepId ? { ...step, completed: nextCompleted } : step),
    } : hire));
    onStepChange?.(selected.id, stepId, nextCompleted);
  };

  const addStep = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    if (!title) return;
    const step: OnboardingStep = {
      id: `custom-${Date.now()}`,
      title,
      description: String(data.get("description") ?? "").trim() || "Custom onboarding step",
      phase: data.get("phase") as OnboardingPhase,
      category: data.get("category") as OnboardingCategory,
      owner: String(data.get("owner") ?? "Manager").trim() || "Manager",
      dueDate: String(data.get("dueDate") ?? "").trim() || selected.startDate,
      required: data.get("required") === "on",
      completed: false,
    };
    setLocalHires((currentHires) => currentHires.map((hire) => hire.id === selected.id ? { ...hire, steps: [...hire.steps, step] } : hire));
    onAddStep?.(selected.id, step);
    setShowAdd(false);
  };

  const closeAdd = () => {
    setShowAdd(false);
    window.requestAnimationFrame(() => addButtonRef.current?.focus());
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAdd();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button, input, textarea, select, [tabindex]:not([tabindex='-1'])") ?? []).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (isLoading) return <section className="min-h-[520px] rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D] p-8" role="status" aria-live="polite"><div className="h-8 w-56 animate-pulse rounded bg-[#202020]" /><div className="mt-8 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl bg-[#151515]" />)}</div><span className="sr-only">Loading onboarding plans</span></section>;
  if (error) return <section className="rounded-2xl border border-red-900/70 bg-red-950/20 p-8" role="alert"><p className="font-semibold text-red-200">Onboarding plans could not be loaded.</p><p className="mt-2 text-sm text-red-300/80">{error}</p></section>;
  if (!selected) return <section className="rounded-2xl border border-dashed border-[#3A3A3A] bg-[#0D0D0D] p-12 text-center" role="status"><h2 className="text-xl font-semibold">No new hires yet</h2><p className="mt-2 text-[#9CA3AF]">Assign a template when the next teammate joins.</p></section>;

  const completedCount = selected.steps.filter((step) => step.completed).length;
  const progress = completion(selected.steps);

  return <section className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-[#F5F5F5] sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-5 border-b border-[#2A2A2A] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="font-mono text-xs uppercase tracking-[.24em] text-[#D4AF37]">People operations</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Onboarding command center</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9CA3AF]">Give every new teammate a clear first month, with accountable owners and visible progress.</p></div>
        <button ref={addButtonRef} type="button" onClick={() => setShowAdd(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#0A0A0A] hover:bg-[#E8C547] focus:outline-none focus:ring-2 focus:ring-[#E8C547] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"><span className="h-4 w-4"><Icon name="plus" /></span>Add checklist step</button>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside aria-label="New hires" className="rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D] p-3">
          <div className="flex items-center justify-between px-2 py-2"><h2 className="text-sm font-semibold">New hires</h2><span className="rounded-full bg-[#1B1B1B] px-2 py-1 font-mono text-xs text-[#9CA3AF]">{localHires.length}</span></div>
          <div className="mt-2 space-y-2">{localHires.map((hire) => {
            const hireProgress = completion(hire.steps);
            const active = hire.id === selected.id;
            return <button key={hire.id} type="button" onClick={() => setSelectedId(hire.id)} aria-pressed={active} className={`w-full rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${active ? "border-[#D4AF37]/60 bg-[#D4AF37]/10" : "border-transparent hover:border-[#2A2A2A] hover:bg-[#141414]"}`}>
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 font-mono text-xs font-bold text-[#E8C547]">{hire.initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{hire.name}</span><span className="block truncate text-xs text-[#9CA3AF]">{hire.role}</span></span><span className="font-mono text-xs text-[#E8C547]">{hireProgress}%</span></div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#252525]"><div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${hireProgress}%` }} /></div>
            </button>;
          })}</div>
        </aside>

        <main>
          <article className="rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D] p-5 sm:p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 font-mono text-sm font-bold text-[#E8C547]">{selected.initials}</span><div><h2 className="text-xl font-bold">{selected.name}</h2><p className="mt-1 text-sm text-[#9CA3AF]">{selected.role} · {selected.department}</p><p className="mt-1 text-xs text-[#6B7280]">Manager: {selected.manager}</p></div></div>
              <div className="flex items-center gap-4"><div className="text-right"><p className="font-mono text-2xl font-bold text-[#E8C547]">{progress}%</p><p className="text-xs text-[#9CA3AF]">{completedCount} of {selected.steps.length} complete</p></div><div className="grid h-16 w-16 place-items-center rounded-full" style={{ background: `conic-gradient(#D4AF37 ${progress}%, #252525 0)` }}><div className="grid h-12 w-12 place-items-center rounded-full bg-[#0D0D0D]"><span className="h-5 w-5 text-[#D4AF37]"><Icon name="check" /></span></div></div></div>
            </div>
            <div className="mt-5 grid gap-3 border-t border-[#2A2A2A] pt-5 sm:grid-cols-2"><p className="flex items-center gap-2 text-sm text-[#9CA3AF]"><span className="h-4 w-4 text-[#D4AF37]"><Icon name="calendar" /></span>Starts {formatDate(selected.startDate)}</p><p className="flex items-center gap-2 text-sm text-[#9CA3AF]"><span className="h-4 w-4 text-[#D4AF37]"><Icon name="user" /></span>{selected.manager} owns the plan</p></div>
          </article>

          <div className="mt-5 grid gap-3 rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D] p-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <label className="relative"><span className="sr-only">Search checklist steps</span><span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]"><Icon name="search" /></span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search steps or owners" className="min-h-11 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] py-2 pl-10 pr-3 text-sm outline-none placeholder:text-[#6B7280] focus:border-[#D4AF37]" /></label>
            <label><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 text-sm outline-none focus:border-[#D4AF37]"><option value="all">All statuses</option><option value="open">To do</option><option value="complete">Complete</option></select></label>
            <label><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 text-sm outline-none focus:border-[#D4AF37]"><option value="all">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>

          <div className="mt-5 space-y-5">{phases.map((phase) => {
            const phaseSteps = visibleSteps.filter((step) => step.phase === phase);
            if (phaseSteps.length === 0) return null;
            return <section key={phase} aria-labelledby={`phase-${phase.replaceAll(" ", "-")}`}><div className="mb-3 flex items-center gap-3"><h3 id={`phase-${phase.replaceAll(" ", "-")}`} className="text-sm font-bold">{phase}</h3><span className="h-px flex-1 bg-[#2A2A2A]" /><span className="font-mono text-xs text-[#6B7280]">{phaseSteps.filter((step) => step.completed).length}/{phaseSteps.length}</span></div><div className="space-y-2">{phaseSteps.map((step) => {
              const overdue = !step.completed && step.dueDate < today;
              return <article key={step.id} className={`group rounded-xl border p-4 transition ${step.completed ? "border-[#243328] bg-[#101812]" : overdue ? "border-amber-900/60 bg-amber-950/10" : "border-[#2A2A2A] bg-[#0D0D0D] hover:border-[#3A3A3A]"}`}>
                <div className="flex items-start gap-3"><button type="button" onClick={() => toggleStep(step.id)} aria-label={`${step.completed ? "Mark incomplete" : "Mark complete"}: ${step.title}`} aria-pressed={step.completed} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${step.completed ? "border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0A]" : "border-[#4A4A4A] hover:border-[#D4AF37]"}`}>{step.completed && <span className="h-4 w-4"><Icon name="check" /></span>}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className={`text-sm font-semibold ${step.completed ? "text-[#9CA3AF] line-through" : ""}`}>{step.title}</h4>{step.required && <span className="rounded bg-[#D4AF37]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#E8C547]">Required</span>}{overdue && <span className="rounded bg-amber-900/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-300">Overdue</span>}</div><p className="mt-1 text-xs leading-5 text-[#9CA3AF]">{step.description}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#6B7280]"><span>{step.category}</span><span>Owner: {step.owner}</span><span>Due {formatDate(step.dueDate)}</span></div></div></div>
              </article>;
            })}</div></section>;
          })}</div>

          {visibleSteps.length === 0 && <section className="mt-5 rounded-2xl border border-dashed border-[#3A3A3A] bg-[#0D0D0D] p-10 text-center" role="status"><h3 className="font-semibold">No checklist steps match</h3><p className="mt-2 text-sm text-[#9CA3AF]">Clear a filter or try a broader search.</p><button type="button" onClick={() => { setQuery(""); setStatus("all"); setCategory("all"); }} className="mt-4 rounded-lg border border-[#D4AF37]/60 px-4 py-2 text-sm font-semibold text-[#E8C547] hover:bg-[#D4AF37]/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">Reset filters</button></section>}
        </main>
      </div>
    </div>

    {showAdd && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAdd(); }}><form ref={dialogRef} onSubmit={addStep} onKeyDown={handleDialogKeyDown} role="dialog" aria-modal="true" aria-labelledby="add-step-title" className="w-full max-w-lg rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D] p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 id="add-step-title" className="text-xl font-bold">Add a checklist step</h2><button type="button" onClick={closeAdd} aria-label="Close dialog" className="rounded p-2 text-[#9CA3AF] hover:bg-[#1B1B1B] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">✕</button></div><div className="mt-5 grid gap-4">
      <label className="text-sm text-[#9CA3AF]">Step title<input name="title" required autoFocus className="mt-2 min-h-11 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 text-white outline-none focus:border-[#D4AF37]" /></label>
      <label className="text-sm text-[#9CA3AF]">Description<textarea name="description" rows={2} className="mt-2 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-3 text-white outline-none focus:border-[#D4AF37]" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-[#9CA3AF]">Phase<select name="phase" className="mt-2 min-h-11 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 text-white">{phases.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm text-[#9CA3AF]">Category<select name="category" className="mt-2 min-h-11 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 text-white">{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-[#9CA3AF]">Owner<input name="owner" defaultValue="Manager" className="mt-2 min-h-11 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 text-white" /></label><label className="text-sm text-[#9CA3AF]">Due date<input name="dueDate" type="date" defaultValue={selected.startDate} className="mt-2 min-h-11 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 text-white" /></label></div>
      <label className="flex items-center gap-3 text-sm text-[#9CA3AF]"><input name="required" type="checkbox" className="h-4 w-4 accent-[#D4AF37]" />Required step</label>
    </div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={closeAdd} className="rounded-lg border border-[#2A2A2A] px-4 py-2 text-sm hover:bg-[#1B1B1B]">Cancel</button><button type="submit" className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#0A0A0A] hover:bg-[#E8C547]">Add step</button></div></form></div>}
  </section>;
}

export default OnboardingChecklist;
