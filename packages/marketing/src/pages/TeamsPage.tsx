import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { teams, type Team } from '@/data/teams';
import { agents } from '@/data/agents';
import { useRoster } from '@/context/RosterContext';
import AssessmentCalloutBar from '@/components/AssessmentCalloutBar';
import TeamCard from '@/components/TeamCard';
import SectionHeader from '@/components/SectionHeader';
import GatedPage from '@/components/GatedPage';

export default function TeamsPage() {
  const { selectTeam } = useRoster();
  const navigate        = useNavigate();

  function handleReserve(team: Team) {
    selectTeam(team.id, team.agentIds);
    navigate('/reserve');
  }

  return (
    <GatedPage>
    <div>
      <AssessmentCalloutBar />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Page header */}
        <div className="mb-12">
          <SectionHeader
            eyebrow="Pre-Built Bundles"
            heading="Agent Teams"
            subheading={
              'Pre-built bundles for the most common business functions. ' +
              'Bundle pricing available for 3–5 agents.' // [UPDATE] add discount percentages
            }
          />
        </div>

        {/* Teams grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {teams.map((team) => {
            const teamAgents = agents.filter((a) => team.agentIds.includes(a.id));
            return (
              <TeamCard
                key={team.id}
                team={team}
                agents={teamAgents}
                onReserve={handleReserve}
              />
            );
          })}
        </div>

        {/* FCAIO nudge */}
        <div className="mt-16 rounded-lg bg-navy-950 px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-gray mb-2">
              Need more than 5 agents?
            </p>
            <p className="font-serif text-xl text-white">
              Let's talk about a different path.
            </p>
            <p className="text-sm text-navy-100 mt-2 max-w-md">
              When the scope goes beyond targeted automation, the Fractional Chief AI Officer
              engagement is designed for full organizational transformation.
            </p>
          </div>
          <a
            href="/fcaio"
            className="flex items-center gap-2 px-6 py-3 rounded border border-gold-500 text-gold-500
                       hover:bg-gold-500 hover:text-navy-950 transition-colors text-sm font-semibold shrink-0"
          >
            Explore FCAIO <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </div>
    </GatedPage>
  );
}
