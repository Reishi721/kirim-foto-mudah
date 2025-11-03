const ID_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function buildUploadPath(meta: {
  noSuratJalan: string;
  tanggal: Date;
}) {
  const d = new Date(meta.tanggal);
  const yyyy = d.getFullYear();
  const mmmm = ID_MONTHS[d.getMonth()];
  const dd = d.getDate();
  return `${yyyy}/${mmmm}/${dd}/pengiriman/${meta.noSuratJalan}`;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
