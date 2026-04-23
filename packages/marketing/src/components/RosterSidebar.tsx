import { Link, useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { useRoster } from '@/context/RosterContext';
import { agents } from '@/data/agents';
import AgentIcon from './AgentIcon';
import PricingNote from './PricingNote';

export default function RosterSidebar() {
  const { selectedAgentIds, removeAgent } = useRoster();
  const navigate = useNavigate();

  const selectedAgents = agents.filter((a) => selectedAgentIds.includes(a.id));
  const count          = selectedAgents.length;
  const reserveTotal   = count * 10;
  const monthlyEst     = count * 800;

  if (count === 0) {
    return (
      <>
        {/* Desktop empty state */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-24 rounded-lg border border-navy-100 bg-navy-50 p-6">
          <p className="text-sm font-semibold text-navy-900">Your Roster</p>
          <p className="text-sm text-blue-gray">
            Add agents using the <strong>Add to Roster</strong> button on each card.
          </p>
        </aside>
      </>
    );
  }

  const sidebar = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-navy-900">
          Your Roster ({count} agent{count !== 1 ? 's' : ''})
        </p>
        {count === 6 && (
          <Link
            to="/fcaio"
            className="text-xs text-gold-500 hover:text-gold-400 underline underline-offset-2 transition-colors"
          >
            Consider FCAIO →
          </Link>
        )}
      </div>

      {/* Agent list */}
      <ul className="flex flex-col gap-2">
        {selectedAgents.map((agent) => (
          <li
            key={agent.id}
            className="flex items-center gap-2 text-sm text-navy-800"
          >
            <AgentIcon agentId={agent.id} size={14} className="text-navy-700 shrink-0" />
            <span className="flex-1 truncate">{agent.name}</span>
            <button
              onClick={() => removeAgent(agent.id)}
              className="text-blue-gray hover:text-navy-900 transition-colors"
              aria-label={`Remove ${agent.name}`}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-navy-100 pt-4 flex flex-col gap-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-navy-700">Reserve today</span>
          <span className="font-semibold text-navy-900">${reserveTotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-navy-700">Monthly est.</span>
          <span className="font-semibold text-navy-900">
            ${monthlyEst.toLocaleString()}/mo
          </span>
        </div>

        {/* [UPDATE] show bundle discount once percentages confirmed */}
        {count >= 3 && (
          <p className="text-xs text-gold-500 font-medium mt-1">
            Bundle pricing available — discount applied at checkout. {/* [UPDATE] show exact % */}
          </p>
        )}

        {count === 6 && (
          <div className="mt-2 rounded bg-navy-50 border border-navy-100 p-3 text-xs text-navy-700 leading-relaxed">
            Considering all six agents?{' '}
            <Link to="/fcaio" className="text-gold-500 underline underline-offset-2">
              The FCAIO path
            </Link>{' '}
            may be a better fit.
          </div>
        )}
      </div>

      <PricingNote variant="deposit" />
      <PricingNote variant="pause" />

      <button
        onClick={() => navigate('/reserve')}
        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded
                   bg-gold-500 text-navy-950 text-sm font-semibold hover:bg-gold-400
                   transition-colors"
      >
        Reserve Now <ArrowRight size={15} />
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block sticky top-24 rounded-lg border border-gold-500/30 bg-white shadow-sm p-6">
        {sidebar}
      </aside>

      {/* Mobile fixed bottom bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-navy-100 bg-white shadow-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy-900 truncate">
              {count} agent{count !== 1 ? 's' : ''} — ${monthlyEst.toLocaleString()}/mo est.
            </p>
            <p className="text-xs text-blue-gray">${reserveTotal} to reserve</p>
          </div>
          <button
            onClick={() => navigate('/reserve')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded bg-gold-500 text-navy-950 text-sm font-semibold hover:bg-gold-400 transition-colors shrink-0"
          >
            Reserve <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
