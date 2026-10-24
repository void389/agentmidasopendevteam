import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

export interface MeetingSlot {
  id: string;
  start: string;
  end: string;
  host: string;
  status: "available" | "blocked";
}

export interface MeetingBooking {
  id: string;
  slotId: string;
  start: string;
  end: string;
  host: string;
  clientName: string;
  clientEmail: string;
  topic: string;
  status: "confirmed" | "cancelled";
}

interface MeetingSchedulerProps {
  slots?: MeetingSlot[];
  bookings?: MeetingBooking[];
  isLoading?: boolean;
  error?: string | null;
  initialTimeZone?: string;
  onCreate?: (booking: MeetingBooking) => void | Promise<void>;
  onReschedule?: (booking: MeetingBooking) => void | Promise<void>;
  onCancel?: (booking: MeetingBooking) => void | Promise<void>;
}

const timeZones = ["America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Singapore"];
const iso = (day: number, hour: number) => `2026-10-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00Z`;

export const sampleSlots: MeetingSlot[] = [25, 26, 27, 28, 29].flatMap((day) => [16, 18, 20].map((hour, index) => ({
  id: `slot-${day}-${index}`,
  start: iso(day, hour),
  end: iso(day, hour + 1),
  host: index === 1 ? "Ava Morgan" : "Jonah Brooks",
  status: day === 27 && index === 1 ? "blocked" as const : "available" as const,
})));

export const sampleBookings: MeetingBooking[] = [
  { id: "booking-1", slotId: "slot-25-0", start: iso(25, 16), end: iso(25, 17), host: "Jonah Brooks", clientName: "Maya Chen", clientEmail: "maya@example.com", topic: "Product discovery", status: "confirmed" },
];

function formatDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone }).format(new Date(value));
}

function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short" }).format(new Date(value));
}

function overlaps(slot: MeetingSlot, booking: MeetingBooking) {
  return booking.status === "confirmed" && slot.start < booking.end && slot.end > booking.start;
}

export function MeetingScheduler({
  slots = sampleSlots,
  bookings = sampleBookings,
  isLoading = false,
  error = null,
  initialTimeZone = "America/Los_Angeles",
  onCreate,
  onReschedule,
  onCancel,
}: MeetingSchedulerProps) {
  const [localBookings, setLocalBookings] = useState(bookings);
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);
  const [rescheduling, setRescheduling] = useState<MeetingBooking | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLFormElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => setLocalBookings(bookings), [bookings]);
  useEffect(() => {
    if (selectedSlot) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("input")?.focus());
    }
  }, [selectedSlot]);

  const available = useMemo(() => slots.filter((slot) => slot.status === "available" && !localBookings.some((booking) => booking.id !== rescheduling?.id && overlaps(slot, booking))), [slots, localBookings, rescheduling]);
  const dates = useMemo(() => Array.from(new Set(available.map((slot) => formatDate(slot.start, timeZone)))), [available, timeZone]);
  const activeDate = selectedDate && dates.includes(selectedDate) ? selectedDate : dates[0] ?? "";
  const visibleSlots = available.filter((slot) => formatDate(slot.start, timeZone) === activeDate);

  const closeDialog = () => {
    setSelectedSlot(null);
    setRescheduling(null);
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Escape" && !isSaving) { event.preventDefault(); closeDialog(); return; }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button, input, [tabindex]:not([tabindex='-1'])") ?? []).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const chooseSlot = (slot: MeetingSlot, booking?: MeetingBooking) => {
    setOperationError(null);
    setRescheduling(booking ?? null);
    setSelectedSlot(slot);
  };

  const saveBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSlot) return;
    const data = new FormData(event.currentTarget);
    const next: MeetingBooking = {
      id: rescheduling?.id ?? `booking-${Date.now()}`,
      slotId: selectedSlot.id,
      start: selectedSlot.start,
      end: selectedSlot.end,
      host: selectedSlot.host,
      clientName: String(data.get("clientName") ?? "").trim(),
      clientEmail: String(data.get("clientEmail") ?? "").trim(),
      topic: String(data.get("topic") ?? "").trim(),
      status: "confirmed",
    };
    setIsSaving(true);
    setOperationError(null);
    try {
      if (rescheduling) {
        await onReschedule?.(next);
        setLocalBookings((values) => values.map((booking) => booking.id === next.id ? next : booking));
      } else {
        await onCreate?.(next);
        setLocalBookings((values) => [...values, next]);
      }
      closeDialog();
    } catch {
      setOperationError("The calendar provider could not save this meeting. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelBooking = async (booking: MeetingBooking) => {
    const next = { ...booking, status: "cancelled" as const };
    setOperationError(null);
    try {
      await onCancel?.(next);
      setLocalBookings((values) => values.map((value) => value.id === booking.id ? next : value));
    } catch {
      setOperationError("The meeting could not be cancelled. Please try again.");
    }
  };

  if (isLoading) return <section className="min-h-[560px] rounded-2xl border border-[#292929] bg-[#0D0D0D] p-8" role="status" aria-live="polite"><div className="h-10 w-64 animate-pulse rounded bg-[#202020]" /><div className="mt-8 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl bg-[#171717]" />)}</div><span className="sr-only">Loading meeting availability</span></section>;
  if (error) return <section className="rounded-2xl border border-red-900/70 bg-red-950/20 p-8" role="alert"><h2 className="font-semibold text-red-200">Availability could not be loaded</h2><p className="mt-2 text-sm text-red-300/80">{error}</p></section>;

  return <section className="min-h-screen bg-[#090909] px-4 py-8 text-[#F5F5F5] sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-[#292929] pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-xs uppercase tracking-[.24em] text-[#D4AF37]">Client meetings</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Find a time that works</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#9CA3AF]">Choose a live opening, confirm your details, and receive a calendar-ready booking.</p></div><label className="text-xs text-[#9CA3AF]">Your timezone<select value={timeZone} onChange={(event) => { setTimeZone(event.target.value); setSelectedDate(""); }} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#111] px-3 text-sm text-white sm:w-56">{timeZones.map((value) => <option key={value}>{value.replaceAll("_", " ")}</option>)}</select></label></header>
      {operationError && <div className="mt-5 flex items-center justify-between rounded-xl border border-red-900/70 bg-red-950/20 px-4 py-3 text-sm text-red-200" role="alert"><span>{operationError}</span><button type="button" onClick={() => setOperationError(null)} aria-label="Dismiss error">✕</button></div>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <main className="rounded-2xl border border-[#292929] bg-[#0D0D0D] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#D4AF37]">October 2026</p><h2 className="mt-1 text-xl font-bold">Available times</h2></div><span className="rounded-full bg-[#1B1B1B] px-3 py-1 font-mono text-xs text-[#9CA3AF]">{available.length} open</span></div>
          {dates.length === 0 ? <div className="mt-8 rounded-xl border border-dashed border-[#3A3A3A] p-10 text-center" role="status"><h3 className="font-semibold">No openings available</h3><p className="mt-2 text-sm text-[#9CA3AF]">Check another week or ask the host to publish more times.</p></div> : <><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5" role="tablist" aria-label="Meeting dates">{dates.map((date) => <button key={date} type="button" role="tab" aria-selected={date === activeDate} onClick={() => setSelectedDate(date)} className={`rounded-xl border px-3 py-3 text-sm ${date === activeDate ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#E8C547]" : "border-[#303030] bg-[#111] text-[#9CA3AF] hover:border-[#555]"}`}>{date}</button>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{visibleSlots.map((slot) => <button key={slot.id} type="button" onClick={() => chooseSlot(slot, rescheduling ?? undefined)} className="group flex items-center justify-between rounded-xl border border-[#303030] bg-[#111] p-4 text-left hover:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"><div><span className="font-semibold">{formatTime(slot.start, timeZone)}</span><span className="mt-1 block text-xs text-[#777]">60 min · {slot.host}</span></div><span className="text-[#D4AF37] transition group-hover:translate-x-1">→</span></button>)}</div></>}
        </main>
        <aside className="rounded-2xl border border-[#292929] bg-[#0D0D0D] p-5"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#D4AF37]">Upcoming</p><h2 className="mt-1 text-xl font-bold">Your meetings</h2><div className="mt-5 space-y-3">{localBookings.filter((booking) => booking.status === "confirmed").map((booking) => <article key={booking.id} className="rounded-xl border border-[#303030] bg-[#111] p-4"><p className="font-semibold">{booking.topic}</p><p className="mt-2 text-xs leading-5 text-[#9CA3AF]">{formatDate(booking.start, timeZone)}<br />{formatTime(booking.start, timeZone)}<br />with {booking.host}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => setRescheduling(booking)} className="rounded-lg border border-[#3A3A3A] px-3 py-2 text-xs hover:border-[#D4AF37]">Reschedule</button><button type="button" onClick={() => void cancelBooking(booking)} className="rounded-lg px-3 py-2 text-xs text-red-300 hover:bg-red-950/30">Cancel</button></div>{rescheduling?.id === booking.id && <p className="mt-3 text-xs text-[#E8C547]" role="status">Choose a new opening from the calendar.</p>}</article>)}{localBookings.every((booking) => booking.status !== "confirmed") && <div className="rounded-xl border border-dashed border-[#3A3A3A] p-6 text-center text-sm text-[#9CA3AF]" role="status">No meetings booked yet.</div>}</div></aside>
      </div>
    </div>

    {selectedSlot && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && !isSaving) closeDialog(); }}><form ref={dialogRef} onSubmit={saveBooking} onKeyDown={handleDialogKeyDown} role="dialog" aria-modal="true" aria-labelledby="booking-title" className="w-full max-w-lg rounded-2xl border border-[#343434] bg-[#111] p-6"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#D4AF37]">{rescheduling ? "New time" : "Booking details"}</p><h2 id="booking-title" className="mt-1 text-xl font-bold">{formatDate(selectedSlot.start, timeZone)} at {formatTime(selectedSlot.start, timeZone)}</h2><p className="mt-2 text-sm text-[#9CA3AF]">60 minutes with {selectedSlot.host}</p></div><button type="button" onClick={closeDialog} disabled={isSaving} aria-label="Close dialog" className="rounded p-2 text-[#888] hover:bg-[#222] disabled:opacity-50">✕</button></div><div className="mt-5 space-y-4"><label className="block text-xs text-[#9CA3AF]">Name<input name="clientName" required defaultValue={rescheduling?.clientName ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white outline-none focus:border-[#D4AF37]" /></label><label className="block text-xs text-[#9CA3AF]">Email<input name="clientEmail" type="email" required defaultValue={rescheduling?.clientEmail ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white outline-none focus:border-[#D4AF37]" /></label><label className="block text-xs text-[#9CA3AF]">What should we discuss?<input name="topic" required defaultValue={rescheduling?.topic ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-[#343434] bg-[#090909] px-3 text-sm text-white outline-none focus:border-[#D4AF37]" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={closeDialog} disabled={isSaving} className="rounded-lg border border-[#343434] px-4 py-2 text-sm hover:bg-[#222] disabled:opacity-50">Back</button><button type="submit" disabled={isSaving} className="rounded-lg bg-[#D4AF37] px-5 py-2 text-sm font-bold text-black hover:bg-[#E8C547] disabled:cursor-wait disabled:opacity-60">{isSaving ? "Saving…" : rescheduling ? "Confirm new time" : "Confirm meeting"}</button></div></form></div>}
  </section>;
}

export default MeetingScheduler;
