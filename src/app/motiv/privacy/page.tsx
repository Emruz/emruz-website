import Link from 'next/link';
import LegalPage, { COPYRIGHT_YEAR, LEGAL_CONTACT, LEGAL_PARTY } from '@/components/LegalPage';

export const metadata = {
  title: 'Motiv privacy policy',
  description: 'What the Motiv desktop app keeps on your computer, what it sends, and only when you choose.',
};

export default function MotivPrivacyPage() {
  return (
    <LegalPage
      title="Motiv privacy policy"
      summary="What the Motiv app keeps on your computer, and what leaves it only when you choose."
      updated="9 November 2026"
      path="/motiv/privacy"
      parent={{ label: 'Motiv', href: '/motiv' }}
    >
      <p>
        Motiv is a desktop app published by {LEGAL_PARTY}. It runs on your computer and has no analytics. The
        publisher doesn&apos;t receive, store or have access to your recordings, transcripts or meeting data. Buying
        and managing Premium on emruz.com is covered by the <Link href="/privacy">emruz.com privacy policy</Link>.
      </p>

      <h2>What stays on your computer</h2>
      <ul>
        <li><strong>Audio recordings</strong> of your meetings, in the folder you choose (Settings &gt; Storage).</li>
        <li><strong>Transcripts, summaries, chat conversations, action items</strong> and meeting details, in a local database.</li>
        <li><strong>Speaker information:</strong> speaker labels and names for each meeting.</li>
        <li>
          <strong>Voiceprints:</strong> created only when you tick &quot;Recognise this voice&quot; for a speaker. A
          voiceprint is a numeric representation of a voice used to recognise that person in later meetings.
          Voiceprints are biometric data; they are stored only in Motiv&apos;s local database, never uploaded, and can
          be deleted at any time in Settings &gt; Meetings. Ask people for consent before saving their voiceprint, as
          the law where you or they live may require it.
        </li>
        <li>
          <strong>Your subscription</strong>, if you have Premium: the subscription ID and a signed lease, in the macOS
          Keychain or Windows Credential Manager.
        </li>
        <li>
          <strong>Settings</strong>, including Names &amp; terms, and <strong>calendar sign-ins</strong> (stored in the
          macOS Keychain or Windows Credential Manager).
        </li>
      </ul>
      <p>
        Transcription and speaker identification run entirely on your computer. Motiv downloads model files (for
        transcription, speaker identification and, if you choose it, the built-in summary engine) from public model
        repositories; those downloads send no personal data.
      </p>

      <h2>What leaves your computer, and only when you choose</h2>
      <ul>
        <li>
          <strong>Summary and chat providers.</strong> If you choose a cloud provider (for example Anthropic Claude,
          OpenAI, Groq, OpenRouter or a custom endpoint), the meeting&apos;s transcript text, your question and
          participant names are sent to that provider to produce the answer, under that provider&apos;s terms and
          privacy policy. Audio is never sent. Local providers (Ollama, the built-in engine) keep everything on your
          computer.
        </li>
        <li>
          <strong>Apple Calendar (macOS).</strong> If you allow it, Motiv reads events from the calendars on your Mac
          through macOS, on your computer only.
        </li>
        <li>
          <strong>Microsoft 365 and Google calendars.</strong> If you connect them, Motiv reads your calendar events
          (titles, times, organizer, attendees and their responses, meeting links) and, if you turn it on, Microsoft
          Teams attendance reports, directly from Microsoft or Google to your computer. Motiv only reads; it never
          creates, changes or deletes calendar data. This data is used only to name recordings, show who was in a
          meeting, and help the summary use correct names.
        </li>
        <li>
          <strong>Email.</strong> &quot;Send by email&quot; opens your own email app with the summary; nothing is sent
          until you send it.
        </li>
      </ul>

      <h2>Motiv Premium check-in</h2>
      <p>
        With Premium, Motiv contacts emruz.com when you register a computer and about once a day afterwards, to keep
        Premium on. It sends only your subscription ID, a random ID created for the computer (not derived from its
        hardware), the Motiv version and the operating system family (macOS or Windows), plus the computer&apos;s name
        only if you choose to share it. It never sends recordings, transcripts, summaries, meeting details or how you
        use Motiv. Without Premium, Motiv doesn&apos;t contact emruz.com.
      </p>

      <h2>Google user data</h2>
      <p>
        Motiv&apos;s use of information received from Google APIs adheres to the{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>,
        including the Limited Use requirements. Motiv requests read-only access to Google Calendar
        (<code>calendar.readonly</code>) and your email address, uses it only for the features described above,
        doesn&apos;t transfer it to anyone, doesn&apos;t use it for advertising, and doesn&apos;t allow humans to read
        it.
      </p>

      <h2>Deleting your data</h2>
      <ul>
        <li>Delete a meeting in Motiv to remove its transcript, summary, chat, speakers and calendar link.</li>
        <li>Settings &gt; Storage removes old recording audio automatically if you set a limit; you can also delete the recordings folder.</li>
        <li>Settings &gt; Meetings deletes voiceprints, one or all.</li>
        <li>
          Settings &gt; Accounts &gt; Disconnect removes calendar sign-ins. To revoke access completely, also remove Motiv
          at <a href="https://myaccount.microsoft.com">myaccount.microsoft.com</a> or{' '}
          <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.
        </li>
        <li>
          Uninstalling Motiv and deleting its data folder (<code>~/Library/Application Support/com.pirooz.motiv</code> on
          macOS, <code>%APPDATA%\com.pirooz.motiv</code> on Windows) removes everything else.
        </li>
        <li>
          To remove your subscription and computers from emruz.com, see the{' '}
          <Link href="/privacy">emruz.com privacy policy</Link>.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>.
      </p>
      <p className="text-sm text-gray-500">Motiv © {COPYRIGHT_YEAR} {LEGAL_PARTY}. All rights reserved.</p>
    </LegalPage>
  );
}
