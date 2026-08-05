import { LegalDocumentEditor } from "@/components/dashboard/legal-document-editor";

export default function TermsOfServicePage() {
  return (
    <LegalDocumentEditor
      type="terms-of-service"
      heading="Terms of Service"
      description="Manage the terms that govern how customers and tradespeople use Zentrofix."
    />
  );
}
