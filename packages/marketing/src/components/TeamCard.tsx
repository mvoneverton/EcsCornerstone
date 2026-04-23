import { ArrowRight } from 'lucide-react';
import type { Team } from '@/data/teams';
import type { Agent } from '@/data/agents';
import AgentIcon from './AgentIcon';
import PricingNote from './PricingNote';

interface Props {
  team: Team;
  agents: Agent[];
  onReserve: (team: Team) => void;
}

export default function TeamCard({ team, agents, onReserve }: Props) {
  const agentCount    = team.agentIds.length;
  const monthlyTotal  = agentCount * team.monthlyStartingAt;
  const reserveTotal  = agentCount * team.reservationFeePerAgent;

  return (
    <div className="flex flex-col rounded-lg border border-navy-100 bg-white hover:border-navy-200 hover:shadow-sm transition-all">
      <div className="p-6 flex flex-col flex-1 gap-5">
        {/* Header */}
        <div>
          <h3 className="font-serif text-xl text-navy-900">{team.name}</h3>
          <p className="text-sm font-medium text-gold-500 mt-0.5">{team.tagline}</p>
        </div>

        <p className="text-sm text-navy-700 leading-relaxed">{team.description}</p>

        {/* Agent chips */}
        <div className="flex flex-wrap gap-2">
          {agents.map((agent) => (
            <span
              key={agent.id}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-navy-50 text-navy-800"
            >
              <AgentIcon agentId={agent.id} size={12} />
              {agent.name}
            </span>
          ))}
        </div>

        {/* Pricing */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-navy-900">
              Starting at ${monthlyTotal.toLocaleString()}/month
            </span>
            {/* [UPDATE] show discount badge once percentages are confirmed */}
            {team.discountPercent !== null && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gold-100 text-gold-500">
                {team.discountPercent}% off
              </span>
            )}
          </div>
          <p className="text-xs text-blue-gray">
            ${reserveTotal} to reserve ({agentCount} agents × ${team.reservationFeePerAgent})
          </p>
        </div>

        <PricingNote variant="pause" />

        {/* CTA */}
        <button
          onClick={() => onReserve(team)}
          className="mt-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded
                     bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
        >
          Reserve This Team <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
