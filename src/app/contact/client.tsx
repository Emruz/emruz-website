'use client';

import { PageHeader, SectionIntro, Container, Card } from '@/components';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    topic: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Prefill the topic from ?topic= (e.g. a package code or "motiv")
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const q = new URLSearchParams(window.location.search);
      const topic = q.get('topic');
      const message = q.get('message');
      if (topic || message)
        setFormData((f) => ({ ...f, topic: topic ?? f.topic, message: message ?? f.message }));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submits to /api/contact, which saves the message and emails it to us.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const website = (e.currentTarget.elements.namedItem('website') as HTMLInputElement | null)?.value || '';
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, website }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      setFormData({ name: '', email: '', company: '', topic: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      {/* Hero */}
      <PageHeader
        eyebrow="Contact"
        title="Get in Touch"
        description="Let's discuss your security, cloud, or AI challenges. We're here to help."
      />

      {/* Contact Form & Info */}
      <section className="py-10 md:py-12">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div>
              <SectionIntro heading="Contact Info" align="left" />

              <div className="space-y-6">
                <Card hoverable className="border-0 shadow-lg">
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Email</h4>
                      <a
                        href="mailto:contact@emruz.com"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        contact@emruz.com
                      </a>
                    </div>
                  </div>
                </Card>

                <Card hoverable className="border-0 shadow-lg">
                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Phone</h4>
                      <p className="text-gray-600">Available by appointment</p>
                    </div>
                  </div>
                </Card>

                <Card hoverable className="border-0 shadow-lg">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        Distributed Team
                      </h4>
                      <p className="text-gray-600">We work across time zones</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              <div id="contact-form" className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Send us a message
                </h3>
                <p className="text-gray-600 mb-6">
                  Tell us about your project or challenge and we’ll get back to you.
                </p>

                <div aria-live="polite">
                  {status === 'sent' && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg">
                      Thanks, your message was sent. We&apos;ll be in touch.
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg">
                      Your message could not be sent. Please email{' '}
                      <a href="mailto:contact@emruz.com" className="underline">contact@emruz.com</a> instead.
                    </div>
                  )}
                </div>

                <form name="contact" onSubmit={handleSubmit} className="space-y-4">
                  {/* Spam trap: hidden from people, filled in by bots */}
                  <div aria-hidden="true" className="hidden">
                    <label htmlFor="website">Website</label>
                    <input id="website" name="website" tabIndex={-1} autoComplete="off" />
                  </div>
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Company (Optional)
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="Your company"
                    />
                  </div>

                  <div>
                    <label htmlFor="topic" className="block text-sm font-semibold text-gray-900 mb-2">
                      Topic (Optional)
                    </label>
                    <input
                      type="text"
                      id="topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. vCISO, XDR-ES, Motiv"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none"
                      placeholder="Tell us about your challenge..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {status === 'sending' ? 'Sending…' : 'Send Message'}
                  </button>

                  <p className="text-xs text-gray-600 text-center">
                    We respect your privacy. Your information will be kept confidential.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Quick Links */}
      <section className="bg-gradient-to-br from-slate-50 to-purple-50 py-12 md:py-16">
        <Container>
          <SectionIntro heading="Quick Links" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Schedule an Assessment',
                description: 'Start with a diagnostic.',
                link: '/assessments',
              },
              {
                title: 'Explore Services',
                description: 'See what we offer.',
                link: '/services',
              },
              {
                title: 'Learn More',
                description: 'Read about our approach.',
                link: '/about',
              },
            ].map((item, i) => (
              <a
                key={i}
                href={item.link}
                className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-0"
              >
                <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </a>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
