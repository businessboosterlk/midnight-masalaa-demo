// Fast store regression checks. Angular signals are replaced with synchronous test signals.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const signal = value => { const f = () => value; f.set = v => value = v; f.update = fn => value = fn(value); return f; };
const sandbox = { exports: {}, structuredClone, URLSearchParams, Date, console,
  setTimeout: () => 1, clearTimeout() {}, history: { go() {}, pushState() {} },
  location: { search: '' }, document: { documentElement: { dataset: {} } },
  require: name => name === '@angular/core' ? { Injectable: () => x => x, signal } : { OUTLETS: [] } };
sandbox.window = { addEventListener() {}, scrollTo() {} };
vm.createContext(sandbox);
for (const file of ['public/seed.js', 'public/engine.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox);
const code = ts.transpileModule(fs.readFileSync('src/app/core/store.ts', 'utf8'), { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true
} }).outputText;
vm.runInContext(code, sandbox);
const Store = sandbox.exports.DemoStore;
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log('PASS', name); };
check('staff job list scoped to current person', () => { const s = new Store(); s.role.set('ruwan'); assert(s.filteredJobs().every(j => j.assignee === 'ruwan')); });
check('staff reminders do not include other peoples jobs', () => { const s = new Store(); s.role.set('ruwan'); assert(!s.reminders().some(r => r.text.includes('Amaya') || r.text.includes('Tharindu'))); });
check('employee filter returns only selected owner', () => { const s = new Store(); s.setFilters({emp:'ruwan'}); assert(s.filteredJobs().length > 0); assert(s.filteredJobs().every(j => j.assignee === 'ruwan')); });
check('date filter respects Colombo day boundaries', () => { const s = new Store(); s.setFilters({from:'2026-10-27',to:'2026-10-27'}); assert(s.filteredJobs().length > 0); assert(s.filteredJobs().every(j => s.fmtDay(s.effectiveDue(j)) === s.fmtDay(s.now))); });
check('progress records an attributed history event', () => { const s = new Store(); s.role.set('ruwan'); assert(s.updateProgress('MM-2026-0041',45,'Filters cleaned')); assert.equal(s.job('MM-2026-0041').progress,45); assert.equal(s.job('MM-2026-0041').audit.at(-1).who,'ruwan'); });
check('progress rejects missing note, decimals and another owner', () => { const s = new Store(); s.role.set('pradeep'); assert(!s.updateProgress('MM-2026-0041',50,'Done')); s.role.set('ruwan'); assert(!s.updateProgress('MM-2026-0041',50,'')); assert(!s.updateProgress('MM-2026-0041',50.5,'Done')); });
check('100 percent does not bypass approval', () => { const s = new Store(); s.role.set('ruwan'); s.updateProgress('MM-2026-0041',100,'Ready to inspect'); assert.equal(s.job('MM-2026-0041').state,'in_progress'); });
check('missing photo blocks submission', () => { const s = new Store(); s.role.set('ruwan'); assert.equal(s.submitJob('MM-2026-0041'),'needs-evidence'); assert.equal(s.job('MM-2026-0041').state,'in_progress'); });
check('unchecked required steps block submission', () => { const s = new Store(); s.role.set('ruwan'); s.job('MM-2026-0041').subtasks=[{text:'Inspect',done:false}]; s.attachPhoto('MM-2026-0041'); assert.equal(s.submitJob('MM-2026-0041'),'needs-evidence'); });
check('nudge cannot bypass missing evidence', () => { const s = new Store(); s.role.set('ruwan'); const j=s.job('MM-2026-0042'); j.evidence.kind='3 quotations'; s.attachPhoto(j.ref); s.confirmNudge(j.ref); assert.notEqual(s.job(j.ref).state,'submitted'); });
check('approval rejects staff and stale submissions', () => { const s=new Store(); s.role.set('ruwan'); s.approve('MM-2026-0039',5); assert.equal(s.job('MM-2026-0039').state,'submitted'); s.role.set('director'); s.approve('MM-2026-0041',5); assert.equal(s.job('MM-2026-0041').state,'in_progress'); });
check('approval undo preserves unrelated edits', () => { const s=new Store(); s.approve('MM-2026-0039',4); const undo=s.toastUndo(); s.updateProgress('MM-2026-0041',55,'Unrelated progress'); undo(); assert.equal(s.job('MM-2026-0039').state,'submitted'); assert.equal(s.job('MM-2026-0041').progress,55); });
check('decision queue excludes completed and cancelled jobs', () => { const s=new Store(); assert(s.decisionJobs().every(j => !['approved','cancelled'].includes(j.state))); });
console.log(`${passed} checks passed`);
