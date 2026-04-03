import { 
  sendWelcomeEmail, 
  sendListingRejected, 
  sendListingDeletedByAdminEmail, 
  sendListingExpired, 
  sendAccountBanned, 
  sendAccountDeleted, 
  sendContactMessage 
} from '../src/lib/email/resend';
import * as fs from 'fs';

async function runTests() {
  console.log('🚀 Starting Resend Email Service Tests...');
  const testEmail = 'test@example.com';
  const results: any[] = [];

  const tests = [
    {
      name: 'Welcome Email',
      fn: () => sendWelcomeEmail(testEmail, 'Test User')
    },
    {
      name: 'Listing Rejected',
      fn: () => sendListingRejected(testEmail, 'Test Item', 'Inappropriate content')
    },
    {
      name: 'Listing Deleted by Admin',
      fn: () => sendListingDeletedByAdminEmail({ 
        to: testEmail, 
        name: 'Test User', 
        listing: 'Test Item', 
        reason: 'Violates terms of service' 
      })
    },
    {
      name: 'Listing Expired',
      fn: () => sendListingExpired(testEmail, 'Old Item')
    },
    {
      name: 'Account Banned',
      fn: () => sendAccountBanned(testEmail, 'Multiple policy violations')
    },
    {
      name: 'Account Deleted',
      fn: () => sendAccountDeleted(testEmail)
    },
    {
      name: 'Contact Message (Admin & User)',
      fn: () => sendContactMessage(testEmail, 'Test User', 'Hello, I have a question about my listing.')
    }
  ];

  for (const test of tests) {
    console.log(`Testing: ${test.name}...`);
    try {
      const result = await test.fn();
      results.push({
        test: test.name,
        success: result.success,
        data: result.data || null,
        error: result.error || null,
        mocked: result.mocked || false
      });
      if (result.success) {
        console.log(`✅ ${test.name} passed.`);
      } else {
        console.error(`❌ ${test.name} failed.`);
      }
    } catch (error) {
      console.error(`💥 ${test.name} threw an exception:`, error);
      results.push({
        test: test.name,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  generateAuditReport(results);
}

function generateAuditReport(results: any[]) {
  const timestamp = new Date().toISOString();
  const summary = {
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    mockedCount: results.filter(r => r.mocked).length
  };

  let report = `# Resend Email Service Audit Report\n\n`;
  report += `**Timestamp:** ${timestamp}\n`;
  report += `**Environment:** ${process.env.RESEND_API_KEY ? 'Production' : 'Mocked'}\n\n`;
  
  report += `## Summary\n`;
  report += `- **Total Tests:** ${summary.total}\n`;
  report += `- **Passed:** ${summary.passed} ✅\n`;
  report += `- **Failed:** ${summary.failed} ❌\n`;
  report += `- **Mocked:** ${summary.mockedCount} (No API Key)\n\n`;

  report += `## Detailed Results\n\n`;
  report += `| Test Case | Status | Details |\n`;
  report += `|-----------|--------|---------|\n`;

  for (const r of results) {
    const status = r.success ? '✅ Pass' : '❌ Fail';
    const details = r.error ? JSON.stringify(r.error) : (r.mocked ? 'Mocked (Missing API Key)' : 'Sent Successfully');
    report += `| ${r.test} | ${status} | ${details} |\n`;
  }

  const reportPath = 'email-service-audit-report.md';
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Audit report generated at: ${reportPath}`);
}

runTests().catch(console.error);
