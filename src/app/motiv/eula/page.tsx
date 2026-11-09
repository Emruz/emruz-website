import Link from 'next/link';
import LegalPage, { LEGAL_CONTACT, LEGAL_PARTY } from '@/components/LegalPage';

export const metadata = {
  title: 'Motiv license agreement (EULA)',
  description: 'The end user license agreement for the Motiv desktop app.',
};

export default function EulaPage() {
  return (
    <LegalPage
      title="Motiv license agreement"
      summary="The end user license agreement (EULA) for the Motiv desktop app."
      updated="9 November 2026"
      path="/motiv/eula"
      parent={{ label: 'Motiv', href: '/motiv' }}
    >
      <p>
        This agreement is between you and {LEGAL_PARTY} (&quot;the publisher&quot;). By installing or using Motiv you
        agree to it. If you use Motiv for an organization, you agree on its behalf. Buying and managing Premium is also
        covered by the <Link href="/terms">terms of service</Link>.
      </p>

      <h2>1. License</h2>
      <p>
        The publisher grants you a personal, non-exclusive, non-transferable, revocable license to install and use
        Motiv on computers you own or control.
      </p>
      <ul>
        <li>The free features may be used without charge.</li>
        <li>
          Premium features require an active subscription and may be used only by its holder, on no more computers
          than the subscription allows (two unless your plan says otherwise).
        </li>
        <li>
          Motiv checks in with emruz.com about once a day to keep Premium on. If it can&apos;t, Premium keeps working
          for a limited time, then pauses until the next successful check-in.
        </li>
      </ul>

      <h2>2. Restrictions</h2>
      <p>Except where the law allows it despite this restriction, you may not:</p>
      <ul>
        <li>copy, modify, translate or create derivative works of Motiv;</li>
        <li>reverse engineer, decompile or disassemble it;</li>
        <li>rent, lend, resell, sublicense or redistribute it;</li>
        <li>share subscription IDs beyond your allowed computers;</li>
        <li>remove, disable or work around license checks or other technical limits; or</li>
        <li>use Motiv to break the law or anyone&apos;s rights, including privacy and recording laws.</li>
      </ul>

      <h2>3. Recording and consent</h2>
      <p>
        Many places require the consent of everyone in a conversation before it is recorded, and some treat
        voiceprints as biometric data that needs consent. You are responsible for telling participants, getting any
        consent the law requires, and following your organization&apos;s policies before you record a meeting or save
        someone&apos;s voiceprint.
      </p>

      <h2>4. Your data and AI providers</h2>
      <p>
        Motiv runs on your computer. The publisher doesn&apos;t receive your recordings, transcripts, summaries or
        meeting details; see the <Link href="/motiv/privacy">Motiv privacy policy</Link>. If you choose a cloud AI
        provider for summaries or chat, transcript text is sent to that provider under your own agreement with them,
        and the publisher isn&apos;t responsible for their service. AI output can be wrong or incomplete; review it
        before you rely on it.
      </p>

      <h2>5. Open-source components</h2>
      <p>
        Parts of Motiv come from Meetily Community Edition (MIT License) and other open-source libraries. Those parts
        are governed by their own licenses, which this agreement doesn&apos;t limit. Their notices are included with
        the app.
      </p>

      <h2>6. Updates</h2>
      <p>
        The publisher may release updates that fix, change, add or remove features. Some updates may be needed to keep
        using Premium or to keep connecting to emruz.com.
      </p>

      <h2>7. Ownership</h2>
      <p>
        Motiv is licensed, not sold. The publisher and its licensors keep all rights in Motiv, including its code,
        design, name and logo, except the rights this agreement grants you.
      </p>

      <h2>8. No warranty</h2>
      <p>
        Motiv is provided &quot;as is&quot;, without warranty of any kind. To the extent the law allows, the publisher
        disclaims all implied warranties, including merchantability, fitness for a particular purpose and
        non-infringement, and doesn&apos;t promise that Motiv will be error-free, uninterrupted, or that recordings or
        transcripts will be complete or accurate. Keep backups of anything important.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the extent the law allows, the publisher isn&apos;t liable for indirect, incidental, special or
        consequential damages, or for lost data, profits or business. Total liability is limited to the amount you paid
        for Motiv in the 12 months before the claim, or $50 if you paid nothing.
      </p>

      <h2>10. Termination</h2>
      <p>
        This license ends automatically if you breach it. Premium features stop when a subscription ends, is
        cancelled or is revoked; free features and your existing meetings keep working while this license is in
        effect. You may end it at any time by uninstalling Motiv.
      </p>

      <h2>11. Export and government use</h2>
      <p>
        You may not use or export Motiv in breach of US export laws or sanctions. Motiv is commercial computer software;
        government users receive only the rights in this agreement.
      </p>

      <h2>12. Law</h2>
      <p>
        This agreement is governed by the laws of the State of California, USA, with disputes resolved in the courts of
        Santa Clara County, California. If any part is unenforceable, the rest still applies.
      </p>

      <h2>Contact</h2>
      <p>
        {LEGAL_PARTY}, Santa Clara, California, USA. <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>
      </p>
    </LegalPage>
  );
}
