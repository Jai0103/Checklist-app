export function exportTenderCsv(tender) {
  const rows = [
    ["Category", "Requirement / Action Item", "Mandatory", "Remarks", "Status"],
    ...tender.checklist.map((item) => [
      item.category,
      item.requirement,
      item.mandatory ? "Yes" : "No",
      item.remarks,
      item.status
    ])
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${tender.reference || "tender"}-checklist.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
