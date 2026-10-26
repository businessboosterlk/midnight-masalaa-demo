// ADD-ON SAMPLE DATA for "Ready for service". The seed has no outlet field, so the outlets are the ones the seeded job
// titles already name, and their open jobs are matched by outlet name in the title. The service checks below are
// sample reports from each outlet's supervisor; the real build gives every job a location and takes live checks.
export type CheckState = 'ok' | 'failed' | 'unknown';
export interface ServiceCheck { text: string; state: CheckState; note?: string; by?: string; at?: string; }
export interface Outlet { key: string; name: string; match: string; service: string; checks: ServiceCheck[]; }

export const CHECKS = ['Cold room at 3 °C or below', 'Gas line and burners checked', 'Extraction hood clean', 'Floor and drains clear', 'Dinner team all on shift'];
const ok = (by: string, at: string) => CHECKS.map(text => ({ text, state: 'ok' as CheckState, by, at }));
const set = (list: ServiceCheck[], i: number, c: Partial<ServiceCheck>) => list.map((x, k) => k === i ? { ...x, ...c } : x);

export const OUTLETS: Outlet[] = [
  { key: 'mlv', name: 'Mount Lavinia', match: 'mount lavinia', service: 'Dinner, 18:00',
    checks: set(ok('Kasun', '08:30'), 3, { state: 'failed', note: 'Water pooling under the dish station' }) },
  { key: 'neg', name: 'Negombo', match: 'negombo', service: 'Dinner, 18:00', checks: ok('Dilani', '08:20') },
  { key: 'wel', name: 'Wellawatte', match: 'wellawatte', service: 'Dinner, 18:00',
    checks: set(set(ok('Ravi', '08:45'), 1, { state: 'unknown', by: undefined, at: undefined }), 4, { state: 'unknown', by: undefined, at: undefined }) },
  { key: 'kol', name: 'Kollupitiya', match: 'kollupitiya', service: 'Dinner, 18:00', checks: ok('Sanjeewa', '08:15') },
  { key: 'nug', name: 'Nugegoda', match: 'nugegoda', service: 'Dinner, 18:00', checks: ok('Malsha', '08:10') },
  { key: 'deh', name: 'Dehiwala', match: 'dehiwala', service: 'Dinner, 18:00', checks: ok('Ashan', '08:25') },
  { key: 'kan', name: 'Kandy', match: 'kandy', service: 'Dinner, 18:00', checks: ok('Priyanka', '08:40') },
  { key: 'ckp', name: 'Central kitchen', match: 'central kitchen', service: 'Dispatch to outlets, 15:00', checks: ok('Nadeesha', '07:50') },
];
