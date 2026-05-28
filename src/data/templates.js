export const categories = [
  "Administrative Documents",
  "Technical Proposal",
  "Financial Proposal",
  "Compliance & Certifications",
  "Safety & Risk Management",
  "Operational Requirements",
  "Submission Instructions"
];

export const defaultChecklist = [
  ["Administrative Documents", "Company Profile Submission", true, "Attach latest corporate profile."],
  ["Administrative Documents", "ACRA Business Profile", true, "Use latest downloaded profile."],
  ["Administrative Documents", "GST Registration Certificate", false, "Required if applicable."],
  ["Technical Proposal", "Methodology Write-up", true, "Describe project approach and delivery method."],
  ["Technical Proposal", "Project Timeline", true, "Include milestones and deadline assumptions."],
  ["Financial Proposal", "Pricing Schedule", true, "Check totals, taxes, currency and validity period."],
  ["Compliance & Certifications", "Insurance Certificate", true, "Attach valid insurance certificate."],
  ["Compliance & Certifications", "CAAS Licensing Compliance", true, "For aviation or drone-related services."],
  ["Safety & Risk Management", "Safety Risk Assessment", true, "Include site, operational and personnel risks."],
  ["Operational Requirements", "Past Project References", false, "Include similar completed projects."],
  ["Submission Instructions", "Signed Tender Forms", true, "All required forms must be signed."],
  ["Submission Instructions", "Proof of Submission", true, "Save portal confirmation or email receipt."]
].map((item, index) => ({
  id: crypto.randomUUID(),
  category: item[0],
  requirement: item[1],
  mandatory: item[2],
  remarks: item[3],
  status: "Not Started",
  order: index + 1
}));

export function createDefaultTender() {
  return {
    id: crypto.randomUUID(),
    name: "New Project",
    reference: "PA-ITT-2026-0038",
    companyName: "Apollo Global Academy",
    deadline: "",
    logo: "",
    checklist: defaultChecklist
  };
}
