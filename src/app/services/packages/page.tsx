import { permanentRedirect } from 'next/navigation';

// The package portfolio moved under Products.
export default function OldPackagesPage() {
  permanentRedirect('/products/compare');
}
