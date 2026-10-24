import { type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";

export type ContentChannel = "Blog" | "Email" | "LinkedIn" | "Instagram" | "YouTube";
export type ContentStatus = "Idea" | "Draft" | "Review" | "Scheduled" | "Published";

export interface ContentItem {
  id: string;
  title: string;
  date: string;
  channel: ContentChannel;
  status: ContentStatus;
  assignee: string;
  campaign?: string;
}

interface ContentCalendarProps {
  items?: ContentItem[];
  isLoading?: boolean;
  error?: string | null;
  initialMonth?: string;
  onItemChange?: (item: ContentItem) => void;
  onItemCreate?: (item: ContentItem) => void;
}

const channels: ContentChannel[] = ["Blog", "Email", "LinkedIn", "Instagram", "YouTube"];
const statuses: ContentStatus[] = ["Idea", "Draft", "Review", "Scheduled", "Published"];
const team = ["Ava Morgan", "Mateo Silva", "Zoë Laurent", "Jonah Brooks"];

export const sampleContent: ContentItem[] = [
  { id: "c-1", title: "October product story", date: "2026-10-05", channel: "Blog", status: "Published", assignee: "Ava Morgan", campaign: "Autumn launch" },
  { id: "c-2", title: "Builder spotlight", date: "2026-10-08", channel: "LinkedIn", status: "Published", assignee: "Zoë Laurent" },
  { id: "c-3", title: "Workflow tips carousel", date: "2026-10-13", channel: "Instagram", status: "Scheduled", assignee: "Ava Morgan", campaign: "Always on" },
  { id: "c-4", title: "Release notes digest", date: "2026-10-16", channel: "Email", status: "Review", assignee: "Mateo Silva" },
  { id: "c-5", title: "30-second product tour", date: "2026-10-21", channel: "YouTube", status: "Draft", assignee: "Jonah Brooks", campaign: "Autumn launch" },
  { id: "c-6", title: "Customer results recap", date: "2026-10-27", channel: "LinkedIn", status: "Idea", assignee: "Zoë Laurent" },
  { id: "c-7", title: "Month-end newsletter", date: "2026-10-30", channel: "Email", status: "Draft", assignee: "Mateo Silva" },
];

const statusStyle: Record<ContentStatus, string> = {
  Idea: "border-slate-700 bg-slate-900/70 text-slate-300",
  Draft: "border-blue-900 bg-blue-950/60 text-blue-300",
  Review: "border-amber-900 bg-amber-950/50 text-amber-300",
  Scheduled: "border-violet-900 bg-violet-950/50 text-violet-300",
  Published: "border-emerald-900 bg-emerald-950/50 text-emerald-300",
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function calendarDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return isoDate(date);
  });
}

function shiftMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  return isoDate(new Date(Date.UTC(year, monthNumber - 1 + amount, 1))).slice(0, 7);
}

function monthLabel(month: string) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
}

export function ContentCalendar({
  items = sampleContent,
  isLoading = false,
  error = null,
  initialMonth = "2026-10",
  onItemChange,
  onItemCreate,
}: ContentCalendarProps) {
  const [localItems, setLocalItems] = useState(items);
  const [month, setMonth] = useState(initialMonth);
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [creatingOn, setCreatingOn] = useState<string | null>(null);
  const dialogRef = useRef<HTMLFormElement>(null);

  useEffect(() => setLocalItems(items), [items]);
  useEffect(() => {
    if (editing || creatingOn) window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("input")?.focus());
  }, [editing, creatingOn]);

  const days = useMemo(() => calendarDays(month), [month]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return localItems.filter((item) =>
      (!needle || `${item.title} ${item.campaign ?? ""}`.toLowerCase().includes(needle)) &&
      (channel === "all" || item.channel === channel) &&
      (assignee === "all" || item.assignee === assignee) &&
      (status === "all" || item.status === status));
  }, [localItems, query, channel, assignee, status]);

  const moveItem = (id: string, date: string) => {
    const current = localItems.find((item) => item.id === id);
    if (!current || current.date === date) return;
    const next = { ...current, date };
    setLocalItems((values) => values.map((item) => item.id === id ? next : item));
    onItemChange?.(next);
  };

  const dropOn = (event: DragEvent<HTMLDivElement>, date: string) => {
    event.preventDefault();
    moveItem(event.dataTransfer.getData("text/content-id"), date);
  };

  const saveItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const date = String(data.get("date") ?? "").trim();
    if (!title || !date) return;
    const next: ContentItem = {
      id: editing?.id ?? `content-${Date.now()}`,
      title,
      date,
      channel: data.get("channel") as ContentChannel,
      status: data.get("status") as ContentStatus,
      assignee: String(data.get("assignee") ?? team[0]),
      campaign: String(data.get("campaign") ?? "").trim() || undefined,
    };
    if (editing) {
      setLocalItems((values) => values.map((item) => item.id === next.id ? next : item));
      onItemChange?.(next);
    } else {
      setLocalItems((values) => [...values, next]);
      onItemCreate?.(next);
    }
    setEditing(null);
    setCreatingOn(null);
  };

  if (isLoading) return <section className="min-h-[560px] rounded-2xl border border-[#282828] bg-[#0D0D0D] p-6" role="status" aria-live="polite"><div className="h-10 w-72 animate-pulse rounded bg-[#202020]" /><div className="mt-7 grid grid-cols-7 gap-1">{Array.from({ length: 35 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded bg-[#171717]" />)}</div><span className="sr-only">Loading content calendar</span></section>;
  if (error) return <section className="rounded-2xl border border-red-900/70 bg-red-950/20 p-8" role="alert"><h2 className="font-semibold text-red-200">Content calendar could not be loaded</h2><p className="mt-2 text-sm text-red-300/80">{error}</p></section>;

  const hasActiveFilters = query || channel !== "all" || assignee !== "all" || status !== "all";
  const published = localItems.filter((item) => monthKey(item.date) === month && item.status === "Published").length;
  const planned = localItems.filter((item) => monthKey(item.date) === month).length;

  return <section className="min-h-screen bg-[#090909] px-3 py-7 text-[#F5F5F5] sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-5 border-b border-[#292929] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="font-mono text-xs uppercase tracking-[.24em] text-[#D4AF37]">Content operations</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Editorial calendar</h1><p className="mt-2 text-sm text-[#9CA3AF]">Plan every channel, owner, and deadline in one clear view.</p></div>
        <div className="flex flex-wrap gap-3"><div className="rounded-xl border border-[#292929] bg-[#111] px-4 py-2"><span className="font-mono text-xl text-[#E8C547]">{planned}</span><span className="ml-2 text-xs text-[#9CA3AF]">planned</span></div><div className="rounded-xl border border-[#292929] bg-[#111] px-4 py-2"><span className="font-mono text-xl text-emerald-400">{published}</span><span className="ml-2 text-xs text-[#9CA3AF]">published</span></div><button type="button" onClick={() => setCreatingOn(`${month}-01`)} className="rounded-xl bg-[#D4AF37] px-5 py-2 text-sm font-bold text-black hover:bg-[#E8C547] focus:outline-none focus:ring-2 focus:ring-white">+ New content</button></div>
      </header>

      <div className="my-5 grid gap-3 rounded-2xl border border-[#292929] bg-[#101010] p-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-[#9CA3AF]">Search<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or campaign" className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white outline-none focus:border-[#D4AF37]" /></label>
        <label className="text-xs text-[#9CA3AF]">Channel<select value={channel} onChange={(event) => setChannel(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white"><option value="all">All channels</option>{channels.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs text-[#9CA3AF]">Owner<select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white"><option value="all">All owners</option>{team.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs text-[#9CA3AF]">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white"><option value="all">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#292929] bg-[#0D0D0D]">
        <div className="flex items-center justify-between border-b border-[#292929] p-4"><button type="button" onClick={() => setMonth((value) => shiftMonth(value, -1))} aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-lg border border-[#343434] hover:bg-[#1B1B1B]">←</button><div className="text-center"><h2 className="text-xl font-bold">{monthLabel(month)}</h2><button type="button" onClick={() => setMonth(initialMonth)} className="mt-1 text-xs text-[#D4AF37]">Return to current month</button></div><button type="button" onClick={() => setMonth((value) => shiftMonth(value, 1))} aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-lg border border-[#343434] hover:bg-[#1B1B1B]">→</button></div>
        <div className="grid grid-cols-7 border-b border-[#292929] bg-[#111]">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-2 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-[#777] sm:text-xs">{day}</div>)}</div>
        <div className="grid grid-cols-7">{days.map((date) => {
          const dayItems = filtered.filter((item) => item.date === date);
          const muted = monthKey(date) !== month;
          return <div key={date} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOn(event, date)} className={`min-h-24 min-w-0 border-b border-r border-[#232323] p-1.5 sm:min-h-36 sm:p-2 ${muted ? "bg-[#0A0A0A] text-[#555]" : "bg-[#0D0D0D]"}`}>
            <div className="mb-1 flex items-center justify-between"><span className="font-mono text-[11px] sm:text-xs">{Number(date.slice(-2))}</span><button type="button" onClick={() => setCreatingOn(date)} aria-label={`Add content on ${date}`} className="hidden h-6 w-6 rounded text-[#777] hover:bg-[#242424] hover:text-white sm:block">+</button></div>
            <div className="min-w-0 space-y-1">{dayItems.map((item) => <button key={item.id} type="button" draggable onDragStart={(event) => event.dataTransfer.setData("text/content-id", item.id)} onClick={() => setEditing(item)} className={`block min-w-0 w-full cursor-grab overflow-hidden rounded-md border px-1.5 py-1.5 text-left text-[10px] leading-tight focus:outline-none focus:ring-2 focus:ring-[#D4AF37] sm:px-2 sm:text-xs ${statusStyle[item.status]}`} title={`${item.channel} · ${item.assignee} · ${item.status}`}><span className="block truncate font-semibold">{item.title}</span><span className="mt-1 hidden truncate opacity-70 sm:block">{item.channel} · {item.assignee.split(" ")[0]}</span></button>)}</div>
          </div>;
        })}</div>
      </div>

      {localItems.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-[#3A3A3A] p-10 text-center" role="status"><h2 className="font-semibold">No content planned yet</h2><p className="mt-2 text-sm text-[#9CA3AF]">Create the first item to start the editorial rhythm.</p></div>}
      {localItems.length > 0 && filtered.length === 0 && hasActiveFilters && <div className="mt-5 rounded-2xl border border-dashed border-[#3A3A3A] p-8 text-center" role="status"><p className="font-semibold">No content matches these filters</p><button type="button" onClick={() => { setQuery(""); setChannel("all"); setAssignee("all"); setStatus("all"); }} className="mt-3 text-sm text-[#D4AF37]">Clear filters</button></div>}
    </div>

    {(editing || creatingOn) && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) { setEditing(null); setCreatingOn(null); } }}><form ref={dialogRef} onSubmit={saveItem} role="dialog" aria-modal="true" aria-labelledby="content-dialog-title" className="w-full max-w-lg rounded-2xl border border-[#343434] bg-[#111] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#D4AF37]">Editorial item</p><h2 id="content-dialog-title" className="mt-1 text-xl font-bold">{editing ? "Edit content" : "Plan content"}</h2></div><button type="button" onClick={() => { setEditing(null); setCreatingOn(null); }} aria-label="Close dialog" className="rounded p-2 text-[#888] hover:bg-[#222] hover:text-white">✕</button></div><div className="mt-5 space-y-4">
      <label className="block text-xs text-[#9CA3AF]">Title<input name="title" required defaultValue={editing?.title ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white outline-none focus:border-[#D4AF37]" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#9CA3AF]">Publish date<input name="date" type="date" required defaultValue={editing?.date ?? creatingOn ?? `${month}-01`} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white" /></label><label className="text-xs text-[#9CA3AF]">Channel<select name="channel" defaultValue={editing?.channel ?? "Blog"} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white">{channels.map((value) => <option key={value}>{value}</option>)}</select></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#9CA3AF]">Owner<select name="assignee" defaultValue={editing?.assignee ?? team[0]} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white">{team.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-xs text-[#9CA3AF]">Status<select name="status" defaultValue={editing?.status ?? "Idea"} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white">{statuses.map((value) => <option key={value}>{value}</option>)}</select></label></div>
      <label className="block text-xs text-[#9CA3AF]">Campaign (optional)<input name="campaign" defaultValue={editing?.campaign ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white" /></label>
    </div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => { setEditing(null); setCreatingOn(null); }} className="rounded-lg border border-[#343434] px-4 py-2 text-sm hover:bg-[#222]">Cancel</button><button type="submit" className="rounded-lg bg-[#D4AF37] px-5 py-2 text-sm font-bold text-black hover:bg-[#E8C547]">Save item</button></div></form></div>}
  </section>;
}

export default ContentCalendar;
