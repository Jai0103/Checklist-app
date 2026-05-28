export function exportTenderCsv(tender) {
  const rows = [
    ["Category", "Requirement / Action Item", "Mandatory", "Remarks", "Status", "Owner", "Priority"],
    ...tender.checklist.map((item) => [
      item.category,
      item.requirement,
      item.mandatory ? "Yes" : "No",
      item.remarks,
      item.status,
      item.owner || "",
      item.priority || "Medium"
    ])
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  downloadFile(csv, `${tender.reference || "project"}-checklist.csv`, "text/csv;charset=utf-8");
}

export function downloadCsvTemplate() {
  const csv = [
    ["Category", "Requirement", "Mandatory", "Remarks", "Status", "Owner", "Priority"],
    ["Administrative Documents", "Company Profile", "Yes", "Attach latest profile", "Not Started", "Admin", "High"],
    ["Technical Proposal", "Methodology Write-up", "Yes", "Include approach", "In Progress", "Technical", "High"]
  ]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  downloadFile(csv, "project-checklist-template.csv", "text/csv;charset=utf-8");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
