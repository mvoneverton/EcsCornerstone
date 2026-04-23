import { agents } from '@/data/agents';
import { useRoster } from '@/context/RosterContext';
import AssessmentCalloutBar from '@/components/AssessmentCalloutBar';
import AgentCard from '@/components/AgentCard';
import RosterSidebar from '@/components/RosterSidebar';
import SectionHeader from '@/components/SectionHeader';
import GatedPage from '@/components/GatedPage';

export default function AgentsPage() {
  const { selectedAgentIds, addAgent, removeAgent } = useRoster();

  return (
    <GatedPage>
    <div className="pb-24 lg:pb-0">
      <AssessmentCalloutBar />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Page header */}
        <div className="mb-12">
          <SectionHeader
            eyebrow="AI Agent Marketplace"
            heading="Our Agents"
            subheading="Specialized AI professionals. Configured to your team. Starting at $800/month."
          />
        </div>

        {/* Two-column layout: grid + sidebar */}
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-10 xl:gap-16">
          {/* Agent grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgentIds.includes(agent.id)}
                onAdd={addAgent}
                onRemove={removeAgent}
              />
            ))}
          </div>

          {/* Roster sidebar */}
          <RosterSidebar />
        </div>
      </div>
    </div>
    </GatedPage>
  );
}
