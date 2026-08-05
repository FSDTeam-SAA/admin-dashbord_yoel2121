import { LegalDocumentEditor } from "@/components/dashboard/legal-document-editor";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentEditor
      type="privacy-policy"
      heading="Privacy Policy"
      description="Keep Zentrofix's privacy practices accurate and available to every client application."
    />
  );
}
