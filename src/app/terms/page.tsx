import { Scale, ShieldCheck, MessageCircle, AlertTriangle, UserCheck, ShieldAlert, RefreshCcw, Info, Globe } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Terms & Conditions | UniDeal',
  description: 'Simple, student-friendly terms for using the UniDeal campus marketplace.'
}

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      icon: <CheckCircleIcon className="w-6 h-6 text-[#16a34a]" />,
      content: 'By accessing or using UniDeal, you agree to be bound by these Terms. If you do not agree, please do not use the platform.'
    },
    {
      title: '2. What UniDeal Is (and isn\'t)',
      icon: <Globe className="w-6 h-6 text-[#16a34a]" />,
      content: 'UniDeal is a marketplace connecting student buyers and sellers. We facilitate discovery, but all deals close off-platform (via WhatsApp). We are not a party to any transaction.'
    },
    {
      title: '3. User Eligibility',
      icon: <UserCheck className="w-6 h-6 text-[#16a34a]" />,
      content: 'The platform is open to any student. We accept any valid email address for registration; no specific university domain restriction applies.'
    },
    {
      title: '4. Listing Rules',
      icon: <Info className="w-6 h-6 text-[#16a34a]" />,
      content: 'You may only list physical items you personally own. Listings must include accurate descriptions and real photos. No services or digital goods are allowed.'
    },
    {
      title: '5. Prohibited Content',
      icon: <ShieldAlert className="w-6 h-6 text-red-600" />,
      content: 'Fake listings, inappropriate content, spam, illegal items, or harassment are strictly prohibited. We use AI and manual review to enforce these rules.'
    },
    {
      title: '6. Contact & Privacy',
      icon: <MessageCircle className="w-6 h-6 text-[#16a34a]" />,
      content: 'To facilitate trades, your WhatsApp number is stored securely. It is never displayed publicly; instead, we provide a secure "Message Seller" link.'
    },
    {
      title: '7. No Liability',
      icon: <Scale className="w-6 h-6 text-[#16a34a]" />,
      content: 'UniDeal connects buyers and sellers but is not responsible for the quality, safety, or legality of items, nor the successful completion of any transaction.'
    },
    {
      title: '8. Account Termination',
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      content: 'UniDeal reserves the right to suspend or ban any account that violates these terms or community standards without prior notice.'
    },
    {
      title: '9. Changes to Terms',
      icon: <RefreshCcw className="w-6 h-6 text-[#16a34a]" />,
      content: 'We may update these terms occasionally. Your continued use of UniDeal after changes are posted constitutes acceptance of the new terms.'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight font-display">Terms & Conditions</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Simple, transparent rules for our campus community. By using UniDeal, you agree to the following:
        </p>
      </div>

      <div className="grid gap-6">
        {sections.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 transition-all hover:border-green-100 hover:shadow-md">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              {s.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed text-sm lg:text-base">{s.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-8 bg-[#f0f6f0] rounded-2xl border border-green-100 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Still have questions?</h3>
        <p className="text-gray-600 mb-6 text-sm">Our team is here to help you trade safely on campus.</p>
        <Link href="/contact" className="inline-flex h-11 items-center px-8 bg-[#16a34a] hover:bg-green-700 text-white font-bold rounded-full transition-all">
          Contact Support
        </Link>
      </div>

      <div className="mt-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        Last Updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

