// The working behind a score: the formula with its figures, the jobs that were due, the quality events.
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DemoStore, Filter } from '../core/store';
import { SheetFrameComponent } from '../ui/sheet-frame.component';
import { BandBadgeComponent } from '../ui/band-badge.component';
import { STATE_LABEL } from '../ui/job-card.component';

@Component({
  selector: 'mm-drill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetFrameComponent, BandBadgeComponent, DecimalPipe],
  template: `
    <mm-sheet-frame [title]="name()" [active]="active()" size="wide">
      <div class="stack-lg">
        <div class="head-row">
          <div><p class="caption muted">{{ store.periodLabel }}</p>
            <strong class="big numeric" [attr.data-fig]="base() + '.overall'" [attr.data-fmt]="'int'">{{ s().overall === null ? 'N/A' : (s().overall | number:'1.0-0') }}</strong></div>
          <mm-band-badge [overall]="s().overall" [path]="base() + '.overall'" />
        </div>

        @if (s().overall === null) {
          <p class="mathline">Not measurable yet: nothing was due in this window.</p>
        } @else {
          <p class="mathline numeric">0.5 × <span [attr.data-fig]="base() + '.completionPct'" [attr.data-fmt]="'1dp'">{{ s().completionPct | number:'1.1-1' }}</span>
            + 0.3 × <span [attr.data-fig]="base() + '.ontimePct'" [attr.data-fmt]="'1dp'">{{ s().ontimePct | number:'1.1-1' }}</span>
            + 0.2 × <span [attr.data-fig]="base() + '.qualityPct'" [attr.data-fmt]="'1dp'">{{ s().qualityPct | number:'1.1-1' }}</span>
            = <span [attr.data-fig]="base() + '.overall'" [attr.data-fmt]="'1dp'">{{ s().overall | number:'1.1-1' }}</span></p>
        }

        <dl class="facts">
          <div><dt>Completion</dt><dd><span [attr.data-fig]="base() + '.completed'" [attr.data-fmt]="'raw'">{{ s().completed }}</span> of
            <span [attr.data-fig]="base() + '.cohort'" [attr.data-fmt]="'raw'">{{ s().cohort }}</span> jobs due were completed</dd></div>
          <div><dt>On time</dt><dd><span [attr.data-fig]="base() + '.ontimeN'" [attr.data-fmt]="'raw'">{{ s().ontimeN }}</span> of
            <span [attr.data-fig]="base() + '.ontimeD'" [attr.data-fmt]="'raw'">{{ s().ontimeD }}</span> submitted by the deadline</dd></div>
          <div><dt>Quality</dt><dd>average of <span [attr.data-fig]="base() + '.ratingCount'" [attr.data-fmt]="'raw'">{{ s().ratingCount }}</span> ratings,
            minus 5 for each of <span [attr.data-fig]="base() + '.rejectionCount'" [attr.data-fmt]="'raw'">{{ s().rejectionCount }}</span> rejections</dd></div>
          @if (s().cancelledExcluded) {
            <div><dt>Cancelled</dt><dd><span [attr.data-fig]="base() + '.cancelledExcluded'" [attr.data-fmt]="'raw'">{{ s().cancelledExcluded }}</span> excluded from every figure</dd></div>
          }
        </dl>

        <section class="stack"><h3>The jobs behind it</h3>
          @if (s().rows.length) {
            <div class="table-scroll"><table>
              <thead><tr><th>Job</th><th>Result</th><th>Rating</th></tr></thead>
              <tbody>
                @for (r of s().rows; track r.ref) {
                  <tr>
                    <td><button type="button" class="row-link" (click)="store.openSheet('job', r.ref)">{{ r.title }}</button><span class="caption muted"> {{ r.ref }}</span></td>
                    <td>@if (r.counted) { <span class="chip" [attr.data-state]="r.ontime ? 'completed' : 'late'">{{ r.ontime ? 'On time' : 'Late' }}</span> }
                        @else { <span class="chip" [attr.data-state]="r.state">{{ label(r.state) }}</span> }
                        @if (r.rejections) { <span class="chip" data-state="returned">Rejected {{ r.rejections }}x</span> }</td>
                    <td class="numeric">{{ r.stars ? r.stars + ' of 5' : '' }}</td>
                  </tr>
                }
              </tbody>
            </table></div>
          } @else { <p class="muted">Nothing was due in this window.</p> }
        </section>

        <section class="stack"><h3>Quality events this month</h3>
          <ul class="history">
            @for (e of s().qualityEvents; track $index) {
              <li class="event"><span>{{ e.ref }} {{ e.kind === 'rating' ? 'rated ' + e.stars + ' of 5' : 'rejected' }}</span>
                <span class="numeric">{{ e.kind === 'rating' ? e.pts + ' points' : 'minus 5' }}</span></li>
            } @empty { <li class="muted">No ratings or rejections yet.</li> }
          </ul>
        </section>
      </div>
      <div actions><button type="button" class="cancel" (click)="store.closeSheet()">Close</button></div>
    </mm-sheet-frame>
  `,
  styles: `
    .head-row { display: flex; justify-content: space-between; align-items: end; gap: 1rem; }
    .big { display: block; font-size: 4rem; line-height: 1; letter-spacing: -0.06em; font-weight: 600; }
    .mathline { border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 0.875rem 1rem; color: var(--muted); }
    .mathline span { color: var(--text); font-weight: 600; }
    .facts { margin: 0; display: grid; gap: 0.75rem; }
    .facts > div { display: grid; grid-template-columns: 7rem 1fr; gap: 1rem; }
    dt { color: var(--muted); } dd { margin: 0; }
    .row-link { border: 0; background: none; padding: 0; min-height: 44px; text-align: left; text-decoration: underline; text-underline-offset: 0.2em; }
    .event { grid-template-columns: 1fr auto; }
    td .chip { margin-right: 0.375rem; }
    @media (max-width: 767px) { .facts > div { grid-template-columns: 1fr; gap: 0.125rem; } }
  `,
})
export class DrillComponent {
  protected readonly store = inject(DemoStore);
  readonly active = input(true);
  readonly scope = input('company');
  private readonly parsed = computed<{ filter: Filter; name: string; base: string }>(() => {
    const sc = this.scope();
    if (sc.startsWith('dept:')) { const k = sc.slice(5); return { filter: { dept: k }, name: this.store.deptName(k), base: 'score.dept.' + k }; }
    if (sc.startsWith('emp:')) { const id = sc.slice(4); return { filter: { emp: id }, name: this.store.empName(id), base: 'score.emp.' + id }; }
    return { filter: null, name: this.store.companyShort, base: 'score.company' };
  });
  protected readonly name = computed(() => this.parsed().name);
  protected readonly base = computed(() => this.parsed().base);
  protected readonly s = computed(() => this.store.score(this.parsed().filter));
  protected label(st: string): string { return STATE_LABEL[st] ?? st; }
}
