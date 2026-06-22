import html2canvas from 'html2canvas';

export interface PosterData {
  title: string;
  address: string;
  layout: string;
  area: number;
  monthlyRent: number;
  decoration: string;
  floor: string;
  landlordName: string;
  landlordPhone: string;
  watermarkText?: string;
  highlights?: string[];
}

export function exportDOMAsImage(element: HTMLElement, filename = '招租海报.png'): Promise<string | null> {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })
    .then((canvas) => {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return dataUrl;
    })
    .catch(() => null);
}

export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.trim());
}

export function validateIdCard(idNo: string): boolean {
  const reg = /^\d{17}[\dXx]$/;
  if (!reg.test(idNo)) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += parseInt(idNo[i]) * weights[i];
  const expected = checkCodes[sum % 11];
  return idNo[17].toUpperCase() === expected;
}

export function classNames(...candidates: (string | false | null | undefined)[]): string {
  return candidates.filter(Boolean).join(' ');
}

export function colorForFeeType(type: string): string {
  const map: Record<string, string> = {
    rent: 'bg-brand-50 text-brand-700 border-brand-200',
    water: 'bg-blue-50 text-blue-700 border-blue-200',
    electricity: 'bg-amber-50 text-amber-700 border-amber-200',
    gas: 'bg-orange-50 text-orange-700 border-orange-200',
    property: 'bg-violet-50 text-violet-700 border-violet-200',
    deposit: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    penalty: 'bg-rose-50 text-rose-700 border-rose-200',
    other: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return map[type] ?? map.other;
}

export function colorForPropertyStatus(status: string): string {
  const map: Record<string, string> = {
    rented: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    vacant: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    maintenance: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-600/20',
    sold: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20',
  };
  return map[status] ?? map.sold;
}

export function colorForTenantStatus(status: string): string {
  const map: Record<string, string> = {
    living: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    moved: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20',
    pending: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  };
  return map[status] ?? map.moved;
}

export function colorForBillStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20',
    partial: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    paid: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    overdue: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-600/20',
    cancelled: 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-400/20',
  };
  return map[status] ?? map.pending;
}
