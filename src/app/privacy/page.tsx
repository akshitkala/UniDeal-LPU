import { ShieldCheck, Lock, Eye, Trash2, Scale } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | UniDeal',
  description: 'How we protect your data and privacy on the campus marketplace.'
}

export default function PrivacyPolicy() {
  const sections = [
    {
      title: 'Data Collection',
      icon: <Eye className="w-6 h-6 text-[#2D9A54]" />,
      content: 'We collect your email, display name, and profile picture via Google Auth solely to manage your account. Phone numbers are stored securely and never exposed raw to other users.'
    },
    {
      title: 'WhatsApp Privacy',
      icon: <Lock className="w-6 h-6 text-[#2D9A54]" />,
      content: 'Your WhatsApp number is shielded. Potential buyers are provided with a secure "wa.me" deep link. This ensures your number is not scrapable by bots or unauthorized third parties.'
    },
    {
      title: 'AI Moderation',
      icon: <ShieldCheck className="w-6 h-6 text-[#2D9A54]" />,
      content: 'All listings are processed by Gemini AI to detect prohibited items (drugs, weapons, adult content). AI metadata is stored temporarily to improve platform safety.'
    },
    {
      title: 'Right to Overwrite',
      icon: <Trash2 className="w-6 h-6 text-[#2D9A54]" />,
      content: 'At any time, you can trigger a "Cascade Wipe" from your profile. This permanently deletes your user profile, active listings, and associated images from our MongoDB and Cloudinary buckets.'
    },
    {
      title: 'Compliance',
      icon: <Scale className="w-6 h-6 text-[#2D9A54]" />,
      content: 'UniDeal acts as a facilitator for peer-to-peer campus trades. We do not store financial data or process payments directly on the platform.'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          At UniDeal, we take user privacy seriously. Our architecture is built with "privacy-by-default" principles specifically for the campus community.
        </p>
      </div>

      <div className="grid gap-8">
        {sections.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-[#E5E5E5] shadow-sm flex flex-col md:flex-row gap-6">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              {s.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed">{s.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Still have questions?</h3>
        <p className="text-gray-600 mb-6">Our moderation team is here to help you understand how your data is handled.</p>
        <Link href="/contact" className="inline-flex h-11 items-center px-8 bg-[#2D9A54] hover:bg-[#258246] text-white font-bold rounded-lg transition-colors">
          Contact Support
        </Link>
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        Last Updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}
