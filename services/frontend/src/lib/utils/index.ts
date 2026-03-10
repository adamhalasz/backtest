import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { calculateTradingDays, formatDate } from '../../../../../shared/date';
 
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export { calculateTradingDays, formatDate };