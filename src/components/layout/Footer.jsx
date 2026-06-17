import { Github, Twitter, Mail } from 'lucide-react';
import { SocialIcon } from '../ui';
import { SOCIAL_LINKS } from '../../constants';

/**
 * Footer - Minimal footer with social links.
 */
const Footer = () => (
  <footer className="bg-[#FAFAFA] py-12 border-t border-gray-100">
    <div className="max-w-3xl mx-auto px-6 text-center">
      <h3 className="text-2xl font-serif text-slate-900 mb-6">Get in Touch</h3>
      <div className="flex justify-center gap-4 text-slate-400">
        <SocialIcon href={SOCIAL_LINKS.github} icon={Github} label="GitHub" />
        <SocialIcon href={SOCIAL_LINKS.twitter} icon={Twitter} label="Twitter" />
        <SocialIcon href={SOCIAL_LINKS.mail} icon={Mail} label="Email" />
      </div>
      <p className="text-xs text-slate-400 mt-8">
        &copy; {new Date().getFullYear()} Sign Bridge AI. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
