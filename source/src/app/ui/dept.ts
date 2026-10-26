// One icon per department, from Lucide. Departments are fixed by the client's document.
export const DEPT_ICON: Record<string, string> = {
  fin: 'wallet', mkt: 'megaphone', hr: 'users', fro: 'store', mnt: 'wrench', ckp: 'chef-hat', msp: 'briefcase',
};
export const deptIcon = (key: string) => DEPT_ICON[key] ?? 'building-2';
