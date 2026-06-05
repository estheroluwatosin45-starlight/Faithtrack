import { formatInTimeZone } from 'date-fns-tz';

const TZ = 'Africa/Lagos';

export const formatLagos = (date: Date | string | number, formatStr: string) => {
  return formatInTimeZone(date, TZ, formatStr);
};

export const getLagosTodayStr = () => {
  return formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
};

export const getLagosDate = () => {
    // Returns a Date object that represents the current time but localized logic isn't trivial
    // It's better to just use new Date() for absolute points in time and format them.
    return new Date();
};
