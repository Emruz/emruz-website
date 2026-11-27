import Link from 'next/link';
import LegalPage, { COPYRIGHT_YEAR, LEGAL_CONTACT, LEGAL_PARTY, WHITEDOG_LEGAL_URL } from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy policy',
  description: 'How Emruz collects, uses and protects personal information on emruz.com, including accounts and Motiv subscriptions.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      summary="What we collect on emruz.com, why, who helps us run it, and the choices you have."
      updated="26 November 2026"
      path="/privacy"
    >
      <p>
        This policy covers emruz.com, including the contact form, the Insights newsletter, your Emruz account, Motiv and kit purchases and the
        licensing service Motiv uses to keep Pro on. It is published by {LEGAL_PARTY} (&quot;Emruz&quot;,
        &quot;we&quot;, &quot;us&quot;). The Motiv desktop app has its own{' '}
        <Link href="/motiv/privacy">Motiv privacy policy</Link>, which explains what happens on your computer.
      </p>
      <p>
        <strong>The short version:</strong> we collect only what we need to answer you, run your account and sell
        Motiv. We don&apos;t use advertising trackers or third-party analytics, and we don&apos;t sell or share personal
        information for advertising. Anything beyond necessary cookies is off unless you turn it on, and we honor
        Global Privacy Control. Every page, font and image on emruz.com is served from emruz.com itself, so
        simply visiting the site doesn&apos;t send information about you to anyone else.
      </p>

      <h2>What we collect</h2>
      <h3>When you contact us</h3>
      <p>
        The contact form collects your name, email address, company (optional), the topic and your message. We use
        it only to reply to you and to follow up on your request. Your message is stored in our database and emailed
        to us.
      </p>

      <h3>When you subscribe to Insights</h3>
      <p>
        We collect your email address, when you signed up, when you confirmed and, if it happens, when you
        unsubscribed. We send one email asking you to confirm, and add you only after you do. Every newsletter
        email has a link to unsubscribe.
      </p>

      <h3>When you create an account or sign in</h3>
      <ul>
        <li>Your email address, and your name if you or your sign-in provider gives it.</li>
        <li>
          If you sign in with Microsoft, Google or Apple: an identifier for your account with that provider, the
          email it shares and whether it has verified that email. We never receive your password. If you use
          Apple&apos;s &quot;Hide My Email&quot;, we receive the relay address Apple creates.
        </li>
        <li>If you sign in with an email link: the address the link was sent to and when it was used.</li>
        <li>A session cookie that keeps you signed in (see Cookies below).</li>
      </ul>

      <h3>When you take the security self-assessment</h3>
      <p>
        The self-assessment is open to registered users. When you register we collect your name, company, and
        optionally your job title and phone number, together with a record of your consent: the wording you agreed
        to, when, and the IP address it came from. We store your answers, your organization profile (size, type of
        data, who looks after security) and your results, so you can stop and come back and so we can follow up with
        you about them. We email your results to you and notify our team when you finish.
      </p>

      <h3>When we perform an assessment for your organization</h3>
      <p>
        For assessment clients, we store the details you give us during intake, our ratings and notes, the evidence you
        or our assessors upload or link (such as policies, screenshots and exports), evidence requests, and each version
        of your report. Files are kept in private storage on our hosting provider and can only be opened by Emruz
        assessors and the contacts your organization has named for the client portal. We use this only to perform the
        engagement and deliver your report, under your agreement with us.
      </p>

      <h3>When you buy Motiv</h3>
      <p>
        Payments are handled by Stripe. Your card details go directly to Stripe and never reach our servers. From
        Stripe we receive and keep your email address, name, billing country and postal code (to calculate tax),
        the plan you bought, its status and renewal date, and Stripe&apos;s references to your customer record and
        payments.
      </p>

      <h3>When you buy or use Emruz kits</h3>
      <p>
        Kit purchases are paid through Stripe in the same way. We also keep which kits you have, and the answer you choose when
        asked what made you buy now. When you connect Claude or another app to the kits, we keep the apps you approve and an audit
        log of sign-ins and skills read. The <Link href="/kits/security">kits security and data statement</Link> lists what is
        stored and for how long.
      </p>

      <h3>When Motiv checks in</h3>
      <p>
        With Motiv Pro, the app contacts emruz.com when you register a computer and about once a day afterwards.
        We receive and keep:
      </p>
      <ul>
        <li>your subscription ID;</li>
        <li>a random ID Motiv creates for the computer (not derived from its hardware);</li>
        <li>the computer&apos;s name, only if you choose to share it in Motiv;</li>
        <li>the Motiv version and operating system family (macOS, Windows or Linux);</li>
        <li>when the computer was registered and last checked in.</li>
      </ul>
      <p>
        Motiv never sends us recordings, transcripts, summaries, meeting details, calendar data or how you use the
        app.
      </p>

      <h3>When you chat with us</h3>
      <p>
        If you use the chat assistant on emruz.com, we store the conversation (your messages and the replies) to
        answer you, follow up and improve our answers. We link a conversation to your visit or account only if you
        allow improvement cookies or you are signed in and choose to; otherwise it is stored without that link. Chat
        logs are kept for 13 months, and you can get a copy or have them deleted like any other data.
      </p>

      <h3>Technical information</h3>
      <p>
        Like most websites, our hosting provider records technical details of requests, such as IP address, browser
        and the page requested, to deliver the site and protect it from abuse. We use IP addresses briefly to limit
        repeated requests (for example, too many sign-in attempts), and keep the IP address sent with a contact
        form message to help stop spam.
      </p>
      <p>
        We don&apos;t load fonts, scripts, images or other content from other companies&apos; servers, such as Google
        Fonts or content delivery networks. Other services are reached only when you choose them: signing in with
        Microsoft, Google or Apple, paying through Stripe checkout, or following a link to another site.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To provide your account, sign you in and keep it secure.</li>
        <li>To sell, deliver and manage Motiv subscriptions, including tax, receipts, renewals and refunds.</li>
        <li>To confirm that a computer is entitled to Motiv Pro and to enforce the number of computers per subscription.</li>
        <li>To send emails you need: sign-in links, purchase confirmations and important account notices.</li>
        <li>To answer questions and give support.</li>
        <li>To send you your self-assessment results and contact you about them, with your consent.</li>
        <li>To send the Insights newsletter, only if you subscribed and confirmed.</li>
        <li>To detect and prevent fraud and abuse, and to meet legal and tax obligations.</li>
      </ul>
      <p>
        We don&apos;t send marketing email unless you ask for it, and you can stop it any time. To help you, our
        support staff may view your account as you see it, for example to check a subscription or a registered
        computer. That access is limited to Emruz administrators and is logged.
      </p>

      <h2>Who helps us run emruz.com</h2>
      <p>We share information only with service providers who process it for us, under their own privacy terms:</p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Netlify</td><td>Hosts the website, the database and private file storage, including contact form messages, newsletter subscriptions, self-assessments and assessment evidence</td></tr>
          <tr><td>Stripe</td><td>Payments, tax calculation, invoices and the billing portal</td></tr>
          <tr><td>Resend</td><td>Sends sign-in, purchase, newsletter and self-assessment emails, and delivers contact form messages to us</td></tr>
          <tr><td>Microsoft, Google, Apple</td><td>Sign-in, only if you choose that option</td></tr>
        </tbody>
      </table>
      <p>
        <strong>Managed security customers:</strong> our EDR, MDR, XDR and ΔDR products are powered by WhiteDog Cyber.
        Data processed to deliver those services is handled under your service agreement with Emruz and WhiteDog
        Cyber&apos;s terms, at <a href={WHITEDOG_LEGAL_URL}>{WHITEDOG_LEGAL_URL.replace('https://', '')}</a>. This
        policy covers emruz.com itself.
      </p>
      <p>
        We may also disclose information if the law requires it, to protect our rights or the safety of others, or as
        part of a sale or reorganization of the business, in which case this policy continues to apply.
      </p>

      <h2>Information from Google</h2>
      <p>
        If you sign in with Google, we receive only your basic profile: an account identifier, your name and your
        email address. Our use of information received from Google APIs adheres to the{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>,
        including the Limited Use requirements. We use it only to sign you in and link your purchases, and we
        don&apos;t transfer it for advertising or let anyone read it except as needed to support you.
      </p>

      <h2 id="cookies">Cookies</h2>
      <p>
        All our cookies are first-party: set by emruz.com and read only by emruz.com. There are two kinds.
        <strong> Necessary</strong> cookies are always on, because the site can&apos;t work without them.
        <strong> Improvement</strong> cookies, for first-party analytics and for linking a chat conversation to your
        visit, are off unless you turn them on. On your first visit we ask which you allow, and you can change your
        choice any time in <Link href="/cookies">Cookie settings</Link>, linked at the bottom of every page. If your
        browser sends a Global Privacy Control signal, we treat it as a choice to keep improvement cookies off. We
        don&apos;t use advertising cookies.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Kind</th>
            <th>Purpose</th>
            <th>Lasts</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>emruz_session</td><td>Necessary</td><td>Keeps you signed in</td><td>30 days</td></tr>
          <tr><td>emruz_oauth_…</td><td>Necessary</td><td>Protects a Microsoft, Google or Apple sign-in while it is in progress</td><td>10 minutes</td></tr>
          <tr><td>emruz_admin_session</td><td>Necessary</td><td>Emruz administrators only, while viewing an account to give support</td><td>Up to 30 days, or until they switch back</td></tr>
          <tr><td>emruz_consent</td><td>Necessary</td><td>Remembers your cookie choice</td><td>12 months</td></tr>
          <tr><td>None today</td><td>Improvement</td><td>We&apos;ll list any improvement cookie here before we use it, and set it only with your permission</td><td>-</td></tr>
        </tbody>
      </table>

      <p>
        Some forms save what you have typed in your browser&apos;s local storage, so you don&apos;t lose it if you are
        signed out or the page reloads. The draft stays on your device, is never sent to us, and is removed when you
        submit the form.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Contact form messages: as long as needed to handle your request and any follow-up.</li>
        <li>Newsletter subscriptions: until you unsubscribe or ask us to delete them; unconfirmed sign-ups are not used.</li>
        <li>Account and sign-in details: while your account is open.</li>
        <li>
          Purchase and billing records: for as long as tax and accounting law requires, usually up to seven years,
          even after an account is closed.
        </li>
        <li>Registered computers: until you remove them or your account is closed.</li>
        <li>Assessment engagements, evidence and reports: for the period set in your agreement with us, then deleted.</li>
        <li>
          Self-assessments and registration details: until you delete them, withdraw consent on your assessments
          page, or close your account. Withdrawing consent deletes them; we keep only the date you consented and
          withdrew.
        </li>
        <li>Chat logs: 13 months.</li>
        <li>Activity and security logs: 13 months.</li>
        <li>
          Accounts you ask us to delete: until we approve the request, then permanently deleted. Purchase records are
          kept as described above.
        </li>
        <li>Privacy requests: two years after we close them, as a record of how we handled them.</li>
        <li>Sign-in links, sign-in attempts and rate-limit records: hours to days.</li>
      </ul>

      <h2>Your choices and rights</h2>
      <p>
        You can see and manage your subscriptions, computers and sign-in methods on your{' '}
        <Link href="/motiv/account">account page</Link>, and change or cancel billing in the Stripe billing portal
        linked from there. You can see, delete and withdraw consent for your self-assessments on your{' '}
        <Link href="/assessments/self/history">assessments page</Link>. You can also ask us to:
      </p>
      <ul>
        <li>give you a copy of the personal information we hold about you;</li>
        <li>correct it;</li>
        <li>delete it, except what we must keep for legal, tax or fraud-prevention reasons;</li>
        <li>stop using it for a purpose, where the law gives you that right.</li>
      </ul>
      <h3>How to make a request</h3>
      <ul>
        <li>
          <strong>With an account:</strong> on <Link href="/account">your profile</Link>, download a copy of your data
          straight away, or ask us to delete your account. Both ask you to sign in again if you haven&apos;t recently,
          and a deletion request is confirmed by an email link.
        </li>
        <li>
          <strong>Anyone:</strong> use the <Link href="/privacy/request">privacy request form</Link> to ask for a copy,
          a correction, deletion, or to opt out. We email you a link to confirm the request comes from you.
        </li>
        <li>
          Or email <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a> from the address you use with us.
        </li>
      </ul>
      <p>
        We review every request and respond within 30 days of confirming it (45 days for California residents), or sooner where the
        law requires, and we won&apos;t treat you differently for exercising these rights. To opt out of improvement
        cookies, use <Link href="/cookies">Cookie settings</Link> or turn on Global Privacy Control in your browser.
      </p>
      <p>
        <strong>California residents:</strong> we don&apos;t sell or share personal information as the California
        Consumer Privacy Act defines those terms, and we don&apos;t use sensitive personal information to infer
        characteristics about you.
      </p>
      <p>
        <strong>Visitors from the EU, UK and similar regions:</strong> we process personal information to perform our
        contract with you (your account and purchases), to meet legal obligations (tax records), and for our
        legitimate interests in running and securing the service. Our providers may process information in the
        United States. You may complain to your local data protection authority.
      </p>

      <h2>Security</h2>
      <p>
        We use encrypted connections, store sign-in tokens only in hashed form, keep secrets out of our code, and limit
        administrative access. No system is perfectly secure, so please tell us at{' '}
        <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a> if you believe your account is at risk.
      </p>

      <h2>Children</h2>
      <p>emruz.com and Motiv are for business use and are not directed to children under 16. We don&apos;t knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>
        We&apos;ll post changes here and update the date above. If a change materially affects how we use your
        information, we&apos;ll tell account holders by email before it takes effect.
      </p>

      <h2>Contact</h2>
      <p>
        {LEGAL_PARTY}, Santa Clara, California, USA.{' '}
        <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>
      </p>
      <p className="text-sm text-gray-500">© {COPYRIGHT_YEAR} {LEGAL_PARTY}. All rights reserved.</p>
    </LegalPage>
  );
}
