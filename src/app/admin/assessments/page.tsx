import { redirect } from 'next/navigation';

// Self-assessments are managed in the assessment workbench.
export default function AssessmentsAdmin() {
  redirect('/workbench/self');
}
