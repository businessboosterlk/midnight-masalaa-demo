import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';
import { MmIconComponent } from '../ui/icon.component';
import { EvidencePhotoComponent } from '../ui/evidence-photo.component';

// Approve and rate. Opened from the queue it moves straight to the next submission after each approval,
// and the toast carries an Undo for six seconds.
@Component({
  selector: 'mm-approve',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent, MmIconComponent, EvidencePhotoComponent],
  template: `
    <mm-sheet-frame title="Approve and rate" [active]="active()" size="wide">
      <div class="stack-lg">
        <div class="stack">
          @if (position(); as p) { <p class="caption muted">{{ p.at }} of {{ p.of }} waiting</p> }
          <h2>{{ job().title }}</h2>
          <p class="muted">{{ store.empName(job().assignee) }} · submitted {{ submitted() }}</p></div>
        <div class="approval-comparison">
          <section class="requirement stack"><h3>Asked for</h3><p>{{ job().evidence.kind }}</p>
            @if (job().reference; as r) { <mm-evidence-photo [photo]="r" /> }
          </section>
          <section class="stack"><h3>Attached</h3>
            @for (p of job().photos; track $index) { <mm-evidence-photo [photo]="p" /> } @empty { <p class="muted">Nothing attached</p> }
          </section>
        </div>
        <section class="stack rate">
          <h3>Quality</h3>
          <div class="rating" role="group" aria-label="Quality rating">
            @for (n of stars; track n) {
              <button type="button" class="star" [attr.aria-pressed]="picked() >= n" [attr.aria-label]="n + ' of 5'" (click)="picked.set(n)">
                <mm-icon name="star" />
              </button>
            }
          </div>
          <p class="caption">{{ picked() ? picked() + ' of 5: ' + anchors[picked() - 1] : 'Tap a rating' }}</p>
          <p class="caption muted">Sample standard; Midnight Masalaa sets the real one per job type. The rating feeds quality, 20 per cent of the score.</p>
        </section>
        <label class="field"><span>Coaching note <span class="muted">· optional, {{ first() }} sees it</span></span>
          <textarea rows="2" placeholder="What made it good, or what to do better next time" [value]="note()" (input)="note.set(val($event))"></textarea></label>
      </div>
      <div actions>
        <button type="button" class="primary" [disabled]="!picked()" (click)="approve()">Approve, mark completed</button>
        <button type="button" class="cancel" (click)="store.closeSheet()">Cancel</button>
      </div>
    </mm-sheet-frame>
  `,
  styles: `
    .requirement { padding: 1rem; border: 1px solid var(--line); border-radius: var(--radius-sm); }
    .rate { justify-items: center; text-align: center; }
    .star { width: 3.25rem; height: 3.25rem; padding: 0; display: grid; place-items: center; }
    .star mm-icon { width: 1.5rem; height: 1.5rem; transform: translateY(1px); }
    .star[aria-pressed="true"] mm-icon { fill: currentColor; }
  `,
})
export class ApproveComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  readonly jobRef = input.required<string>();
  protected readonly stars = [1, 2, 3, 4, 5] as const;
  protected readonly anchors = ['not to the standard, it needs redoing', 'done, with faults to fix next time', 'done, meets the brief', 'done well, nothing to fix', 'done perfectly, the example for others'];
  protected readonly picked = signal<0 | 1 | 2 | 3 | 4 | 5>(0);
  protected readonly note = signal('');
  protected readonly job = computed(() => this.store.job(this.jobRef()));
  protected readonly first = computed(() => this.store.empName(this.job().assignee).split(' ')[0]);
  protected readonly position = computed(() => {
    const q = this.store.approvalQueue(); const i = q.findIndex(j => j.ref === this.jobRef());
    return i < 0 || q.length < 2 ? null : { at: i + 1, of: q.length };
  });
  protected readonly submitted = computed(() => { const t = Date.parse(this.job().submittedAt || ''); return t ? this.store.fmtDay(t) + ', ' + this.store.fmtTime(t) : ''; });
  protected val(e: Event): string { return (e.target as HTMLTextAreaElement).value; }
  protected approve(): void {
    const n = this.picked(); if (!n) return;
    this.store.approve(this.jobRef(), n, this.note());
    this.picked.set(0); this.note.set('');
  }
}
