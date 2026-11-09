import Link from 'next/link';
import localFont from 'next/font/local';

// The Emruz logo is the word "Emruz" set in EspecialKay.
const especialKay = localFont({
  src: '../../font/EspecialKay_Emruz.ttf',
  display: 'swap',
});

interface LogoProps {
  className?: string;
}

export default function Logo({ className = 'text-3xl text-blue-600' }: LogoProps) {
  return (
    <Link href="/" aria-label="Emruz home" className={`${especialKay.className} leading-none ${className}`}>
      Emruz
    </Link>
  );
}
