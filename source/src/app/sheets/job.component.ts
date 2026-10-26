// One job: what was asked, what was attached, the history, and the next action for whoever is looking.
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';
import { MmIconComponent } from '../ui/icon.component';
import { EvidencePhotoComponent } from '../ui/evidence-photo.component';
import { STATE_ICON, STATE_LABEL } from '../ui/job-card.component';

@Component({
  selector: 'mm-job',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent, MmIconComponent, EvidencePhotoComponent],
  template: `
    <mm-sheet-frame title="Job" [active]="active()">
      <div class="stack-lg">
        <div class="stack">
          <h2 class="job-title">{{ job().title }}</h2>
          <p class="caption muted">{{ job().ref }}</p>
          <div class="cluster">
            <span class="chip" [attr.data-state]="state()"><mm-icon [name]="icon()" />{{ label() }}</span>
            <span class="chip">{{ job().priority }}</span>
            <span class="chip">{{ store.deptName(job().dept) }}</span>
            <span class="chip"><mm-icon name="user-round" />{{ store.empName(job().assignee) }}</span>
          </div>
          @if (job().desc) { <p>{{ job().desc }}</p> }
          <p class="muted">Due {{ store.fmtDay(due()) }} at {{ store.fmtTime(due()) }}@if (job().extension) {, extension approved}</p>
          @if (job().outcome) { <p><span class="muted">Expected result: </span>{{ job().outcome }}</p> }
          <div class="cluster">
            @if (job().repeat && job().repeat !== 'none') { <span class="chip"><mm-icon name="repeat" />Repeats {{ job().repeat }}</span> }
            @if (job().approvalRequired === false) { <span class="chip">No approval needed</span> }
            @if (job().team) { <span class="chip"><mm-icon name="users" />Team of {{ job().team!.length }}</span> }
            @for (f of job().files || []; track f) { <span class="chip"><mm-icon name="paperclip" />{{ f }}</span> }
          </div>
          @if (job().state === 'blocked' && job().blockedReason) { <p class="note">Blocked: {{ job().blockedReason }}. Notification delivery is simulated in this demo.</p> }
        </div>
        @if (job().timeRequest; as r) {
          <p class="note">{{ director() ? store.empName(job().assignee).split(' ')[0] + ' asks' : 'You asked' }} for more time, until {{ store.fmtDay(t(r.to)) }} at {{ store.fmtTime(t(r.to)) }}: {{ r.reason }}.@if (!director()) { Waiting for the Director.}</p>
        }
        @if (state() === 'awaiting' && job().submittedAt) { <p class="caption muted">Waiting for the Director for {{ store.waitedFor(job().submittedAt) }}</p> }
        @if (fix(); as f) {
          <section class="fix stack" aria-label="Fix required">
            <h3>Fix required</h3>
            <p><strong>{{ f.reason }}</strong>@if (f.comment) {<span>. {{ f.comment }}</span>}</p>
            @if (f.redoBy) { <p class="caption">Redo by {{ store.fmtTime(t(f.redoBy)) }} today</p> }
            @if (job().rejections.length > 1) { <p class="caption">Returned {{ job().rejections.length }} times</p> }
          </section>
        }
        @if (job().before; as b) { <section class="stack"><h3>Before</h3><mm-evidence-photo [photo]="b" /></section> }

        <div class="approval-comparison">
          <section class="requirement stack"><h3>Asked for</h3>
            <p>{{ job().evidence.required ? job().evidence.kind : (job().evidence.proof === 'checklist' ? 'Checklist only: tick every subtask' : 'No evidence required') }}</p>
            @if (job().evidence.proof === 'live') { <p class="caption muted">Live photo taken in the app at the job</p> }
            @if (job().reference; as r) { <mm-evidence-photo [photo]="r" /> }</section>
          <section class="stack"><h3>Attached</h3>
            @for (p of job().photos; track $index) { <mm-evidence-photo [photo]="p" /> }
            @empty { <p class="muted">Nothing yet</p> }
          </section>
        </div>

        @if (job().subtasks?.length) {
          <section class="stack"><h3>Subtasks</h3>
            @for (t of job().subtasks!; track $index; let i = $index) {
              <button type="button" class="subtask" [attr.aria-pressed]="t.done" [disabled]="director() || state() === 'completed'" (click)="store.toggleSubtask(job().ref, i)">
                <mm-icon [name]="t.done ? 'circle-check' : 'circle-dashed'" /><span>{{ t.text }}</span></button>
            }
          </section>
        }
        @if (state() === 'awaiting') { <p class="note">Submitted and waiting for the Director. Awaiting approval is not completed: it counts only once it is approved.</p> }
        @if (job().rating) { <p class="muted">Approved with quality {{ job().rating!.stars }} of 5.@if (job().rating!.comment) { Coaching note: {{ job().rating!.comment }}}</p> }

        @if (job().state === 'not_started' || job().state === 'in_progress' || job().state === 'blocked') {
          <section class="panel stack" aria-label="Progress update">
            <h3>Add a progress update</h3>
            <p class="caption muted">Progress does not complete the job or replace approval.</p>
            <label class="field"><span>Progress, 0 to 100 percent</span><input type="number" min="0" max="100" step="1" [value]="progress() ?? job().progress" (input)="progress.set(+$any($event.target).value)" /></label>
            <label class="field"><span>What changed?</span><textarea rows="3" maxlength="2000" placeholder="What is done, what is next, or what support is needed" [value]="note()" (input)="note.set($any($event.target).value)"></textarea></label>
            <button type="button" [disabled]="!note().trim()" (click)="saveUpdate()">Save update</button>
            @if (updateError()) { <p role="alert">Enter a whole percentage from 0 to 100 and a short update.</p> }
          </section>
        }
        <details class="stack"><summary>Activity history</summary>
          <ol class="history">
            @for (a of job().audit; track $index) {
              <li><time>{{ store.fmtDay(t(a.at)) }}, {{ store.fmtTime(t(a.at)) }}</time><span><strong>{{ store.empName(a.who) }}</strong> {{ a.what }}</span></li>
            }
          </ol>
        </details>
      </div>

      <div actions>
        @if (director()) {
        @if (state() === 'awaiting') {
            <button type="button" class="primary" (click)="store.openSheet('approve', job().ref)">Review and approve</button>
            <div class="secondary-pair">
              <button type="button" (click)="store.openSheet('reject', job().ref)">Reject</button>
              <button type="button" (click)="store.openSheet('assign', job().ref)">Edit job</button>
            </div>
          } @else if (job().timeRequest && state() !== 'completed' && state() !== 'cancelled') {
            <button type="button" class="primary" (click)="store.decideTime(job().ref, true)">Give more time, until {{ store.fmtTime(t(job().timeRequest!.to)) }} {{ store.fmtDay(t(job().timeRequest!.to)) }}</button>
            <div class="secondary-pair">
              <button type="button" (click)="store.decideTime(job().ref, false)">Decline</button>
              <button type="button" (click)="store.openSheet('reassign', job().ref)">Reassign</button>
            </div>
          } @else if (state() !== 'completed' && state() !== 'cancelled') {
            <button type="button" class="primary" (click)="store.openSheet('assign', job().ref)">Edit job</button>
            <button type="button" class="secondary button-content" (click)="store.openSheet('reassign', job().ref)"><mm-icon name="user-round-pen" />Reassign with a reason</button>
          }
        } @else if (job().state === 'blocked') {
          <button type="button" class="primary" (click)="store.unblock(job().ref)">I'm unblocked, carry on</button>
        } @else if (state() !== 'awaiting' && state() !== 'completed' && state() !== 'cancelled') {
          @if (needsPhoto()) {
            <button type="button" class="primary button-content" (click)="store.attachPhoto(job().ref)"><mm-icon name="camera" />Take photo proof, sample</button>
            <button type="button" class="secondary" (click)="store.submitJob(job().ref)">Submit for approval</button>
          } @else {
            <button type="button" class="primary" (click)="store.submitJob(job().ref)">Submit for approval</button>
            <button type="button" class="secondary button-content" (click)="store.attachPhoto(job().ref)"><mm-icon name="camera" />Add a photo</button>
          }
          <div class="secondary-pair">
            <button type="button" class="button-content" (click)="store.openSheet('blocked', job().ref)"><mm-icon name="hand" />I'm blocked</button>
            <button type="button" class="button-content" [disabled]="!!job().timeRequest" (click)="store.openSheet('moretime', job().ref)"><mm-icon name="clock" />{{ job().timeRequest ? 'Time asked' : 'More time' }}</button>
          </div>
        }
        <button type="button" class="cancel" (click)="store.closeSheet()">Close</button>
      </div>
    </mm-sheet-frame>
  `,
  styles: `
    .job-title { font-size: 1.5rem; }
    .subtask { display: flex; align-items: center; gap: 0.625rem; text-align: left; border: 0; background: transparent; padding: 0.5rem 0; min-height: 44px; }
    .subtask[aria-pressed="true"] span { text-decoration: line-through; color: var(--muted); }
    .subtask mm-icon { width: 18px; height: 18px; }
    .subtask:disabled { opacity: 1; cursor: default; }
    .chip mm-icon { width: 14px; height: 14px; }
    .requirement { padding: 1rem; border: 1px solid var(--line); border-radius: var(--radius-sm); }
    .note { border-left: 2px solid var(--text); padding-left: 0.75rem; }
    .fix { border: 1px solid var(--red); background: var(--red-soft); border-radius: var(--radius-sm); padding: 0.875rem 1rem; gap: 0.375rem; }
    .fix h3 { color: var(--red); }
    .history li { grid-template-columns: 8.5rem 1fr; gap: 0.75rem; }
    @media (max-width: 767px) { .history li { grid-template-columns: 1fr; gap: 0.25rem; } }
  `,
})
export class JobComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  readonly jobRef = input.required<string>();
  protected readonly job = computed(() => this.store.job(this.jobRef()));
  protected readonly state = computed(() => this.store.derivedState(this.job()));
  protected readonly label = computed(() => STATE_LABEL[this.state()]);
  protected readonly icon = computed(() => STATE_ICON[this.state()]);
  protected readonly due = computed(() => this.store.effectiveDue(this.job()));
  protected readonly director = computed(() => this.store.role() === 'director');
  protected readonly needsPhoto = computed(() => this.job().evidence.required && !this.job().photos.length);
  protected readonly progress = signal<number | null>(null);
  protected readonly note = signal('');
  protected readonly updateError = signal(false);
  protected saveUpdate(): void {
    const saved = this.store.updateProgress(this.job().ref, this.progress() ?? this.job().progress, this.note());
    this.updateError.set(!saved); if (saved) { this.note.set(''); this.progress.set(null); }
  }
  // the last rejection, while the job is back with the person
  protected readonly fix = computed(() => {
    const j = this.job(); const st = this.state();
    return j.rejections.length && st !== 'completed' && st !== 'awaiting' && st !== 'cancelled' ? j.rejections[j.rejections.length - 1] : null;
  });
  protected t(iso: string): number { return Date.parse(iso); }
}
