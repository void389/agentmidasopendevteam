import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

export type ContactStatus = "Lead" | "Customer" | "Partner" | "Archived";

export interface Contact {
  id: string;
  name: string;
  initials: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  status: ContactStatus;
  tags: string[];
  lastContacted: string;
  notes: string;
}

interface ContactManagementDashboardProps {
  contacts?: Contact[];
  isLoading?: boolean;
  error?: string | null;
  onCreate?: (contact: Contact) => void | Promise<void>;
  onUpdate?: (contact: Contact) => void | Promise<void>;
  onArchive?: (contact: Contact) => void | Promise<void>;
}

const statuses: ContactStatus[] = ["Lead", "Customer", "Partner", "Archived"];
const palette: Record<ContactStatus, string> = {
  Lead: "border-blue-900 bg-blue-950/50 text-blue-300",
  Customer: "border-emerald-900 bg-emerald-950/50 text-emerald-300",
  Partner: "border-violet-900 bg-violet-950/50 text-violet-300",
  Archived: "border-slate-700 bg-slate-900/60 text-slate-400",
};

export const sampleContacts: Contact[] = [
  { id: "ct-1", name: "Maya Chen", initials: "MC", title: "VP of Product", company: "Northstar Labs", email: "maya@northstarlabs.co", phone: "+1 415 555 0121", status: "Customer", tags: ["Enterprise", "Product"], lastContacted: "2026-10-22", notes: "Expanding the automation rollout in Q1." },
  { id: "ct-2", name: "Owen Wright", initials: "OW", title: "Founder", company: "Fieldnote", email: "owen@fieldnote.io", phone: "+1 212 555 0184", status: "Lead", tags: ["Founder", "SaaS"], lastContacted: "2026-10-19", notes: "Requested a security overview and team pricing." },
  { id: "ct-3", name: "Priya Raman", initials: "PR", title: "Operations Director", company: "Crescent Health", email: "priya@crescent.health", phone: "+1 617 555 0177", status: "Customer", tags: ["Healthcare", "Operations"], lastContacted: "2026-10-23", notes: "Quarterly review scheduled for November." },
  { id: "ct-4", name: "Luca Moretti", initials: "LM", title: "Growth Lead", company: "LumenWorks", email: "luca@lumenworks.dev", phone: "+44 20 7946 0180", status: "Partner", tags: ["Agency", "Referral"], lastContacted: "2026-10-15", notes: "Planning a joint webinar for developer teams." },
  { id: "ct-5", name: "Amara Okafor", initials: "AO", title: "Head of People", company: "Atlas Commerce", email: "amara@atlascommerce.com", phone: "+1 312 555 0144", status: "Lead", tags: ["Commerce", "People"], lastContacted: "2026-10-11", notes: "Interested in onboarding and knowledge workflows." },
  { id: "ct-6", name: "Noah Williams", initials: "NW", title: "Engineering Manager", company: "Blue Oak", email: "noah@blueoak.app", phone: "+1 206 555 0108", status: "Archived", tags: ["Engineering"], lastContacted: "2026-08-27", notes: "Paused evaluation until next budget cycle." },
];

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function sameContact(left: Contact, right: Contact) {
  return left.id === right.id && left.name === right.name && left.title === right.title && left.company === right.company && left.email === right.email && left.phone === right.phone && left.status === right.status && left.tags.join("|") === right.tags.join("|") && left.lastContacted === right.lastContacted && left.notes === right.notes;
}

export function ContactManagementDashboard({
  contacts = sampleContacts,
  isLoading = false,
  error = null,
  onCreate,
  onUpdate,
  onArchive,
}: ContactManagementDashboardProps) {
  const [localContacts, setLocalContacts] = useState(contacts);
  const [selectedId, setSelectedId] = useState(contacts[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [company, setCompany] = useState("all");
  const [tag, setTag] = useState("all");
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLFormElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pendingChangesRef = useRef(new Map<string, Contact>());

  useEffect(() => {
    const incoming = new Map(contacts.map((contact) => [contact.id, contact]));
    for (const [id, pending] of pendingChangesRef.current) {
      const confirmed = incoming.get(id);
      if (confirmed && sameContact(confirmed, pending)) pendingChangesRef.current.delete(id);
    }
    const merged = [...incoming.values()].map((contact) => pendingChangesRef.current.get(contact.id) ?? contact).concat([...pendingChangesRef.current.values()].filter((contact) => !incoming.has(contact.id)));
    setLocalContacts(merged);
    setSelectedId((current) => merged.some((contact) => contact.id === current) ? current : merged[0]?.id ?? "");
  }, [contacts]);
  useEffect(() => {
    if (editing) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("input")?.focus());
    }
  }, [editing]);

  const companies = useMemo(() => Array.from(new Set(localContacts.map((contact) => contact.company))).sort(), [localContacts]);
  const tags = useMemo(() => Array.from(new Set(localContacts.flatMap((contact) => contact.tags))).sort(), [localContacts]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return localContacts.filter((contact) =>
      (!needle || `${contact.name} ${contact.company} ${contact.email} ${contact.title}`.toLowerCase().includes(needle)) &&
      (status === "all" || contact.status === status) &&
      (company === "all" || contact.company === company) &&
      (tag === "all" || contact.tags.includes(tag)));
  }, [localContacts, query, status, company, tag]);
  const selected = localContacts.find((contact) => contact.id === selectedId) ?? filtered[0];

  const closeDialog = () => {
    setEditing(null);
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Escape" && !isSaving) { event.preventDefault(); closeDialog(); return; }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button, input, textarea, select, [tabindex]:not([tabindex='-1'])") ?? []).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const saveContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const current = editing === "new" ? null : editing;
    const next: Contact = {
      id: current?.id ?? `contact-${Date.now()}`,
      name,
      initials: initials(name),
      title: String(data.get("title") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      status: data.get("status") as ContactStatus,
      tags: String(data.get("tags") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
      lastContacted: current?.lastContacted ?? "2026-10-24",
      notes: String(data.get("notes") ?? "").trim(),
    };
    setIsSaving(true);
    setOperationError(null);
    try {
      if (current) {
        await onUpdate?.(next);
        pendingChangesRef.current.set(next.id, next);
        setLocalContacts((values) => values.map((contact) => contact.id === next.id ? next : contact));
      } else {
        await onCreate?.(next);
        pendingChangesRef.current.set(next.id, next);
        setLocalContacts((values) => [next, ...values]);
        setSelectedId(next.id);
      }
      closeDialog();
    } catch {
      setOperationError("The contact could not be saved. Check the connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const archiveContact = async (contact: Contact) => {
    const next = { ...contact, status: "Archived" as const };
    setOperationError(null);
    try {
      await onArchive?.(next);
      pendingChangesRef.current.set(next.id, next);
      setLocalContacts((values) => values.map((value) => value.id === next.id ? next : value));
    } catch {
      setOperationError("The contact could not be archived. Please try again.");
    }
  };

  if (isLoading) return <section className="min-h-[560px] rounded-2xl border border-[#292929] bg-[#0D0D0D] p-7" role="status" aria-live="polite"><div className="h-10 w-72 animate-pulse rounded bg-[#202020]" /><div className="mt-8 grid gap-4 md:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-[#171717]" />)}</div><span className="sr-only">Loading contacts</span></section>;
  if (error) return <section className="rounded-2xl border border-red-900/70 bg-red-950/20 p-8" role="alert"><h2 className="font-semibold text-red-200">Contacts could not be loaded</h2><p className="mt-2 text-sm text-red-300/80">{error}</p></section>;

  const activeCount = localContacts.filter((contact) => contact.status !== "Archived").length;
  return <section className="min-h-screen bg-[#090909] px-4 py-8 text-[#F5F5F5] sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-5 border-b border-[#292929] pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-xs uppercase tracking-[.24em] text-[#D4AF37]">Relationship workspace</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Contacts</h1><p className="mt-2 text-sm text-[#9CA3AF]">Keep every customer, lead, and partner within reach.</p></div><div className="flex items-center gap-3"><span className="rounded-xl border border-[#292929] bg-[#111] px-4 py-3 font-mono text-xs text-[#9CA3AF]"><b className="mr-2 text-lg text-[#E8C547]">{activeCount}</b>active</span><button type="button" onClick={() => setEditing("new")} className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black hover:bg-[#E8C547]">+ Add contact</button></div></header>
    {operationError && <div className="mt-5 flex items-center justify-between rounded-xl border border-red-900/70 bg-red-950/20 px-4 py-3 text-sm text-red-200" role="alert"><span>{operationError}</span><button type="button" onClick={() => setOperationError(null)} aria-label="Dismiss error">✕</button></div>}
    <div className="my-5 grid gap-3 rounded-2xl border border-[#292929] bg-[#101010] p-4 md:grid-cols-2 lg:grid-cols-4"><label className="text-xs text-[#9CA3AF]">Search<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, company, email" className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white outline-none focus:border-[#D4AF37]" /></label><label className="text-xs text-[#9CA3AF]">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white"><option value="all">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-xs text-[#9CA3AF]">Company<select value={company} onChange={(event) => setCompany(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white"><option value="all">All companies</option>{companies.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-xs text-[#9CA3AF]">Tag<select value={tag} onChange={(event) => setTag(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white"><option value="all">All tags</option>{tags.map((value) => <option key={value}>{value}</option>)}</select></label></div>
    {localContacts.length === 0 ? <div className="rounded-2xl border border-dashed border-[#3A3A3A] p-12 text-center" role="status"><h2 className="text-lg font-semibold">No contacts yet</h2><p className="mt-2 text-sm text-[#9CA3AF]">Add the first relationship to build your workspace.</p></div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-[#3A3A3A] p-10 text-center" role="status"><h2 className="font-semibold">No contacts match these filters</h2><button type="button" onClick={() => { setQuery(""); setStatus("all"); setCompany("all"); setTag("all"); }} className="mt-3 text-sm text-[#D4AF37]">Clear filters</button></div> : <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><div className="overflow-hidden rounded-2xl border border-[#292929] bg-[#0D0D0D]"><div className="hidden grid-cols-[1.5fr_1fr_1fr_auto] gap-4 border-b border-[#292929] bg-[#111] px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-[#777] sm:grid"><span>Contact</span><span>Company</span><span>Last contacted</span><span>Status</span></div>{filtered.map((contact) => <button key={contact.id} type="button" onClick={() => setSelectedId(contact.id)} className={`grid w-full gap-3 border-b border-[#232323] px-5 py-4 text-left transition sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-center ${selected?.id === contact.id ? "bg-[#D4AF37]/[.07]" : "hover:bg-[#151515]"}`}><span className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 font-mono text-xs text-[#E8C547]">{contact.initials}</span><span className="min-w-0"><b className="block truncate text-sm">{contact.name}</b><small className="mt-1 block truncate text-[#777]">{contact.title}</small></span></span><span className="truncate text-sm text-[#9CA3AF]">{contact.company}</span><span className="text-xs text-[#777]">{formatDate(contact.lastContacted)}</span><span className={`w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] ${palette[contact.status]}`}>{contact.status}</span></button>)}</div>
      {selected && <aside className="h-fit rounded-2xl border border-[#292929] bg-[#0D0D0D] p-5"><div className="flex items-start justify-between"><span className="grid h-14 w-14 place-items-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 font-mono text-sm text-[#E8C547]">{selected.initials}</span><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${palette[selected.status]}`}>{selected.status}</span></div><h2 className="mt-4 text-xl font-bold">{selected.name}</h2><p className="mt-1 text-sm text-[#9CA3AF]">{selected.title} · {selected.company}</p><div className="mt-5 space-y-2 border-y border-[#292929] py-4 text-sm"><a href={`mailto:${selected.email}`} className="block text-[#E8C547] hover:underline">{selected.email}</a><a href={`tel:${selected.phone.replace(/\s/g, "")}`} className="block text-[#9CA3AF] hover:text-white">{selected.phone}</a></div><div className="mt-4 flex flex-wrap gap-2">{selected.tags.map((value) => <span key={value} className="rounded bg-[#1B1B1B] px-2 py-1 text-xs text-[#9CA3AF]">{value}</span>)}</div><p className="mt-4 text-sm leading-6 text-[#9CA3AF]">{selected.notes}</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => setEditing(selected)} className="flex-1 rounded-lg border border-[#3A3A3A] px-3 py-2 text-sm hover:border-[#D4AF37]">Edit</button>{selected.status !== "Archived" && <button type="button" onClick={() => void archiveContact(selected)} className="rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-950/30">Archive</button>}</div></aside>}
    </div>}
  </div>
  {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && !isSaving) closeDialog(); }}><form ref={dialogRef} onSubmit={saveContact} onKeyDown={handleDialogKeyDown} role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#343434] bg-[#111] p-6"><div className="flex justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#D4AF37]">Contact record</p><h2 id="contact-dialog-title" className="mt-1 text-xl font-bold">{editing === "new" ? "Add contact" : "Edit contact"}</h2></div><button type="button" onClick={closeDialog} disabled={isSaving} aria-label="Close dialog" className="rounded p-2 text-[#888] hover:bg-[#222] disabled:opacity-50">✕</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#9CA3AF]">Name<input name="name" required defaultValue={editing === "new" ? "" : editing.name} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white" /></label><label className="text-xs text-[#9CA3AF]">Job title<input name="title" required defaultValue={editing === "new" ? "" : editing.title} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white" /></label><label className="text-xs text-[#9CA3AF]">Company<input name="company" required defaultValue={editing === "new" ? "" : editing.company} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white" /></label><label className="text-xs text-[#9CA3AF]">Status<select name="status" defaultValue={editing === "new" ? "Lead" : editing.status} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white">{statuses.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-xs text-[#9CA3AF]">Email<input name="email" type="email" required defaultValue={editing === "new" ? "" : editing.email} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white" /></label><label className="text-xs text-[#9CA3AF]">Phone<input name="phone" type="tel" required defaultValue={editing === "new" ? "" : editing.phone} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white" /></label><label className="text-xs text-[#9CA3AF] sm:col-span-2">Tags (comma separated)<input name="tags" defaultValue={editing === "new" ? "" : editing.tags.join(", ")} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white" /></label><label className="text-xs text-[#9CA3AF] sm:col-span-2">Notes<textarea name="notes" rows={3} defaultValue={editing === "new" ? "" : editing.notes} className="mt-2 w-full rounded-lg border border-[#343434] bg-[#090909] p-3 text-sm text-white" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={closeDialog} disabled={isSaving} className="rounded-lg border border-[#343434] px-4 py-2 text-sm disabled:opacity-50">Cancel</button><button type="submit" disabled={isSaving} className="rounded-lg bg-[#D4AF37] px-5 py-2 text-sm font-bold text-black disabled:opacity-60">{isSaving ? "Saving…" : "Save contact"}</button></div></form></div>}
  </section>;
}

export default ContactManagementDashboard;
