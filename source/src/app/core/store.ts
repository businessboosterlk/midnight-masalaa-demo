// The demo's one store. Every number comes from the proven engine (public/engine.js, judged 189 of 189
// against checks/reference-engine.mjs) reading the seeded jobs (public/seed.js). Nothing here does scoring.
import { Injectable, signal } from '@angular/core';
import { OUTLETS } from './outlets';
const FIX_TITLE = ['Bring the cold room down to 3 °C', 'Check the gas line and burners', 'Clean the extraction hood', 'Clear the floor and drains', 'Cover the dinner shift'];

export type ScreenKey = 'home' | 'jobs' | 'approvals' | 'scoreboard' | 'myday' | 'myscore' | 'reports' | 'ready';
export type SheetName = 'assign' | 'dispatched' | 'job' | 'nudge' | 'approve' | 'reject' | 'drill' | 'role' | 'bell' | 'reassign' | 'blocked' | 'moretime' | 'more';
export type DerivedState = 'not_started' | 'in_progress' | 'blocked' | 'awaiting' | 'overdue' | 'completed' | 'cancelled';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Scene = 'gauge' | 'blurry' | 'shelf' | 'sheet' | 'doc' | 'generic' | 'before' | 'reference';
export type Proof = 'live' | 'any' | 'checklist';
export type Photo = { scene: Scene; label: string; at?: string };
export interface Rejection { at: string; by: string; reason: string; comment?: string; redoBy?: string }

export interface Job {
  ref: string; title: string; desc: string; dept: string; assignee: string; createdBy: string; createdAt: string;
  startAt?: string; due: string; extension?: { to: string; at: string; by: string }; priority: Priority;
  evidence: { required: boolean; kind: string; proof?: Proof }; approvalRequired: boolean; state: string; progress: number;
  submittedAt?: string; approvedAt?: string; rating?: { stars: number; by: string; at: string; comment?: string };
  rejections: Rejection[]; photos: Photo[]; reference?: Photo; before?: Photo;
  audit: { at: string; who: string; what: string }[]; blockedReason?: string; cancelReason?: string;
  outcome?: string; repeat?: Repeat; timeRequest?: { to: string; reason: string; at: string }; readyLink?: string; subtasks?: { text: string; done: boolean }[]; files?: string[]; team?: string[];
}
export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly';
export interface ScoreRow {
  ref: string; title: string; assignee: string; state: DerivedState; due: number; extended: boolean;
  counted: boolean; ontime: boolean | null; stars: number | null; rejections: number;
}
export type QualityEvent = { kind: 'rating'; ref: string; stars: number; pts: number } | { kind: 'rejection'; ref: string; reason: string; minus: number };
export interface Score {
  cohort: number; completed: number; completionPct: number | null; ontimeN: number; ontimeD: number;
  ontimePct: number | null; ratingCount: number; ratingAvgPct: number | null; rejectionCount: number;
  qualityPct: number | null; overall: number | null; cancelledExcluded: number;
  qualityEvents: QualityEvent[]; rows: ScoreRow[];
}
export interface Counts { total: number; overdue: number; awaiting: number; dueToday: number; dueTomorrow: number; completed: number; inProgress: number; cancelled: number; }
export interface JobDraft {
  title: string; desc: string; dept: string; emps: string[]; startDate: string; dueDate: string; dueTime: string;
  prio: Priority; evReq: boolean; evKind: string; approvalReq: boolean; outcome: string; repeat: Repeat;
  subtasks: string[]; files: string[]; proof: Proof; reference: boolean; before: boolean; readyLink?: string;
}
export type Filter = null | { dept: string } | { emp: string };
export interface Reminder { icon: string; text: string; when: string; }
export interface Seat { id: string; name: string; title: string; pin: string; }
export type Coaching = { kind: 'na' } | { kind: 'there'; from: number } | { kind: 'reach'; n: number; from: number; to: number } | { kind: 'quality'; from: number };
export type HurtKind = 'open' | 'late' | 'returned' | 'rating';
export interface Hurt { ref: string; title: string; kind: HurtKind; why: string; cost: number; }
// SAMPLE shift times for the demo; the blueprint takes Midnight Masalaa's real shift times
export const SHIFTS = [{ key: 'open', label: 'Opening', time: '11:00', days: 0 }, { key: 'lunch', label: 'Lunch handover', time: '15:00', days: 0 },
  { key: 'close', label: 'Closing', time: '23:00', days: 0 }, { key: 'tomorrow', label: 'Tomorrow morning', time: '09:00', days: 1 }];

interface Seed {
  demoNow: string; periodStart: string; periodLabel: string; company: string; companyShort: string;
  excellentMin: number; departments: { key: string; name: string }[];
  employees: { id: string; name: string; depts: string[] }[]; jobs: Job[];
}
declare global { interface Window { MM_SEED: Seed; MM_ENGINE: any; MM_STORE?: DemoStore; } }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATE_ORDER: Record<DerivedState, number> = { overdue: 0, awaiting: 1, blocked: 2, in_progress: 3, not_started: 4, completed: 5, cancelled: 6 };

@Injectable({ providedIn: 'root' })
export class DemoStore {
  private readonly S = window.MM_SEED;
  private readonly E = window.MM_ENGINE;

  readonly now = Date.parse(this.S.demoNow);
  readonly periodLabel = this.S.periodLabel;
  readonly companyShort = this.S.companyShort;
  readonly departments = this.S.departments;
  readonly employees = this.S.employees;

  readonly role = signal<string>('director');
  readonly screen = signal<ScreenKey>('home');
  readonly jobs = signal<Job[]>(structuredClone(this.S.jobs));
  readonly excellentMin = signal<number>(this.S.excellentMin);
  readonly boardView = signal<'board' | 'list'>('board');
  readonly filters = signal({ q: '', dept: '', state: '', prio: '', emp: '', from: '', to: '' });
  readonly sheets = signal<{ name: SheetName; param?: string }[]>([]);
  readonly toastMessage = signal<string | null>(null);
  readonly toastUndo = signal<(() => void) | null>(null);
  // DEMO sign in: seats live in the page, nothing is checked by a server. The real build signs in properly.
  readonly seats: Seat[] = [
    { id: 'director', name: 'Director', title: 'Every department', pin: '1111' },
    { id: 'ruwan', name: 'Ruwan Siriwardena', title: 'Maintenance fitter', pin: '2222' },
    { id: 'nadeesha', name: 'Nadeesha Kumari', title: 'Central Kitchen supervisor', pin: '3333' },
    { id: 'pradeep', name: 'Pradeep Kumar', title: 'Maintenance fitter', pin: '4444' },
  ];
  readonly signedIn = signal<string | null>(null);
  readonly theme = signal<'light' | 'dark'>('light');

  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly pendingRetires: number[] = [];

  constructor() {
    history.scrollRestoration = 'manual';
    window.addEventListener('popstate', () => {
      if (this.pendingRetires.length) { this.pendingRetires.shift(); return; }
      if (this.sheets().length) this.sheets.update(s => s.slice(0, -1));
    });
    window.MM_STORE = this;
    // the open review link: ?as=director (or a staff seat id) signs in straight away, for outside reviewers
    const as = new URLSearchParams(location.search).get('as');
    if (as && this.seats.some(x => x.id === as)) { this.role.set(as); this.signedIn.set(as); this.screen.set(as === 'director' ? 'home' : 'myday'); }
    document.documentElement.dataset['theme'] = this.theme();
    this.markSeat();
  }
  // staff seats get 52px targets on a phone (gloves, wet hands); the Director keeps the 44px desk density
  private markSeat(): void { document.documentElement.dataset['seat'] = this.role() === 'director' ? 'director' : 'staff'; }

  // ---------- reads ----------
  counts(): Counts { return this.E.counts(this.S, this.jobs(), this.now); }
  score(filter: Filter): Score { return this.E.score(this.S, this.jobs(), this.now, filter); }
  myDay(empId: string): { dueToday: Job[]; overdue: Job[]; returned: Job[] } { return this.E.myDay(this.S, this.jobs(), this.now, empId); }
  brief(): { overdue: number; awaiting: number; approvedYesterday: number; worst: { key: string; name: string; overall: number } } {
    return this.E.brief(this.S, this.jobs(), this.now);
  }
  bandFor(overall: number | null): { key: 'excellent' | 'verygood' | 'satisfactory' | 'needswork' | 'poor' | 'na'; label: string } {
    return this.E.bandFor(overall, this.excellentMin());
  }
  derivedState(job: Job): DerivedState { return this.E.derivedState(job, this.now); }
  effectiveDue(job: Job): number { return this.E.effectiveDue(job); }
  nudgeCounts(ref: string): { asked: number; attached: number } {
    const j = this.job(ref); const m = (j.evidence.kind || '').match(/\d+/);
    return { asked: m ? +m[0] : 0, attached: j.photos.length };
  }
  filteredJobs(): Job[] {
    const f = this.filters(); const q = f.q.trim().toLowerCase();
    return this.visibleJobs().filter(j =>
      (!q || j.title.toLowerCase().includes(q) || j.ref.toLowerCase().includes(q) || this.empName(j.assignee).toLowerCase().includes(q))
      && (!f.dept || j.dept === f.dept) && (!f.prio || j.priority === f.prio)
      && (!f.emp || j.assignee === f.emp)
      && (!f.from || this.effectiveDue(j) >= Date.parse(f.from + 'T00:00:00+05:30'))
      && (!f.to || this.effectiveDue(j) <= Date.parse(f.to + 'T23:59:59.999+05:30'))
      && (!f.state || this.derivedState(j) === f.state || (f.state === 'blocked' && j.state === 'blocked')
        || (f.state === 'upcoming' && !['approved', 'cancelled', 'submitted'].includes(j.state) && this.effectiveDue(j) >= this.now)))
      .sort((a, b) => (STATE_ORDER[this.derivedState(a)] - STATE_ORDER[this.derivedState(b)]) || (this.effectiveDue(a) - this.effectiveDue(b)));
  }
  reminders(): Reminder[] {
    const out: Reminder[] = [];
    for (const j of this.visibleJobs()) {
      const st = this.derivedState(j), due = this.effectiveDue(j);
      if (st === 'overdue') out.push({ icon: 'triangle-alert', text: `${j.title} is overdue (${this.empName(j.assignee)})`, when: `Was due ${this.fmtDay(due)}, ${this.fmtTime(due)}` });
      if (j.timeRequest && st !== 'completed' && st !== 'cancelled') out.push({ icon: 'clock', text: `${this.empName(j.assignee)} asks for more time on ${j.title}`, when: `Until ${this.fmtDay(Date.parse(j.timeRequest.to))}, ${this.fmtTime(Date.parse(j.timeRequest.to))}: ${j.timeRequest.reason}` });
      if (j.state === 'blocked') out.push({ icon: 'hand', text: `${j.title} is blocked (${this.empName(j.assignee)})`, when: j.blockedReason || 'No reason given' });
      else if (st === 'awaiting') out.push({ icon: 'clock', text: `${j.title} is waiting for your approval`, when: `Submitted ${this.fmtDay(Date.parse(j.submittedAt!))}, ${this.fmtTime(Date.parse(j.submittedAt!))}` });
      else if (st !== 'completed' && st !== 'cancelled' && this.E.dayKey(due) === this.E.dayKey(this.now) && due >= this.now)
        out.push({ icon: 'bell', text: `${j.title} is due today at ${this.fmtTime(due)}`, when: this.empName(j.assignee) });
    }
    return out;
  }
  job(ref: string): Job { return this.jobs().find(j => j.ref === ref)!; }
  // Demo view scoping only. Production must enforce this in the database and API.
  visibleJobs(): Job[] { return this.role() === 'director' ? this.jobs() : this.jobs().filter(j => j.assignee === this.role()); }
  clearFilters(): void { this.filters.set({ q: '', dept: '', state: '', prio: '', emp: '', from: '', to: '' }); }
  decisionJobs(): Job[] {
    return this.jobs().filter(j => !['approved', 'cancelled'].includes(j.state) && (j.timeRequest || j.state === 'blocked' || j.state === 'submitted'))
      .sort((a, b) => Number(b.priority === 'Urgent') - Number(a.priority === 'Urgent') || this.effectiveDue(a) - this.effectiveDue(b));
  }
  decisionLabel(j: Job): string { return j.timeRequest ? 'Decide extension' : j.state === 'blocked' ? 'Resolve blocker' : 'Review evidence'; }
  updateProgress(ref: string, progress: number, note: string): boolean {
    const j = this.job(ref);
    if (!j || (this.role() !== 'director' && j.assignee !== this.role()) || !['not_started', 'in_progress', 'blocked'].includes(j.state)) return false;
    if (!Number.isInteger(progress) || progress < 0 || progress > 100 || !note.trim() || note.length > 2000) return false;
    this.patch(ref, x => {
      const was = x.progress; x.progress = progress;
      if (x.state === 'not_started' && progress > 0) x.state = 'in_progress';
      this.log(x, this.role(), `Progress ${was}% to ${progress}%: ${note.trim()}`);
    });
    this.toast('Update saved in this demo. Submit separately when the work is ready.'); return true;
  }
  deptName(key: string): string { return (this.departments.find(d => d.key === key) || { name: key }).name; }
  empName(id: string): string { return id === 'Director' || id === 'director' ? 'Director' : (this.employees.find(e => e.id === id) || { name: id }).name; }
  empsOf(dept: string) { return this.employees.filter(e => e.depts.includes(dept)); }
  private local(ms: number): Date { return new Date(ms + 5.5 * 3600e3); }
  fmtDay(ms: number): string { const d = this.local(ms); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; }
  fmtTime(ms: number): string { const d = this.local(ms); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; }

  // ---------- navigation and sheets (the store owns phone Back) ----------
  nav(s: ScreenKey): void { this.closeAll(); this.screen.set(s); window.scrollTo(0, 0); }
  signIn(name: string, pin: string): boolean {
    const n = name.trim().toLowerCase();
    const seat = this.seats.find(x => (x.name.toLowerCase() === n || x.name.split(' ')[0].toLowerCase() === n) && x.pin === pin.trim());
    if (!seat) return false;
    this.setRole(seat.id); return true;
  }
  signOut(): void { this.closeAll(); this.signedIn.set(null); this.role.set('director'); this.markSeat(); window.scrollTo(0, 0); }
  seatTitle(id: string): string { return (this.seats.find(x => x.id === id) || { title: '' }).title; }
  toggleTheme(): void { this.theme.update(t => t === 'light' ? 'dark' : 'light'); document.documentElement.dataset['theme'] = this.theme(); }
  setRole(id: string): void { this.closeAll(); this.signedIn.set(id); this.role.set(id); this.markSeat(); this.screen.set(id === 'director' ? 'home' : 'myday'); window.scrollTo(0, 0); }
  setFilters(f: Partial<{ q: string; dept: string; state: string; prio: string; emp: string; from: string; to: string }>): void { this.filters.update(x => ({ ...x, ...f })); }
  setBoardView(v: 'board' | 'list'): void { this.boardView.set(v); }
  setExcellentMin(n: number): void { if (Number.isFinite(n)) this.excellentMin.set(Math.round(n)); }
  openPdf(): void { window.open('MM-Monthly-Report-SAMPLE.pdf', '_blank'); }

  openSheet(name: SheetName, param?: string, tries = 0): void {
    // history.go is async: an open that lands mid-traversal would be popped by it, so wait it out
    if (this.pendingRetires.length && tries < 8) { setTimeout(() => this.openSheet(name, param, tries + 1), 40); return; }
    this.pendingRetires.length = 0;
    this.sheets.update(s => [...s, { name, param }]);
    history.pushState({ mmSheets: this.sheets().length }, '');
  }
  closeSheet(): void {
    if (!this.sheets().length) return;
    this.sheets.update(s => s.slice(0, -1));
    this.retire(1);
  }
  private closeAll(): void { const n = this.sheets().length; if (!n) return; this.sheets.set([]); this.retire(n); }
  private retire(n: number): void { if (n > 0) { this.pendingRetires.push(n); history.go(-n); } }

  toast(msg: string, undo?: () => void): void {
    this.toastMessage.set(msg); this.toastUndo.set(undo ?? null); clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMessage.set(null); this.toastUndo.set(null); }, undo ? 6000 : 2800);
  }
  undoLast(): void {
    const u = this.toastUndo(); if (!u) return;
    clearTimeout(this.toastTimer); this.toastUndo.set(null); u();
  }
  // the one approval queue: oldest submission first (the Approvals screen and the approve sheet's auto advance both read it)
  approvalQueue(): Job[] {
    return this.jobs().filter(j => j.state === 'submitted').sort((a, b) => {
      const x = a.submittedAt ?? '', y = b.submittedAt ?? '';
      return x === y ? a.ref.localeCompare(b.ref) : x < y ? -1 : 1;
    });
  }
  // workload beside each name in Assign: open jobs and jobs due today, counted from the live list
  workload(empId: string): { open: number; dueToday: number } {
    let open = 0, dueToday = 0;
    for (const j of this.jobs()) {
      if (j.assignee !== empId) continue;
      const st = this.derivedState(j); if (st === 'completed' || st === 'cancelled' || st === 'awaiting') continue;
      open++; if (this.E.dayKey(this.effectiveDue(j)) === this.E.dayKey(this.now)) dueToday++;
    }
    return { open, dueToday };
  }
  shiftDate(days: number): string { return new Date(Date.parse(this.today() + 'T12:00:00Z') + days * 86400e3).toISOString().slice(0, 10); }
  // a time today in Colombo as an ISO string (redo deadlines)
  isoIn(minutes: number): string { return new Date(this.now + minutes * 60e3).toISOString(); }
  isoAt(hhmm: string): string { return new Date(Date.parse(`${this.today()}T${hhmm}:00+05:30`)).toISOString(); }

  // ---------- Reports (in the brief): the same engine, two periods ----------
  // "Last 7 days" is the engine run with the period starting seven days before the frozen clock; nothing else changes.
  periodStart(p: 'month' | 'week'): string { return p === 'month' ? this.S.periodStart : new Date(this.now - 7 * 864e5).toISOString(); }
  periodText(p: 'month' | 'week'): string { return p === 'month' ? this.periodLabel : 'Last 7 days, ' + this.fmtDay(this.now - 7 * 864e5) + ' to ' + this.fmtDay(this.now); }
  scoreIn(p: 'month' | 'week', filter: Filter): Score { return this.E.score({ ...this.S, periodStart: this.periodStart(p) }, this.jobs(), this.now, filter); }
  reportCsv(p: 'month' | 'week', dept: string): string {
    const rows = dept ? this.empsOf(dept).map(e => ({ name: e.name, s: this.scoreIn(p, { emp: e.id }) })) : this.departments.map(d => ({ name: d.name, s: this.scoreIn(p, { dept: d.key }) }));
    const n = (v: number | null) => v === null ? 'N/A' : (Math.round(v * 10) / 10).toFixed(1);
    const head = [dept ? 'Person' : 'Department', 'Jobs due', 'Completed', 'Completion %', 'On time %', 'Quality %', 'Score', 'Band'];
    const body = rows.map(r => [r.name, r.s.cohort, r.s.completed, n(r.s.completionPct), n(r.s.ontimePct), n(r.s.qualityPct), n(r.s.overall), this.bandFor(r.s.overall).label]);
    return '\ufeff' + [head, ...body].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  }
  readonly lastDownload = signal('');
  downloadReport(p: 'month' | 'week', dept: string): void {
    const name = `Midnight-Masalaa-report-${p === 'month' ? 'October' : 'last-7-days'}${dept ? '-' + dept : ''}.csv`;
    const url = URL.createObjectURL(new Blob([this.reportCsv(p, dept)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000); this.lastDownload.set(name); this.toast('Downloaded ' + name + '. It opens in Excel.');
  }

  // ---------- Ready for service (ADD-ON): sample outlet checks plus the real open jobs that name the outlet ----------
  readonly outlets = OUTLETS;
  outletJobs(key: string): Job[] {
    const o = OUTLETS.find(x => x.key === key)!;
    return this.jobs().filter(j => j.title.toLowerCase().includes(o.match) && !['completed', 'cancelled'].includes(this.derivedState(j)));
  }
  // a check that failed and has had a job raised for it reads the job's state, from the live list
  checkJob(key: string, i: number): Job | undefined { return this.jobs().find(j => j.readyLink === key + ':' + i); }
  readiness(key: string): { state: 'ready' | 'risk' | 'unknown'; failed: number; unknown: number; risky: number; awaiting: number } {
    const o = OUTLETS.find(x => x.key === key)!; const jobs = this.outletJobs(key);
    const failed = o.checks.filter((c, i) => c.state === 'failed' && this.derivedState(this.checkJob(key, i) ?? ({ state: 'x' } as any)) !== 'completed').length;
    const unknown = o.checks.filter(c => c.state === 'unknown').length;
    const risky = jobs.filter(j => ['overdue', 'blocked'].includes(this.derivedState(j))).length;
    const awaiting = jobs.filter(j => this.derivedState(j) === 'awaiting').length;
    // no report never means ready: an unknown check keeps the outlet out of Ready
    return { state: failed || risky ? 'risk' : unknown ? 'unknown' : 'ready', failed, unknown, risky, awaiting };
  }
  readyDraft(param: string): JobDraft {
    const [, key, i] = param.split(':'); const o = OUTLETS.find(x => x.key === key)!; const c = o.checks[+i];
    return { ...this.blankDraft(), title: `${FIX_TITLE[+i]}, ${o.name}`,
      desc: `Failed on the service check at ${o.name}${c.note ? ': ' + c.note : ''}. Needed before ${o.service.toLowerCase()}.`,
      dept: +i === 4 ? 'fro' : 'mnt', dueTime: '16:30', prio: 'Urgent', evKind: 'Photo showing it fixed', readyLink: key + ':' + i };
  }
  nudgeOutlet(name: string): void { this.toast(`Sample: the real build reminds the ${name} supervisor to send the missing checks.`); }

  // ---------- coaching, computed by the ENGINE itself on what if job lists (never typed, never guessed) ----------
  // Next N on time: add N approved, on time, unrated jobs to this person's month and ask the engine for the score.
  // Unrated means quality stays exactly where it is, so the line reads "at your current quality".
  coaching(empId: string): Coaching {
    const base = this.score({ emp: empId }); if (base.overall === null) return { kind: 'na' };
    const min = this.excellentMin();
    if (this.E.bandFor(base.overall, min).key === 'excellent') return { kind: 'there', from: base.overall };
    const extra: Job[] = [];
    for (let n = 1; n <= 20; n++) {
      extra.push(this.whatIfJob(empId, n));
      const s = this.E.score(this.S, [...this.jobs(), ...extra], this.now, { emp: empId });
      if (this.E.bandFor(s.overall, min).key === 'excellent') return { kind: 'reach', n, from: base.overall, to: s.overall };
    }
    return { kind: 'quality', from: base.overall };
  }
  private whatIfJob(empId: string, n: number): Job {
    const at = (ms: number) => new Date(ms).toISOString();
    return { ref: 'WHATIF-' + n, title: '', desc: '', dept: '', assignee: empId, createdBy: 'Director', createdAt: at(this.now - 864e5),
      due: at(this.now - 60e3), priority: 'Medium', evidence: { required: false, kind: '' }, approvalRequired: true, state: 'approved',
      progress: 100, submittedAt: at(this.now - 120e3), approvedAt: at(this.now - 60e3), rejections: [], photos: [], audit: [] };
  }
  // What hurt my score: for every row behind the score, fix that one job and ask the engine what the score would be.
  // The cost is the engine's difference, rounded only on screen.
  whatHurt(empId: string): Hurt[] {
    const base = this.score({ emp: empId }); if (base.overall === null) return [];
    const out: Hurt[] = [];
    const cost = (ref: string, fix: (j: Job) => void): number => {
      const list = this.jobs().map(j => { if (j.ref !== ref) return j; const c = structuredClone(j); fix(c); return c; });
      const s = this.E.score(this.S, list, this.now, { emp: empId });
      return s.overall === null ? 0 : s.overall - base.overall!;
    };
    const inPeriod = (at: string) => Date.parse(this.S.periodStart) <= Date.parse(at) && Date.parse(at) <= this.now;
    for (const r of base.rows) {
      if (!r.counted) {
        const why = r.state === 'awaiting' ? 'Waiting for approval, it counts once approved' : r.state === 'overdue' ? 'Overdue, not done yet' : 'Due this month, not completed yet';
        out.push({ ref: r.ref, title: r.title, kind: 'open', why, cost: cost(r.ref, j => { const due = new Date(this.effectiveDue(j)).toISOString(); j.state = 'approved'; j.submittedAt = due; j.approvedAt = due; delete j.rating; }) });
      } else if (r.ontime === false) {
        out.push({ ref: r.ref, title: r.title, kind: 'late', why: 'Submitted after the deadline', cost: cost(r.ref, j => { j.submittedAt = new Date(this.effectiveDue(j)).toISOString(); }) });
      }
    }
    for (const j of this.jobs().filter(x => x.assignee === empId)) {
      const n = j.rejections.filter(r => inPeriod(r.at)).length;
      if (n) out.push({ ref: j.ref, title: j.title, kind: 'returned', why: n === 1 ? 'Returned once for a fix' : `Returned ${n} times for a fix`, cost: cost(j.ref, c => { c.rejections = c.rejections.filter(r => !inPeriod(r.at)); }) });
      if (j.rating && j.rating.stars < 5 && inPeriod(j.rating.at)) out.push({ ref: j.ref, title: j.title, kind: 'rating', why: `Rated ${j.rating.stars} of 5`, cost: cost(j.ref, c => { c.rating = { ...c.rating!, stars: 5 }; }) });
    }
    // a cost is points LOST, so the engine's difference is positive when fixing the job would raise the score
    return out.filter(h => h.cost >= 0.05).sort((a, b) => b.cost - a.cost);
  }

  // ---------- actions ----------
  voiceDraft(): JobDraft {
    return { title: 'Replace chiller door gasket', desc: 'Cold room two door seal is leaking. Replace the gasket before dinner service.',
      dept: 'mnt', emps: ['ruwan'], startDate: this.today(), dueDate: this.today(), dueTime: '17:00', prio: 'High', evReq: true,
      evKind: 'Photo of the gauge', approvalReq: true, outcome: 'Door seals fully, chiller holds 3 degrees', repeat: 'none', subtasks: [], files: [],
      proof: 'live', reference: false, before: false };
  }
  today(): string { return this.S.demoNow.slice(0, 10); }
  dueIso(d: JobDraft): string { return `${d.dueDate}T${d.dueTime}:00+05:30`; }
  blankDraft(): JobDraft {
    return { title: '', desc: '', dept: '', emps: [], startDate: this.today(), dueDate: this.today(), dueTime: '17:00', prio: 'Medium',
      evReq: true, evKind: 'Photo of the finished work', approvalReq: true, outcome: '', repeat: 'none', subtasks: [], files: [],
      proof: 'live', reference: false, before: false };
  }
  // Snap to assign: the Director photographs a problem on the floor and the form opens around the photo (sample photo)
  snapDraft(): JobDraft { return { ...this.blankDraft(), before: true, desc: 'Snapped on the floor at ' + this.fmtTime(this.now) + '. See the photo.' }; }
  private photo(scene: Scene, label: string): Photo { return { scene, label, at: this.S.demoNow }; }
  private nextRef(): string { return this.E.refNext(this.jobs()); }
  private patch(ref: string, fn: (j: Job) => void): void {
    this.jobs.update(list => list.map(j => { if (j.ref !== ref) return j; const c = structuredClone(j); fn(c); return c; }));
  }
  private log(j: Job, who: string, what: string): void { j.audit = [...j.audit, { at: this.S.demoNow, who, what }]; }

  // a team job is one copy per person, linked by its team list, so every person is scored on their own work
  dispatch(d: JobDraft): string {
    const refs: string[] = [];
    for (const emp of d.emps) {
      const ref = this.nextRef(); refs.push(ref);
      const job: Job = { ref, title: d.title.trim(), desc: d.desc.trim(), dept: d.dept, assignee: emp, createdBy: 'Director',
        createdAt: this.S.demoNow, startAt: d.startDate + 'T08:00:00+05:30', due: this.dueIso(d), priority: d.prio,
        evidence: { required: d.proof !== 'checklist' && d.evReq, kind: d.evKind.trim() || 'Photo of the finished work', proof: d.proof }, approvalRequired: d.approvalReq,
        readyLink: d.readyLink, reference: d.reference ? this.photo('reference', 'Must look like this') : undefined, before: d.before ? this.photo('before', 'Before, from the Director') : undefined,
        state: 'not_started', progress: 0, rejections: [], photos: [], outcome: d.outcome.trim(), repeat: d.repeat,
        subtasks: d.subtasks.map(t => ({ text: t, done: false })), files: [...d.files], team: d.emps.length > 1 ? [...d.emps] : undefined,
        audit: [{ at: this.S.demoNow, who: 'Director', what: 'Created and assigned to ' + this.empName(emp) + (d.emps.length > 1 ? ' (team of ' + d.emps.length + ')' : '') }] };
      this.jobs.update(l => [...l, job]);
    }
    this.closeAll();
    this.openSheet('dispatched', refs.join(','));
    return refs[0];
  }
  toggleSubtask(ref: string, i: number): void {
    this.patch(ref, j => { if (j.subtasks && j.subtasks[i]) { j.subtasks = j.subtasks.map((t, k) => k === i ? { ...t, done: !t.done } : t); this.log(j, j.assignee, (j.subtasks[i].done ? 'Ticked: ' : 'Unticked: ') + j.subtasks[i].text); } });
  }
  editJob(ref: string, d: JobDraft): void {
    this.patch(ref, j => { j.title = d.title.trim(); j.desc = d.desc.trim(); j.dept = d.dept; j.assignee = d.emps[0] || j.assignee; j.due = this.dueIso(d);
      j.priority = d.prio; j.evidence = { required: d.proof !== 'checklist' && d.evReq, kind: d.evKind.trim() || 'Photo of the finished work', proof: d.proof };
      j.reference = d.reference ? (j.reference || this.photo('reference', 'Must look like this')) : undefined;
      j.approvalRequired = d.approvalReq; j.outcome = d.outcome.trim(); j.repeat = d.repeat; j.files = [...d.files];
      j.subtasks = d.subtasks.map(t => (j.subtasks || []).find(x => x.text === t) || { text: t, done: false });
      this.log(j, 'Director', 'Edited by the Director'); });
    this.closeAll(); this.toast(`Job ${ref} updated`);
  }
  startJob(ref: string): void {
    this.patch(ref, j => { if (j.state !== 'not_started') return; j.state = 'in_progress'; j.startAt = this.S.demoNow; this.log(j, j.assignee, 'Started, status In Progress'); });
  }
  attachPhoto(ref: string): void {
    this.patch(ref, j => {
      const k = (j.evidence.kind || '').toLowerCase();
      const scene: Scene = k.includes('gauge') ? 'gauge' : k.includes('quote') ? 'doc' : 'generic';
      j.photos = [...j.photos, this.photo(scene, 'IMG_' + (2140 + j.photos.length + this.jobs().length) + '.jpg')];
      if (j.state === 'not_started') { j.state = 'in_progress'; j.startAt = j.startAt || this.S.demoNow; }
      this.log(j, j.assignee, 'Evidence attached');
    });
  }
  submitJob(ref: string): 'submitted' | 'needs-evidence' | 'nudge' {
    const j = this.job(ref);
    if (!j || j.assignee !== this.role() || !['not_started', 'in_progress'].includes(j.state)) { this.toast('This job cannot be submitted from your current role or stage.'); return 'needs-evidence'; }
    if (j.subtasks?.some(t => !t.done)) { this.toast('Finish every required checklist step before submitting.'); return 'needs-evidence'; }
    if (j.evidence.required && !j.photos.length) { this.toast('Evidence required first: ' + j.evidence.kind); return 'needs-evidence'; }
    const c = this.nudgeCounts(ref);
    if (c.asked && c.attached < c.asked) { this.toast('Attach all the requested evidence before submitting.'); return 'needs-evidence'; }
    this.doSubmit(ref); return 'submitted';
  }
  confirmNudge(ref: string): void { this.closeSheet(); this.submitJob(ref); }
  private doSubmit(ref: string): void {
    if (this.job(ref).approvalRequired === false) {
      this.patch(ref, j => { j.state = 'approved'; j.submittedAt = this.S.demoNow; j.approvedAt = this.S.demoNow; j.progress = 100; this.log(j, j.assignee, 'Completed, no approval needed on this job'); });
      this.toast('Completed. This job did not need approval.'); return;
    }
    this.patch(ref, j => { j.state = 'submitted'; j.submittedAt = this.S.demoNow; j.progress = 100; this.log(j, j.assignee, 'Submitted for approval, evidence attached'); });
    this.toast('Submitted. Awaiting approval, not completed yet.');
  }
  // Approve, then move straight to the next submission when the sheet was opened from the queue (one sheet deep).
  // Returns the next ref the sheet now shows, or null when it closed.
  approve(ref: string, stars: 1 | 2 | 3 | 4 | 5, note = ''): string | null {
    if (this.role() !== 'director' || this.job(ref)?.state !== 'submitted' || ![1,2,3,4,5].includes(stars)) { this.toast('This submission is no longer available for approval.'); return null; }
    const before = structuredClone(this.job(ref)); const queue = this.approvalQueue(); const at = queue.findIndex(j => j.ref === ref);
    let who = '';
    this.patch(ref, j => { who = j.assignee; j.state = 'approved'; j.approvedAt = this.S.demoNow;
      j.rating = { stars, by: 'Director', at: this.S.demoNow, comment: note.trim() || undefined };
      this.log(j, 'Director', `Approved, quality ${stars} of 5` + (note.trim() ? '. Coaching note: ' + note.trim() : '')); });
    const rest = queue.filter(j => j.ref !== ref); const next = rest.length ? (rest[at] ?? rest[0]).ref : null;
    const first = this.empName(who).split(' ')[0];
    const approved = this.job(ref);
    const undo = () => {
      if (this.job(ref) !== approved) { this.toast('This job changed after approval. Review it before reversing the decision.'); return; }
      this.log(before, 'Director', 'Approval reversed in the demo');
      this.jobs.update(list => list.map(j => j.ref === ref ? before : j)); this.toast(`Approval undone. ${ref} is back in the queue.`);
    };
    const top = this.sheets()[this.sheets().length - 1];
    if (next && this.sheets().length === 1 && top?.name === 'approve') {
      this.sheets.update(s => [{ ...s[0], param: next }]);
      this.toast(`Approved in the demo. ${rest.length} more waiting. Notification delivery is simulated.`, undo); return next;
    }
    this.closeAll(); this.toast(next ? 'Approved in the demo. Notification delivery is simulated.' : 'Approved. Nothing else is waiting.', undo);
    return null;
  }
  reject(ref: string, reason: string, comment = '', redoBy?: string): void {
    if (this.role() !== 'director' || this.job(ref)?.state !== 'submitted' || !reason.trim()) { this.toast('A current submission and a reason are required.'); return; }
    const before = structuredClone(this.job(ref));
    this.patch(ref, j => { j.state = 'in_progress'; j.progress = 60;
      j.rejections = [...j.rejections, { at: this.S.demoNow, by: 'Director', reason, comment: comment.trim() || undefined, redoBy }];
      this.log(j, 'Director', 'Rejected: ' + reason + (comment.trim() ? '. ' + comment.trim() : '') + (redoBy ? '. Redo by ' + this.fmtTime(Date.parse(redoBy)) : '')); });
    const rejected = this.job(ref);
    this.closeAll();
    this.toast('Returned' + (redoBy ? ', redo by ' + this.fmtTime(Date.parse(redoBy)) : '') + '. The score still reads the original deadline.',
      () => { if (this.job(ref) !== rejected) { this.toast('This job has changed. Review it before undoing.'); return; }
        this.log(before, 'Director', 'Return decision reversed in the demo');
        this.jobs.update(list => list.map(j => j.ref === ref ? before : j)); this.toast(`Rejection undone. ${ref} is back in the queue.`); });
  }
  reassign(ref: string, emp: string, reason: string): void {
    const from = this.job(ref).assignee;
    this.patch(ref, j => { j.assignee = emp; this.log(j, 'Director', `Reassigned from ${this.empName(from)} to ${this.empName(emp)}: ${reason}`); });
    this.closeSheet(); this.toast(`Reassigned to ${this.empName(emp).split(' ')[0]}. Both of them have been told.`);
  }
  block(ref: string, reason: string): void {
    this.patch(ref, j => { j.state = 'blocked'; j.blockedReason = reason; this.log(j, j.assignee, 'Blocked: ' + reason); });
    this.closeSheet(); this.toast('The Director has been told. The deadline still stands.');
  }
  // Ask for more time: the person proposes a new deadline, only the Director's yes moves it. An approved extension is
  // the engine's own extension field, so the score reads the new deadline and the history keeps both.
  requestTime(ref: string, toIso: string, reason: string): void {
    this.patch(ref, j => { j.timeRequest = { to: toIso, reason, at: this.S.demoNow };
      this.log(j, j.assignee, `Asked for more time, until ${this.fmtDay(Date.parse(toIso))} ${this.fmtTime(Date.parse(toIso))}: ${reason}`); });
    this.closeSheet(); this.toast('Asked. The Director decides; the current deadline stands until then.');
  }
  decideTime(ref: string, yes: boolean): void {
    let who = '';
    this.patch(ref, j => { const r = j.timeRequest; if (!r) return; who = j.assignee; const was = this.effectiveDue(j);
      if (yes) { j.extension = { to: r.to, at: this.S.demoNow, by: 'Director' };
        this.log(j, 'Director', `More time given: due moved from ${this.fmtDay(was)} ${this.fmtTime(was)} to ${this.fmtDay(Date.parse(r.to))} ${this.fmtTime(Date.parse(r.to))} (${r.reason})`); }
      else this.log(j, 'Director', 'More time declined, the deadline stays ' + this.fmtDay(was) + ' ' + this.fmtTime(was));
      j.timeRequest = undefined; });
    this.toast(yes ? `More time given. ${this.empName(who).split(' ')[0]} has been told.` : 'Declined. The deadline stays.');
  }
  // the staff side of the queue: what this person submitted that is still waiting for the Director
  waitingFor(empId: string): Job[] { return this.approvalQueue().filter(j => j.assignee === empId); }
  waitedFor(iso?: string): string {
    if (!iso) return ''; const m = Math.max(0, Math.round((this.now - Date.parse(iso)) / 60e3));
    return m < 60 ? m + ' min' : m < 1440 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : Math.floor(m / 1440) + (m < 2880 ? ' day' : ' days');
  }
  unblock(ref: string): void {
    this.patch(ref, j => { j.state = 'in_progress'; j.blockedReason = undefined; this.log(j, j.assignee, 'Unblocked, carrying on'); });
    this.toast('Back in progress.');
  }
}
