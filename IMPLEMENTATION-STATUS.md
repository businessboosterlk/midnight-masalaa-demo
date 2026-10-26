# Operations upgrade: review build

This is a front-end demo upgrade, not completion of the production requirements.

## Implemented
- Director decision queue for blockers, evidence reviews and extension requests.
- Compact Jobs list, employee and Colombo-date filters, dashboard date drill-downs.
- Staff job and reminder scoping in the demo UI. This is NOT access control.
- Staff percentage updates with required notes and attributed history.
- Submission checks for required evidence and unfinished subtasks.
- Approval state/role guards and per-job Undo that preserves unrelated changes.
- Blocked reasons remain visible when a job is overdue.
- Explicit simulated-notification wording.

## Verified
Angular production build passed. Thirteen regression checks passed with
`node qa/operations-unit.cjs` from the source directory. Desktop Director and
390px staff layouts were visually checked. These checks do not certify all flows.

## Still outstanding
Authenticated server permissions for all four roles; persistent data; real uploads;
department/employee administration; delivery-backed notifications; production audit
storage and backups; historical exports; scoring fairness acceptance; wider browser
and accessibility testing. The existing sample clock/data and demo sign-in remain.
No new 3D workspace is included. Do not sell this build as production-complete.

## Source
The Angular source snapshot is in `source/`. Install its package.json dependencies,
then run `npx ng build --base-href /midnight-masalaa-demo/` there. Compiled site files
remain at the repository root. Source dependencies were reused locally for this
review; a reproducible clean install and lockfile are follow-up work.

Review this branch before merging. Main and the live demo were not changed.
