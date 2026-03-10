export const formatDate = (date: Date | string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date value');
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const calculateTradingDays = (startDate: string | Date, endDate: string | Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid date range');
  }

  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const current = new Date(start);
  let tradingDays = 0;

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      tradingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return {
    totalDays,
    tradingDays,
    calendarDaysRequired: (days: number) => Math.ceil((days * 7) / 5)
  };
};