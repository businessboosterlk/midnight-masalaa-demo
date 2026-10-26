import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DemoStore } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';
import { EvidencePhotoComponent } from '../ui/evidence-photo.component';

// Reject and return: a reason chip, the Director's own words and a redo deadline. Undo sits on the toast.
@Component({
  selector: 'mm-reject',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent, EvidencePhotoComponent],
  template: `
    <mm-sheet-frame title="Reject and return" [active]="active()">
      <div class="stack-lg">
        <div class="stack"><h2>{{ job().title }}</h2>
          <p class="muted">{{ store.empName(job().assignee) }} · {{ store.deptName(job().dept) }}</p></div>
        @if (job().photos.length) { <mm-evidence-photo class="thumb" [photo]="job().photos[job().photos.length - 1]" /> }
        <section class="stack"><h3>Why is it going back?</h3>
          <div class="reason-list" role="group" aria-label="Reason">
            @for (r of reasons; track r) {
              <button type="button" [attr.aria-pressed]="picked() === r" (click)="picked.set(r)">{{ r }}</button>
            }
          </div>
        </section>
        <label class="field"><span>Tell {{ first() }} exactly what to fix <span class="muted">· optional</span></span>
          <textarea rows="2" placeholder="For example: retake it with the torch on, the label must be readable" [value]="comment()" (input)="comment.set(val($event))"></textarea></label>
        <div class="field"><span>Redo by</span>
          <div class="segmented" role="group" aria-label="Redo by">
            @for (o of redo(); track o.key) { <button type="button" [attr.aria-pressed]="when() === o.key" (click)="when.set(o.key)"><span class="r1">{{ o.label }}</span><span class="r2">{{ o.time }}</span></button> }
          </div></div>
        <p class="caption muted">The job goes back to {{ first() }} with your words. Quality drops 5 points this month. The score still reads the original deadline.</p>
      </div>
      <div actions>
        <button type="button" class="primary danger" [disabled]="!picked()" (click)="reject()">Reject and return</button>
        <button type="button" class="cancel" (click)="store.closeSheet()">Cancel</button>
      </div>
    </mm-sheet-frame>
  `,
  styles: `.segmented { display: grid; grid-template-columns: repeat(3, 1fr); } .segmented button { display: grid; gap: 0.125rem; padding: 0.5rem 0.25rem; line-height: 1.25; } .r2 { font-variant-numeric: tabular-nums; font-size: var(--text-xs); opacity: 0.8; }`,
})
export class RejectComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  readonly jobRef = input.required<string>();
  protected readonly reasons = ['Incomplete evidence, retake photo', 'Work not finished', 'Wrong job or wrong location', 'Below standard, redo'];
  protected readonly picked = signal('');
  protected readonly comment = signal('');
  protected readonly when = signal('2h');
  protected readonly job = computed(() => this.store.job(this.jobRef()));
  protected readonly first = computed(() => this.store.empName(this.job().assignee).split(' ')[0]);
  protected readonly redo = computed(() => {
    const t = (iso: string) => this.store.fmtTime(Date.parse(iso));
    const close = this.store.isoAt('23:00');
    return [{ key: '30m', label: 'In 30 min', time: t(this.store.isoIn(30)), iso: this.store.isoIn(30) },
      { key: '2h', label: 'In 2 hours', time: t(this.store.isoIn(120)), iso: this.store.isoIn(120) },
      { key: 'close', label: 'By closing', time: t(close), iso: close }];
  });
  protected val(e: Event): string { return (e.target as HTMLTextAreaElement).value; }
  protected reject(): void {
    const o = this.redo().find(x => x.key === this.when());
    this.store.reject(this.jobRef(), this.picked(), this.comment(), o?.iso);
  }
}
