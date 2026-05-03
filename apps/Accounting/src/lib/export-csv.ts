/**
 * Export data to CSV (Excel-compatible with BOM for Vietnamese)
 */
export function exportToCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
) {
  // BOM for UTF-8 Excel compatibility
  const BOM = "\uFEFF";

  const escape = (val: string | number) => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csv = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");

  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Format number for export
 */
export function fmtExport(n: number): string {
  return Math.round(n).toString();
}
