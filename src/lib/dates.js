const DAYS = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
const DAYS_SHORT = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];
const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

export const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const fromISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

export const mondayOf = (d) => {
  const copy = new Date(d);
  const dow = copy.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const dayName = (d) => DAYS[d.getDay()];
export const dayShort = (d) => DAYS_SHORT[d.getDay()];
export const dateLabel = (d) => `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`;
export const isWeekendDate = (d) => [0, 5, 6].includes(d.getDay());
export const isToday = (d) => toISO(d) === toISO(new Date());

export const weekNumber = (d) => {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNr = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - dayNr + 3);
  const firstThursday = new Date(t.getFullYear(), 0, 4);
  const fDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - fDayNr + 3);
  return 1 + Math.round((t - firstThursday) / (7 * 24 * 3600 * 1000));
};

export const relativeLabel = (d) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((fromISO(toISO(d)) - today) / 86400000);
  if (diff === 0) return "I dag";
  if (diff === 1) return "I morgen";
  return `${dayShort(d)} ${d.getDate()}.`;
};
