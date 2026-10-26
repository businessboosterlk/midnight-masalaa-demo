// A sample evidence photo: a calm monochrome placeholder with its file name and a Sample chip.
// The blurry scene is dark and unusable on purpose, it is the one the Director rejects.
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DemoStore, Photo, Scene } from '../core/store';
import { MmIconComponent } from './icon.component';

const SCENE_ICON: Record<Scene, string> = { gauge: 'gauge', blurry: 'image', shelf: 'package', sheet: 'clipboard-list', doc: 'file-text', generic: 'image', before: 'camera', reference: 'scan-eye' };
const SCENE_TEXT: Record<Scene, string> = { gauge: 'Gauge reading', blurry: 'Too dark to read', shelf: 'Fitted unit', sheet: 'Signed sheet', doc: 'Scanned document', generic: 'Finished work', before: 'Spill under the dish station', reference: 'The standard to match' };

@Component({
  selector: 'mm-evidence-photo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MmIconComponent],
  template: `
    <figure class="evidence-photo" [attr.data-scene]="photo().scene">
      <div class="evidence-stage"><mm-icon [name]="icon()" /><span class="stage-text">{{ text() }}</span></div>
      <figcaption><span>{{ photo().label }}@if (time()) {<span class="ptime"> · taken {{ time() }}</span>}</span><span class="sample-chip">Sample</span></figcaption>
    </figure>
  `,
  styles: `
    .evidence-stage { gap: 0.5rem; align-content: center; justify-items: center; }
    .stage-text { font-size: var(--text-xs); color: var(--muted); }
    [data-scene="blurry"] .stage-text { filter: blur(3px); opacity: 0.5; }
  `,
})
export class EvidencePhotoComponent {
  private readonly store = inject(DemoStore);
  readonly photo = input.required<Photo>();
  // the time the photo was taken in the app, stamped by the store: the proof cannot be an old picture
  protected readonly time = computed(() => { const a = this.photo().at; return a ? this.store.fmtTime(Date.parse(a)) + ', ' + this.store.fmtDay(Date.parse(a)) : ''; });
  protected readonly icon = computed(() => SCENE_ICON[this.photo().scene] ?? 'image');
  protected readonly text = computed(() => SCENE_TEXT[this.photo().scene] ?? 'Finished work');
}
