import Link from 'next/link';
import LegalPage, { LEGAL_CONTACT, LEGAL_PARTY } from '@/components/LegalPage';

export const metadata = {
  title: 'Terms of service',
  description: 'Terms for using emruz.com, Emruz accounts and Motiv subscriptions.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      summary="The terms for using emruz.com, your Emruz account and Motiv subscriptions."
      updated="9 November 2026"
      path="/terms"
    >
      <p>
        These terms are an agreement between you and {LEGAL_PARTY} (&quot;Emruz&quot;, &quot;we&quot;,
        &quot;us&quot;). They apply when you use emruz.com, create an account, or buy a Motiv subscription. If you
        use them for an organization, you agree on its behalf and confirm you have authority to do so. Use of the
        Motiv app itself is also governed by the <Link href="/motiv/eula">Motiv license agreement (EULA)</Link>, and
        our <Link href="/privacy">privacy policy</Link> explains how we handle personal information.
      </p>

      <h2>1. Using emruz.com</h2>
      <p>
        You may use the site to learn about Emruz, contact us, and manage your account and purchases. Don&apos;t
        misuse it: no attempts to break in, overload or disrupt it, scrape it at scale, or use it to send spam or
        unlawful content.
      </p>
      <p>
        Information on the site about our services is general and isn&apos;t professional advice for your situation.
        Consulting and managed security services are provided only under a separate written agreement, which governs
        those services instead of these terms.
      </p>

      <h2>2. Your account</h2>
      <p>
        Keep your sign-in methods secure and your email address current; we send important notices there. You are
        responsible for activity in your account. Tell us at <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>{' '}
        if you think someone else has used it. To give support, Emruz administrators can view your account as you see
        it; that access is logged.
      </p>

      <h2>3. Motiv subscriptions</h2>
      <h3>Plans</h3>
      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Price</th>
            <th>Billing</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Monthly</td><td>$9 per month</td><td>Renews automatically every month</td></tr>
          <tr><td>Annual</td><td>$99 per year</td><td>Renews automatically every year</td></tr>
          <tr><td>Lifetime</td><td>$299 once</td><td>One payment, no renewal</td></tr>
        </tbody>
      </table>
      <p>
        Prices are in US dollars. Sales tax, VAT or GST is added at checkout where it applies. Payments are processed
        by Stripe.
      </p>

      <h3>Automatic renewal</h3>
      <p>
        Monthly and annual subscriptions renew automatically at the end of each period, charged to your payment
        method, until you cancel. We&apos;ll email you a receipt for each charge. If we change the price of your plan,
        we&apos;ll email you at least 30 days before it applies to your next renewal, and you can cancel before then.
      </p>

      <h3>Cancelling</h3>
      <p>
        Cancel any time from your <Link href="/motiv/account">account page</Link> (Billing &amp; receipts). Premium
        stays on until the end of the period you&apos;ve paid for, then stops. Cancelling doesn&apos;t delete
        anything in Motiv; free features and your meetings keep working.
      </p>

      <h3>Refunds</h3>
      <p>
        If Motiv Premium isn&apos;t right for you, email <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>{' '}
        within 14 days of your first purchase of a plan for a full refund. Renewals aren&apos;t refunded, but you can
        cancel at any time to stop the next one. A refund ends the subscription and Premium stops. Nothing here limits
        a refund right you have under the law where you live.
      </p>

      <h3>Lifetime plan</h3>
      <p>
        A lifetime plan includes Premium for as long as Emruz offers Motiv, including updates we release during that
        time, without further payment. It is subject to the same rules as other plans, including the limits below.
      </p>

      <h3>Computers and check-in</h3>
      <p>
        Each subscription can be used on up to two computers at a time unless your plan says otherwise. You can
        remove a computer from your account page to free its place. Motiv checks in with emruz.com about once a day to
        keep Premium on; if it can&apos;t reach us, Premium keeps working for a while and then pauses until it
        connects again. Subscription IDs are personal to the subscriber and must not be shared beyond your computers.
      </p>

      <h3>Suspension and revocation</h3>
      <p>We may suspend or revoke a subscription, including a lifetime plan, without refund if:</p>
      <ul>
        <li>it is shared, resold or used on more computers than allowed;</li>
        <li>someone tries to get around Motiv&apos;s license checks;</li>
        <li>a payment is reversed, charged back or obtained by fraud; or</li>
        <li>it is used in serious breach of these terms or the EULA.</li>
      </ul>
      <p>
        Where it&apos;s reasonable, we&apos;ll tell you first and give you a chance to fix the problem. Revoking
        Premium never deletes your meetings; free features keep working.
      </p>

      <h3>Changes to Motiv</h3>
      <p>
        We improve Motiv over time and may add, change or remove features. If we stop offering Motiv Premium, we&apos;ll
        give subscribers at least 60 days&apos; notice and refund the unused part of any prepaid monthly or annual
        period.
      </p>

      <h2>4. Intellectual property</h2>
      <p>
        The site, the Emruz and Motiv names and logos, and Motiv are owned by Emruz or its licensors. These terms
        don&apos;t give you any rights in them except to use the site and Motiv as described here and in the EULA.
        If you send us feedback, we may use it without obligation to you.
      </p>

      <h2>5. Disclaimers</h2>
      <p>
        The site and Motiv are provided &quot;as is&quot; and &quot;as available&quot;. To the extent the law allows,
        we disclaim all implied warranties, including merchantability, fitness for a particular purpose and
        non-infringement. AI-generated summaries, transcripts and answers can be wrong or incomplete; check anything
        important.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the extent the law allows, Emruz isn&apos;t liable for indirect, incidental, special, consequential or
        punitive damages, or for lost profits, revenue or data. Our total liability for any claim about the site or
        Motiv is limited to the amount you paid us for Motiv in the 12 months before the claim. Some places don&apos;t
        allow these limits, so they may not all apply to you.
      </p>

      <h2>7. Ending these terms</h2>
      <p>
        You can stop using the site and close your account at any time by emailing us. We may suspend or close
        accounts that break these terms. Sections that by their nature should survive (such as payment owed,
        disclaimers and limits of liability) continue after these terms end.
      </p>

      <h2>8. Law and disputes</h2>
      <p>
        These terms are governed by the laws of the State of California, USA, without regard to conflict-of-law rules.
        Disputes will be resolved in the state or federal courts located in Santa Clara County, California, and you and
        we consent to their jurisdiction. If you are a consumer, you keep any protections the law where you live
        gives you.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>
        We may update these terms. We&apos;ll post the new version here and update the date above, and we&apos;ll email
        account holders about material changes before they take effect. Continuing to use the site or your
        subscription after that means you accept the new terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        {LEGAL_PARTY}, Santa Clara, California, USA. <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>
      </p>
    </LegalPage>
  );
}
