import { redirect } from 'next/navigation';

// Self-assessments are managed in the Workbench.
export default function AssessmentsAdmin() {
  redirect('/workbench/self');
}
