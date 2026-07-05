'use client';

import { Hero, SectionIntro, Container, Card } from '@/components';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send to a backend or email service
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <>
      {/* Hero */}
      <Hero
        headline="Get in Touch"
        subheadline="Let's discuss your security, cloud, or AI challenges. We're here to help."
        primaryCta={{
          label: 'Schedule Assessment',
          href: '#contact-form',
        }}
        secondaryCta={{
          label: 'Back to Services',
          href: '/services',
        }}
      />

      {/* Contact Form & Info */}
      <section className="py-16 md:py-24">
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
                  Tell us about your project or challenge. We'll get back to you within 24 hours.
                </p>

                {submitted && (
                  <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    Thanks for your message! We'll be in touch soon.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Send Message
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
      <section className="bg-gradient-to-br from-slate-50 to-purple-50 py-16 md:py-24">
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
