export const isoDate = (d = new Date()) =>
  [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");

export const parseISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};
export const weekDayKey = (d=new Date()) => ["sun","mon","tue","wed","thu","fri","sat"][d.getDay()] as
  "sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat";
