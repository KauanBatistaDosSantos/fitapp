export const isoDate = (d=new Date()) => d.toISOString().slice(0,10);
export const weekDayKey = (d=new Date()) => ["sun","mon","tue","wed","thu","fri","sat"][d.getDay()] as
  "sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat";
