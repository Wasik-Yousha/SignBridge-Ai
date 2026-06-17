import { MessageCircleHeart, Zap, Users, Globe } from 'lucide-react';
import { FeatureCard, InfoCard, TechBadge } from '../components/ui';
import { TECH_STACK } from '../constants';

/**
 * FEATURES - Data for the feature cards displayed on the About page.
 */
const FEATURES = [
  {
    icon: <MessageCircleHeart className="text-[#2a7e75]" />,
    title: 'Accessible Communication',
    description:
      'Breaking down communication barriers for the deaf and hard-of-hearing community through AI-powered sign language translation.',
  },
  {
    icon: <Zap className="text-[#2a7e75]" />,
    title: 'Real-time Translation',
    description:
      'Convert text or video content to sign language animations instantly with our advanced AI technology.',
  },
  {
    icon: <Users className="text-[#2a7e75]" />,
    title: 'Human-centered Design',
    description:
      'Developed in collaboration with the deaf community to ensure accurate and natural sign language representation.',
  },
  {
    icon: <Globe className="text-[#2a7e75]" />,
    title: 'Multiple Sign Languages',
    description:
      'Supporting various sign language standards including ASL, BSL, and more regional variations.',
  },
];

/**
 * AboutPage - Dedicated page with About, Mission, and Technology sections.
 */
const AboutPage = () => (
  <>
    {/* About Section */}
    <section className="bg-white py-24 border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif text-slate-900 mb-4">
            About Sign Bridge AI
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            We&apos;re building technology that bridges the gap between spoken
            and signed languages, making communication accessible for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {FEATURES.map((feat) => (
            <FeatureCard
              key={feat.title}
              icon={feat.icon}
              title={feat.title}
              description={feat.description}
            />
          ))}
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-12 text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-serif italic text-slate-800 mb-4">
            &ldquo;Communication is a human right, not a privilege.&rdquo;
          </h3>
          <p className="text-slate-500">
            Our mission is to make sign language accessible through technology,
            empowering millions of deaf and hard-of-hearing individuals
            worldwide.
          </p>
        </div>
      </div>
    </section>

    {/* Mission & Tech Stack Section */}
    <section className="bg-[#FAFAFA] py-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-slate-900 mb-4">
            Our Mission
          </h2>
          <p className="text-slate-500">
            Sign Bridge AI is dedicated to breaking down communication barriers
            between the deaf and hearing communities through innovative AI
            technology.
          </p>
        </div>

        <div className="space-y-6">
          <InfoCard title="The Problem We're Solving">
            <p className="text-slate-500 text-sm mb-4">
              Over 70 million people worldwide are deaf, with millions more
              experiencing hearing loss. Communication barriers persist in
              education, healthcare, employment, and daily interactions.
            </p>
            <p className="text-slate-500 text-sm">
              Sign language interpreters are scarce and expensive, leaving many
              without access to essential services and opportunities.
            </p>
          </InfoCard>

          <InfoCard title="Our Solution">
            <p className="text-slate-500 text-sm mb-4">
              Sign Bridge AI uses cutting-edge technology to create realistic,
              AI-powered sign language avatars that can translate text and speech
              in real-time.
            </p>
            <ul className="text-slate-500 text-sm space-y-2 list-disc pl-5 marker:text-slate-300">
              <li>Real-time text to sign language conversion</li>
              <li>Video transcription with sign language output</li>
              <li>
                Natural, fluid avatar animations using 3D motion capture data
              </li>
              <li>
                Support for multiple sign languages (ASL, BSL, and more)
              </li>
            </ul>
          </InfoCard>

          <InfoCard title="Technology Stack">
            <p className="text-slate-500 text-sm mb-6">
              Built with modern, scalable technologies designed for future
              expansion:
            </p>
            <div className="flex flex-wrap gap-3">
              {TECH_STACK.map((tech) => (
                <TechBadge key={tech} name={tech} />
              ))}
            </div>
          </InfoCard>
        </div>
      </div>
    </section>
  </>
);

export default AboutPage;
