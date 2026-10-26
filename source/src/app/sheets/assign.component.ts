// Assign a job, field by field against section 4 of the client's document: title, details, department,
// one person or a team, start date, deadline date and time, priority, expected result, files, evidence,
// approval required, repeats, subtasks. qa/fields-trace.mjs fails the build if any of them goes missing.
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DemoStore, JobDraft, Priority, Proof, Repeat, SHIFTS } from '../core/store';
import { EvidencePhotoComponent } from '../ui/evidence-photo.component';
import { SheetFrameComponent } from '../ui/sheet-frame.component';
import { MmIconComponent } from '../ui/icon.component';
import { AvatarComponent } from '../ui/avatar.component';

@Component({
  selector: 'mm-assign',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent, MmIconComponent, AvatarComponent, EvidencePhotoComponent],
  template: `
    <mm-sheet-frame [title]="editing() ? 'Edit ' + jobRef() : (snap() ? 'Snap to assign' : ready() ? 'Raise a job from the check' : 'Assign a job')" [active]="active()" size="wide">
      <div class="form stack-lg">
        @if (snap()) {
          <section class="snap"><mm-evidence-photo class="thumb" [photo]="beforePhoto" />
            <p class="caption muted">Taken on the Director's phone just now. It goes on the job as the before photo, so the person sees exactly what you saw.</p></section>
        }
        @if (!editing() && !snap() && !ready()) {
          <section class="voice">
            <div class="v-head"><mm-icon name="mic" /><strong>Voice note from the floor</strong><span class="sample-chip">Sample</span></div>
            @if (heard()) {
              <p class="transcript">"Cold room two door seal is leaking again. Get Ruwan to replace the gasket today before dinner service. Photo of the gauge after."</p>
              <button type="button" class="secondary" (click)="useVoice()">Draft the job from this</button>
            } @else {
              <button type="button" class="secondary button-content" (click)="heard.set(true)"><mm-icon name="play" />Play the 9 second note</button>
            }
          </section>
        }

        <section class="grp">
          <h3>The job</h3>
          <label class="field"><span>Job title</span>
            <input type="text" [value]="d().title" (input)="set('title', val($event))" placeholder="What has to be done" enterkeyhint="next" /></label>
          <label class="field"><span>Details</span>
            <textarea (input)="set('desc', val($event))" placeholder="Anything the person needs to know">{{ d().desc }}</textarea></label>
          <label class="field"><span>Expected result</span>
            <input type="text" [value]="d().outcome" (input)="set('outcome', val($event))" placeholder="What done looks like" /></label>
        </section>

        <section class="grp">
          <h3>Who</h3>
          <label class="field"><span>Department</span><span class="select-wrap">
            <select (change)="pickDept(val($event))">
              <option value="" [selected]="!d().dept">Pick a department</option>
              @for (dep of store.departments; track dep.key) { <option [value]="dep.key" [selected]="d().dept === dep.key">{{ dep.name }}</option> }
            </select><mm-icon name="chevron-down" /></span></label>
          <div class="field"><span>Assign to <span class="muted">· tap one person or several for a team job</span></span>
            @if (d().dept) {
              <div class="people" role="group" aria-label="Assign to">
                @for (e of people(); track e.id) {
                  <button type="button" class="person" [attr.aria-pressed]="d().emps.includes(e.id)" (click)="togglePerson(e.id)">
                    <mm-avatar [name]="e.name" size="sm" /><span>{{ e.name }}</span><span class="load">{{ load(e.id) }}</span>
                    @if (d().emps.includes(e.id)) { <mm-icon name="check" /> }
                  </button>
                }
              </div>
              <button type="button" class="link" (click)="everyone.set(!everyone())">{{ everyone() ? 'Only this department' : 'Add someone from another department' }}</button>
              @if (d().emps.length > 1) { <p class="caption muted">Team job: each of the {{ d().emps.length }} people gets their own copy and is scored on their own work.</p> }
            } @else { <p class="caption muted">Pick a department first.</p> }
          </div>
        </section>

        <section class="grp">
          <h3>When</h3>
          <div class="row3">
            <label class="field"><span>Start date</span>
              <input type="date" [value]="d().startDate" [min]="store.today()" (change)="set('startDate', val($event))" /></label>
            <label class="field"><span>Due date</span>
              <input type="date" [value]="d().dueDate" [min]="d().startDate" (change)="set('dueDate', val($event))" /></label>
            <label class="field"><span>Due time</span>
              <input type="time" [value]="d().dueTime" step="900" (change)="set('dueTime', val($event))" /></label>
          </div>
          <div class="field"><span>Quick deadline <span class="muted">· sample shift times</span></span>
            <div class="shifts" role="group" aria-label="Quick deadline">
              @for (sh of shifts; track sh.key) {
                <button type="button" class="shift" [attr.aria-pressed]="d().dueDate === store.shiftDate(sh.days) && d().dueTime === sh.time" (click)="pickShift(sh.days, sh.time)">
                  <span>{{ sh.label }}</span><span class="st">{{ sh.time }}</span></button>
              }
            </div></div>
          <div class="field"><span>Priority</span>
            <div class="segmented" role="group" aria-label="Priority">
              @for (p of prios; track p) { <button type="button" [attr.aria-pressed]="d().prio === p" (click)="set('prio', p)">{{ p }}</button> }
            </div></div>
          <div class="field"><span>Repeats</span>
            <div class="segmented" role="group" aria-label="Repeats">
              @for (r of repeats; track r.v) { <button type="button" [attr.aria-pressed]="d().repeat === r.v" (click)="set('repeat', r.v)">{{ r.t }}</button> }
            </div></div>
        </section>

        <section class="grp">
          <h3>Proof and sign off</h3>
          <div class="field"><span>Proof type</span>
            <div class="segmented" role="group" aria-label="Proof type">
              @for (p of proofs; track p.v) { <button type="button" [attr.aria-pressed]="d().proof === p.v" (click)="pickProof(p.v)">{{ p.t }}</button> }
            </div>
            <span class="caption muted">{{ proofHint() }}</span></div>
          <label class="field"><span>Evidence asked for</span>
            <input type="text" [value]="d().evKind" (input)="set('evKind', val($event))" /></label>
          <div class="field"><span>Must look like this <span class="muted">· a reference photo of the standard</span></span>
            @if (d().reference) {
              <div class="ref-photo"><mm-evidence-photo class="thumb" [photo]="refPhoto" />
                <button type="button" class="link" (click)="set('reference', false)">Remove the reference photo</button></div>
            } @else {
              <button type="button" class="secondary button-content add-ref" (click)="set('reference', true)"><mm-icon name="scan-eye" />Add a reference photo, sample</button>
            }
          </div>
          <label class="toggle"><span><strong>Approval required</strong><br /><span class="caption muted">Counts as completed only once you approve it</span></span>
            <input type="checkbox" [checked]="d().approvalReq" (change)="set('approvalReq', checked($event))" /></label>
        </section>

        <section class="grp">
          <h3>Subtasks</h3>
          @for (t of d().subtasks; track $index; let i = $index) {
            <div class="sub"><mm-icon name="circle-dashed" /><span>{{ t }}</span>
              <button type="button" class="icon-button" [attr.aria-label]="'Remove ' + t" (click)="removeSub(i)"><mm-icon name="x" /></button></div>
          }
          <div class="sub-add"><input type="text" placeholder="Add a step, for example Collect quote 1" [value]="newSub()" (input)="newSub.set(val($event))" (keydown.enter)="addSub(); $event.preventDefault()" enterkeyhint="done" />
            <button type="button" class="secondary" (click)="addSub()">Add</button></div>
        </section>

        <section class="grp">
          <h3>Supporting files</h3>
          <div class="files">
            @for (f of d().files; track f; let i = $index) {
              <span class="chip"><mm-icon name="paperclip" />{{ f }}<button type="button" class="chip-x" [attr.aria-label]="'Remove ' + f" (click)="removeFile(i)"><mm-icon name="x" /></button></span>
            }
            <button type="button" class="secondary button-content" (click)="addFile()"><mm-icon name="paperclip" />Attach a file, sample</button>
          </div>
        </section>

        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      </div>
      <div actions>
        <button type="button" class="primary" (click)="save()">{{ editing() ? 'Save changes' : (d().emps.length > 1 ? 'Dispatch to ' + d().emps.length + ' people' : 'Dispatch the job') }}</button>
        <button type="button" class="cancel" (click)="store.closeSheet()">Cancel</button>
      </div>
    </mm-sheet-frame>
  `,
  styles: `
    .grp { display: grid; gap: 0.875rem; padding-top: 1rem; border-top: 1px solid var(--line); }
    .grp h3 { font-size: 0.8125rem; color: var(--muted); font-weight: 650; }
    .voice { border: 1px solid var(--line); border-radius: var(--radius-md); padding: 0.875rem 1rem; display: grid; gap: 0.625rem; background: var(--raised); }
    .v-head { display: flex; align-items: center; gap: 0.5rem; } .v-head .sample-chip { margin-left: auto; }
    .transcript { font-style: italic; color: var(--muted); }
    .people { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .person { display: inline-flex; align-items: center; gap: 0.5rem; border-radius: 999px; padding: 0.25rem 0.875rem 0.25rem 0.25rem; min-height: 44px; }
    .person[aria-pressed="true"] { border-color: var(--text); background: var(--raised); font-weight: 600; }
    .person mm-icon { width: 16px; height: 16px; }
    .link { border: 0; background: none; padding: 0; min-height: 44px; text-align: left; text-decoration: underline; text-underline-offset: 0.2em; color: var(--muted); justify-self: start; }
    .snap { display: grid; gap: 0.5rem; }
    .load { font-size: var(--text-xs); color: var(--muted); font-weight: 500; }
    .shifts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .shift { display: grid; gap: 0.125rem; padding: 0.5rem; line-height: 1.25; text-align: center; }
    .shift .st { font-size: var(--text-xs); color: var(--muted); font-variant-numeric: tabular-nums; }
    .shift[aria-pressed="true"] { background: var(--text); color: var(--inverse); border-color: var(--text); }
    .shift[aria-pressed="true"] .st { color: inherit; opacity: 0.8; }
    .ref-photo { display: grid; gap: 0.25rem; max-width: 22rem; }
    .add-ref { justify-self: start; }
    .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
    input[type="date"], input[type="time"] { -webkit-appearance: none; appearance: none; min-width: 0; max-width: 100%; height: 44px; }
    .segmented { display: flex; flex-wrap: wrap; }
    .segmented button { flex: 1; min-height: 44px; }
    .toggle { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.625rem 0; }
    .sub { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.5rem; }
    .sub mm-icon { width: 16px; height: 16px; color: var(--muted); }
    .sub-add { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
    .files { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .chip-x { border: 0; background: none; padding: 0; min-height: 0; width: 18px; height: 18px; display: inline-grid; place-items: center; }
    .chip-x mm-icon { width: 12px; height: 12px; }
    .chip-x { position: relative; } .chip-x::before { content: ""; position: absolute; inset: -13px; }
    @media (max-width: 767px) { .row3 { grid-template-columns: 1fr 1fr; } .row3 .field:last-child { grid-column: 1 / -1; } .shifts { grid-template-columns: 1fr 1fr; } }
  `,
})
export class AssignComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  readonly jobRef = input('');
  protected readonly snap = computed(() => this.jobRef() === 'snap');
  protected readonly ready = computed(() => this.jobRef().startsWith('ready:'));
  protected readonly editing = computed(() => !!this.jobRef() && !this.snap() && !this.ready());
  protected readonly shifts = SHIFTS;
  protected readonly proofs: { v: Proof; t: string }[] = [{ v: 'live', t: 'Live photo' }, { v: 'any', t: 'Photo or document' }, { v: 'checklist', t: 'Checklist only' }];
  protected readonly proofHint = computed(() => ({ live: 'Taken in the app at the job, time stamped. The real build blocks old gallery photos.',
    any: 'A photo or a scanned document, for quotes, invoices and signed sheets.', checklist: 'Ticking every subtask is the proof. No photo needed.' })[this.d().proof]);
  protected readonly refPhoto = { scene: 'reference' as const, label: 'Must look like this' };
  protected readonly beforePhoto = { scene: 'before' as const, label: 'Before, from the Director', at: this.store.isoIn(0) };
  protected readonly heard = signal(false);
  protected readonly everyone = signal(false);
  protected readonly error = signal('');
  protected readonly newSub = signal('');
  protected readonly d = signal<JobDraft>(this.store.blankDraft());
  protected readonly people = computed(() => this.everyone() ? this.store.employees : this.store.empsOf(this.d().dept));
  protected readonly prios: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];
  protected readonly repeats: { v: Repeat; t: string }[] = [{ v: 'none', t: 'Never' }, { v: 'daily', t: 'Daily' }, { v: 'weekly', t: 'Weekly' }, { v: 'monthly', t: 'Monthly' }];
  private fileN = 0;

  ngOnInit(): void {
    if (this.snap()) { this.d.set(this.store.snapDraft()); return; }
    if (this.ready()) { this.d.set(this.store.readyDraft(this.jobRef())); return; }
    if (!this.jobRef()) return;
    const j = this.store.job(this.jobRef()); const due = new Date(this.store.effectiveDue(j) + 5.5 * 3600e3).toISOString();
    this.d.set({ title: j.title, desc: j.desc, dept: j.dept, emps: [j.assignee], startDate: (j.startAt || j.createdAt).slice(0, 10),
      dueDate: due.slice(0, 10), dueTime: due.slice(11, 16), prio: j.priority, evReq: j.evidence.required, evKind: j.evidence.kind,
      approvalReq: j.approvalRequired !== false, outcome: j.outcome || '', repeat: j.repeat || 'none',
      subtasks: (j.subtasks || []).map(s => s.text), files: [...(j.files || [])],
      proof: j.evidence.proof || (j.evidence.required ? 'live' : 'checklist'), reference: !!j.reference, before: !!j.before });
  }
  protected val(e: Event): string { return (e.target as HTMLInputElement).value; }
  protected checked(e: Event): boolean { return (e.target as HTMLInputElement).checked; }
  protected set<K extends keyof JobDraft>(k: K, v: JobDraft[K]): void { this.d.update(x => ({ ...x, [k]: v })); this.error.set(''); }
  protected load(id: string): string { const w = this.store.workload(id); return w.dueToday ? w.dueToday + ' due today' : w.open ? w.open + ' open' : 'Free today'; }
  protected pickShift(days: number, time: string): void { this.d.update(x => ({ ...x, dueDate: this.store.shiftDate(days), dueTime: time })); this.error.set(''); }
  protected pickProof(v: Proof): void { this.d.update(x => ({ ...x, proof: v, evReq: v !== 'checklist' })); }
  protected pickDept(key: string): void { this.d.update(x => ({ ...x, dept: key, emps: [] })); this.everyone.set(false); }
  protected togglePerson(id: string): void {
    this.d.update(x => ({ ...x, emps: x.emps.includes(id) ? x.emps.filter(e => e !== id) : (this.editing() ? [id] : [...x.emps, id]) })); this.error.set('');
  }
  protected addSub(): void { const t = this.newSub().trim(); if (!t) return; this.d.update(x => ({ ...x, subtasks: [...x.subtasks, t] })); this.newSub.set(''); }
  protected removeSub(i: number): void { this.d.update(x => ({ ...x, subtasks: x.subtasks.filter((_, k) => k !== i) })); }
  protected addFile(): void { const names = ['Supplier-quote.pdf', 'Floor-plan.jpg', 'Spec-sheet.pdf']; this.d.update(x => ({ ...x, files: [...x.files, names[this.fileN++ % names.length]] })); }
  protected removeFile(i: number): void { this.d.update(x => ({ ...x, files: x.files.filter((_, k) => k !== i) })); }
  protected useVoice(): void { this.d.set(this.store.voiceDraft()); this.error.set(''); }
  protected save(): void {
    const x = this.d();
    if (!x.title.trim()) { this.error.set('Give the job a title.'); return; }
    if (!x.dept || !x.emps.length) { this.error.set('Pick a department and at least one person.'); return; }
    if (x.proof === 'checklist' && !x.subtasks.length) { this.error.set('Checklist only needs at least one subtask to tick.'); return; }
    if (!x.dueDate || !x.dueTime) { this.error.set('Set a due date and time.'); return; }
    if (x.dueDate < x.startDate) { this.error.set('The due date cannot be before the start date.'); return; }
    if (Date.parse(this.store.dueIso(x)) <= this.store.now) { this.error.set('That deadline has already passed. Pick a later time.'); return; }
    if (this.editing()) this.store.editJob(this.jobRef(), x); else this.store.dispatch(x);
  }
}
