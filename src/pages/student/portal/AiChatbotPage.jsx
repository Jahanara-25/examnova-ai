import { FaRobot, FaPaperPlane } from 'react-icons/fa';
import { PageHeader, ReusableCard, ReusableButton } from '../../../components/ui/PortalUI';

export default function AiChatbotPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Chatbot" subtitle="Ask for summaries, practice recommendations, or revision plans" />
      <ReusableCard title="Assistant" subtitle="Mock-ready conversational experience">
        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3 rounded-2xl bg-white p-3 text-sm text-slate-700">
            <FaRobot className="mt-1 text-slate-900" />
            <p>I can help summarize your last lecture, create a revision plan, or explain tricky concepts by subject.</p>
          </div>
          <div className="mt-3 flex gap-3">
            <input className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none" placeholder="Ask about your study plan" />
            <ReusableButton><FaPaperPlane className="mr-2 inline" /> Send</ReusableButton>
          </div>
        </div>
      </ReusableCard>
    </div>
  );
}
