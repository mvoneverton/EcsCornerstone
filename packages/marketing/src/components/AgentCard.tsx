import { Link } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import type { Agent } from '@/data/agents';
import AgentIcon from './AgentIcon';

interface Props {
  agent: Agent;
  isSelected: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function AgentCard({ agent, isSelected, onAdd, onRemove }: Props) {
  return (
    <div
      className={`relative flex flex-col rounded-lg border bg-white transition-all ${
        isSelected
          ? 'border-gold-500 shadow-md shadow-gold-100'
          : 'border-navy-100 hover:border-navy-200 hover:shadow-sm'
      }`}
    >
      {/* Selected checkmark badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-gold-500">
          <Check size={13} className="text-navy-950" strokeWidth={3} />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1 gap-4">
        {/* Icon + name */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-50 shrink-0">
            <AgentIcon agentId={agent.id} size={20} className="text-navy-800" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900 leading-tight">{agent.name}</h3>
            <p className="text-xs text-blue-gray mt-0.5">{agent.role}</p>
          </div>
        </div>

        {/* Pricing badge */}
        <span className="self-start text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-50 text-navy-800">
          Starting at ${agent.monthlyStartingAt.toLocaleString()}/month
        </span>

        {/* Description — 2-line clamp */}
        <p className="text-sm text-navy-700 leading-relaxed line-clamp-2">{agent.description}</p>

        {/* Capability pills */}
        <div className="flex flex-wrap gap-1.5">
          {agent.capabilities.map((cap) => (
            <span
              key={cap}
              className="text-xs px-2 py-0.5 rounded-full bg-navy-100 text-navy-700"
            >
              {cap}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-auto pt-2">
          <button
            onClick={() => (isSelected ? onRemove(agent.id) : onAdd(agent.id))}
            className={`flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold transition-colors ${
              isSelected
                ? 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                : 'bg-navy-900 text-white hover:bg-navy-800'
            }`}
          >
            {isSelected ? (
              <>Remove</>
            ) : (
              <><Plus size={14} /> Add to Roster</>
            )}
          </button>

          <Link
            to={`/agents/${agent.id}`}
            className="text-sm text-navy-700 hover:text-gold-500 transition-colors underline underline-offset-2"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
