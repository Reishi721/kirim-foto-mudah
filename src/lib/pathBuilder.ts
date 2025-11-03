const ID_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function buildUploadPath(meta: {
  noSuratJalan: string;
  tanggal: Date;
  tipe?: string;
}) {
  const d = new Date(meta.tanggal);
  const yyyy = d.getFullYear();
  const mmmm = ID_MONTHS[d.getMonth()];
  const dd = d.getDate();
  const tipeLower = (meta.tipe || 'Pengiriman').toLowerCase();
  return `${yyyy}/${mmmm}/${dd}/${tipeLower}/${meta.noSuratJalan}`;
}

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
