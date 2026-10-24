import { useMemo, useState } from "react";

export interface EmployeeProfile {
  id: string;
  name: string;
  title: string;
  department: "Executive" | "Engineering" | "Design" | "Marketing" | "Sales" | "Operations";
  location: string;
  email: string;
  phone: string;
  managerId: string | null;
  pronouns: string;
  skills: string[];
  status: "Available" | "Focus time" | "Out of office";
}

export interface EmployeeDirectoryProps {
  employees?: EmployeeProfile[];
  loading?: boolean;
  error?: string | null;
}

export const DEFAULT_EMPLOYEES: EmployeeProfile[] = [
  { id: "maya", name: "Maya Chen", title: "Chief Executive Officer", department: "Executive", location: "New York, NY", email: "maya.chen@example.com", phone: "+1 212 555 0101", managerId: null, pronouns: "she/her", skills: ["Strategy", "Partnerships"], status: "Available" },
  { id: "jonah", name: "Jonah Brooks", title: "VP of Engineering", department: "Engineering", location: "Austin, TX", email: "jonah.brooks@example.com", phone: "+1 512 555 0102", managerId: "maya", pronouns: "he/him", skills: ["Architecture", "Platform"], status: "Focus time" },
  { id: "amara", name: "Amara Okafor", title: "Design Director", department: "Design", location: "London, UK", email: "amara.okafor@example.com", phone: "+44 20 7946 0103", managerId: "maya", pronouns: "she/her", skills: ["Design systems", "Research"], status: "Available" },
  { id: "diego", name: "Diego Morales", title: "VP of Revenue", department: "Sales", location: "Miami, FL", email: "diego.morales@example.com", phone: "+1 305 555 0104", managerId: "maya", pronouns: "he/him", skills: ["Enterprise sales", "Forecasting"], status: "Available" },
  { id: "priya", name: "Priya Raman", title: "Operations Lead", department: "Operations", location: "Toronto, ON", email: "priya.raman@example.com", phone: "+1 416 555 0105", managerId: "maya", pronouns: "she/her", skills: ["People operations", "Planning"], status: "Out of office" },
  { id: "lena", name: "Lena Fischer", title: "Staff Frontend Engineer", department: "Engineering", location: "Berlin, DE", email: "lena.fischer@example.com", phone: "+49 30 555 0106", managerId: "jonah", pronouns: "she/her", skills: ["React", "Accessibility"], status: "Available" },
  { id: "sam", name: "Sam Patel", title: "Senior Backend Engineer", department: "Engineering", location: "Austin, TX", email: "sam.patel@example.com", phone: "+1 512 555 0107", managerId: "jonah", pronouns: "they/them", skills: ["APIs", "Data"], status: "Focus time" },
  { id: "noah", name: "Noah Williams", title: "Product Designer", department: "Design", location: "London, UK", email: "noah.williams@example.com", phone: "+44 20 7946 0108", managerId: "amara", pronouns: "he/him", skills: ["Prototyping", "Content design"], status: "Available" },
  { id: "sofia", name: "Sofia Alvarez", title: "Account Executive", department: "Sales", location: "Miami, FL", email: "sofia.alvarez@example.com", phone: "+1 305 555 0109", managerId: "diego", pronouns: "she/her", skills: ["Fintech", "Negotiation"], status: "Available" },
  { id: "ethan", name: "Ethan Kim", title: "Growth Marketing Manager", department: "Marketing", location: "San Francisco, CA", email: "ethan.kim@example.com", phone: "+1 415 555 0110", managerId: "diego", pronouns: "he/him", skills: ["Lifecycle", "Analytics"], status: "Focus time" },
  { id: "zuri", name: "Zuri Bennett", title: "Customer Operations Specialist", department: "Operations", location: "Toronto, ON", email: "zuri.bennett@example.com", phone: "+1 416 555 0111", managerId: "priya", pronouns: "she/her", skills: ["Support", "Enablement"], status: "Available" },
  { id: "lucas", name: "Lucas Silva", title: "Software Engineer", department: "Engineering", location: "São Paulo, BR", email: "lucas.silva@example.com", phone: "+55 11 5550 0112", managerId: "jonah", pronouns: "he/him", skills: ["TypeScript", "Testing"], status: "Available" },
];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function ProfileCard({ employee, onSelect }: { employee: EmployeeProfile; onSelect: (employee: EmployeeProfile) => void }) {
  const statusColor = employee.status === "Available" ? "bg-emerald-400" : employee.status === "Focus time" ? "bg-amber-400" : "bg-slate-500";
  return (
    <article className="group rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D] p-5 transition hover:border-[#B8860B] hover:bg-[#141414]">
      <div className="flex items-start gap-4">
        <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 font-mono text-sm font-bold text-[#E8C547]">
          {initials(employee.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-[#F5F5F5]">{employee.name}</h3>
          <p className="truncate text-sm text-[#9CA3AF]">{employee.title}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#9CA3AF]">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${statusColor}`} />
            <span>{employee.status}</span>
          </div>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[#2A2A2A] pt-4 text-xs">
        <div><dt className="text-[#6B7280]">Department</dt><dd className="mt-1 text-[#F5F5F5]">{employee.department}</dd></div>
        <div><dt className="text-[#6B7280]">Location</dt><dd className="mt-1 truncate text-[#F5F5F5]">{employee.location}</dd></div>
      </dl>
      <button type="button" onClick={() => onSelect(employee)} className="mt-5 w-full rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-medium text-[#E8C547] transition hover:border-[#E8C547] hover:bg-[#D4AF37]/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#0D0D0D]">
        View profile <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

function OrgNode({ employee, allEmployees, onSelect }: { employee: EmployeeProfile; allEmployees: EmployeeProfile[]; onSelect: (employee: EmployeeProfile) => void }) {
  const reports = allEmployees.filter((candidate) => candidate.managerId === employee.id);
  return (
    <li className="min-w-[15rem]">
      <button type="button" onClick={() => onSelect(employee)} className="w-full rounded-xl border border-[#2A2A2A] bg-[#0D0D0D] p-4 text-left transition hover:border-[#D4AF37] hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
        <span className="block font-semibold text-[#F5F5F5]">{employee.name}</span>
        <span className="mt-1 block text-xs text-[#9CA3AF]">{employee.title}</span>
        <span className="mt-3 inline-block rounded-full bg-[#D4AF37]/10 px-2 py-1 text-xs text-[#E8C547]">{employee.department}</span>
      </button>
      {reports.length > 0 && (
        <ul className="mt-4 grid gap-4 border-l border-[#2A2A2A] pl-4 lg:grid-cols-2">
          {reports.map((report) => <OrgNode key={report.id} employee={report} allEmployees={allEmployees} onSelect={onSelect} />)}
        </ul>
      )}
    </li>
  );
}

export function EmployeeDirectory({ employees = DEFAULT_EMPLOYEES, loading = false, error = null }: EmployeeDirectoryProps) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All departments");
  const [location, setLocation] = useState("All locations");
  const [view, setView] = useState<"directory" | "org">("directory");
  const [selected, setSelected] = useState<EmployeeProfile | null>(null);

  const departments = useMemo(() => ["All departments", ...Array.from(new Set(employees.map((employee) => employee.department)))], [employees]);
  const locations = useMemo(() => ["All locations", ...Array.from(new Set(employees.map((employee) => employee.location)))], [employees]);
  const filteredEmployees = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return employees.filter((employee) => {
      const searchable = [employee.name, employee.title, employee.department, employee.location, ...employee.skills].join(" ").toLocaleLowerCase();
      return (!needle || searchable.includes(needle)) &&
        (department === "All departments" || employee.department === department) &&
        (location === "All locations" || employee.location === location);
    });
  }, [employees, query, department, location]);

  const resetFilters = () => { setQuery(""); setDepartment("All departments"); setLocation("All locations"); };
  const root = employees.find((employee) => employee.managerId === null);

  if (loading) {
    return <section className="min-h-[20rem] bg-[#0A0A0A] px-6 py-20 text-center text-[#9CA3AF]" role="status" aria-live="polite"><div className="mx-auto h-10 w-10 animate-pulse rounded-full border-2 border-[#D4AF37]" /><p className="mt-4">Loading employee directory…</p></section>;
  }

  if (error) {
    return <section className="min-h-[20rem] bg-[#0A0A0A] px-6 py-20 text-center" role="alert"><h1 className="text-xl font-semibold text-[#F5F5F5]">The directory could not be loaded</h1><p className="mt-3 text-sm text-[#9CA3AF]">{error}</p></section>;
  }

  return (
    <section className="min-h-screen bg-[#0A0A0A] px-4 py-10 text-[#F5F5F5] sm:px-6 lg:px-8" aria-labelledby="directory-title">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b border-[#2A2A2A] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#D4AF37]">People directory</p>
            <h1 id="directory-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Meet the team</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9CA3AF]">Find teammates by role, expertise, department, or location, then explore reporting relationships in the organization view.</p>
          </div>
          <div className="inline-flex self-start rounded-lg border border-[#2A2A2A] bg-[#0D0D0D] p-1" role="group" aria-label="Directory view">
            {(["directory", "org"] as const).map((option) => (
              <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)} className={`rounded-md px-4 py-2 text-sm capitalize transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${view === option ? "bg-[#D4AF37] text-[#0A0A0A]" : "text-[#9CA3AF] hover:text-[#F5F5F5]"}`}>
                {option === "org" ? "Org chart" : "Directory"}
              </button>
            ))}
          </div>
        </header>

        {view === "directory" ? (
          <>
            <div className="my-8 grid gap-4 rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D] p-4 md:grid-cols-[2fr_1fr_1fr]">
              <label className="text-xs font-medium text-[#9CA3AF]">Search people
                <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Name, role, skill…" className="mt-2 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#6B7280] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" />
              </label>
              <label className="text-xs font-medium text-[#9CA3AF]">Department
                <select value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-2 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]">
                  {departments.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium text-[#9CA3AF]">Location
                <select value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]">
                  {locations.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <div className="mb-5 flex items-center justify-between text-sm">
              <p aria-live="polite" className="text-[#9CA3AF]">Showing <strong className="text-[#F5F5F5]">{filteredEmployees.length}</strong> of {employees.length} people</p>
              {(query || department !== "All departments" || location !== "All locations") && <button type="button" onClick={resetFilters} className="text-[#E8C547] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">Clear filters</button>}
            </div>
            {filteredEmployees.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredEmployees.map((employee) => <ProfileCard key={employee.id} employee={employee} onSelect={setSelected} />)}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#2A2A2A] py-16 text-center"><h2 className="font-semibold">No teammates found</h2><p className="mt-2 text-sm text-[#9CA3AF]">Try a broader search or clear the current filters.</p><button type="button" onClick={resetFilters} className="mt-5 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#E8C547]">Reset directory</button></div>
            )}
          </>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-[#2A2A2A] bg-[#0A0A0A] p-5 sm:p-8">
            <p className="mb-6 text-sm text-[#9CA3AF]">Select any person to open their profile. Horizontal scrolling keeps the reporting tree readable on small screens.</p>
            {root && <ul className="min-w-[42rem]"><OrgNode employee={root} allEmployees={employees} onSelect={setSelected} /></ul>}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="profile-name" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
            <article className="w-full max-w-lg rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-widest text-[#D4AF37]">Team profile</p><h2 id="profile-name" className="mt-2 text-2xl font-bold">{selected.name}</h2><p className="mt-1 text-[#9CA3AF]">{selected.title} · {selected.pronouns}</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Close profile" className="rounded-lg border border-[#2A2A2A] px-3 py-2 text-[#9CA3AF] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">✕</button></div>
              <dl className="mt-6 grid grid-cols-2 gap-5 border-y border-[#2A2A2A] py-5 text-sm"><div><dt className="text-[#6B7280]">Department</dt><dd className="mt-1">{selected.department}</dd></div><div><dt className="text-[#6B7280]">Location</dt><dd className="mt-1">{selected.location}</dd></div><div><dt className="text-[#6B7280]">Status</dt><dd className="mt-1">{selected.status}</dd></div><div><dt className="text-[#6B7280]">Reports to</dt><dd className="mt-1">{employees.find((employee) => employee.id === selected.managerId)?.name ?? "Board"}</dd></div></dl>
              <div className="mt-5"><h3 className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Expertise</h3><div className="mt-2 flex flex-wrap gap-2">{selected.skills.map((skill) => <span key={skill} className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs text-[#E8C547]">{skill}</span>)}</div></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2"><a href={`mailto:${selected.email}`} className="rounded-lg bg-[#D4AF37] px-4 py-2.5 text-center text-sm font-semibold text-[#0A0A0A] hover:bg-[#E8C547] focus:outline-none focus:ring-2 focus:ring-[#E8C547]">Send email</a><a href={`tel:${selected.phone.replace(/\s/g, "")}`} className="rounded-lg border border-[#D4AF37]/50 px-4 py-2.5 text-center text-sm text-[#E8C547] hover:bg-[#D4AF37]/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">Call {selected.phone}</a></div>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}

export default EmployeeDirectory;
