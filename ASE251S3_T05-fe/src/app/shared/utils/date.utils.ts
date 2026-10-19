/**
 * Date utility functions
 */
export class DateUtils {
  static formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES');
  }

  static formatDateTime(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('es-ES');
  }
}