import { useParams, Link, Navigate } from 'react-router-dom';
import { Check, Plus, ArrowLeft } from 'lucide-react';
import { agents } from '@/data/agents';
import { useRoster } from '@/context/RosterContext';
import AgentIcon from '@/components/AgentIcon';
import PricingNote from '@/components/PricingNote';

export default function AgentDetailPage() {
  const { agentId }                       = useParams<{ agentId: string }>();
  const { selectedAgentIds, addAgent, removeAgent } = useRoster();

  const agent      = agents.find((a) => a.id === agentId);
  const isSelected = !!agentId && selectedAgentIds.includes(agentId);

  if (!agent) return <Navigate to="/agents" replace />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Back link */}
      <Link
        to="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-blue-gray hover:text-navy-900 transition-colors mb-10"
      >
        <ArrowLeft size={15} /> All Agents
      </Link>

      {/* ── Section 1: Hero ──────────────────────────────────────────────── */}
      <div className="rounded-xl bg-navy-950 px-8 py-10 flex flex-col sm:flex-row gap-8 items-start sm:items-center mb-10">
        <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-navy-800 shrink-0">
          <AgentIcon agentId={agent.id} size={28} className="text-gold-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-gray mb-1">
            {agent.role}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-white">{agent.name}</h1>
          <p className="text-sm text-navy-100 mt-1">
            Starting at ${agent.monthlyStartingAt.toLocaleString()}/month
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => (isSelected ? removeAgent(agent.id) : addAgent(agent.id))}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded text-sm font-semibold transition-colors ${
              isSelected
                ? 'bg-navy-700 text-white hover:bg-navy-600'
                : 'bg-gold-500 text-navy-950 hover:bg-gold-400'
            }`}
          >
            {isSelected ? (
              <><Check size={15} /> Added to Roster</>
            ) : (
              <><Plus size={15} /> Add to Roster</>
            )}
          </button>
          <PricingNote variant="deposit" className="text-center text-navy-100" />
        </div>
      </div>

      {/* ── Section 2: What This Agent Does ─────────────────────────────── */}
      <section className="mb-10">
        <h2 className="font-serif text-2xl text-navy-900 mb-4">What This Agent Does</h2>
        <p className="text-navy-700 leading-relaxed mb-6">{agent.description}</p>

        <ul className="flex flex-col gap-3">
          {agent.capabilities.map((cap) => (
            <li key={cap} className="flex items-start gap-3">
              <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-gold-100 shrink-0">
                <Check size={11} className="text-gold-500" strokeWidth={3} />
              </div>
              <span className="text-sm text-navy-800">{cap}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Section 3: Use Cases ─────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="font-serif text-2xl text-navy-900 mb-6">Example Use Cases</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {agent.useCases.map((uc, idx) => (
            <div
              key={idx}
              className="rounded-lg bg-navy-50 border border-navy-100 p-5"
            >
              <p className="text-sm text-navy-800 leading-relaxed">{uc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Cornerstone Integration (conditional) ────────────── */}
      {agent.cornerstoneEnabled && (
        <section className="mb-10 rounded-lg border border-gold-500/30 bg-gold-100 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-2">
            ECS Cornerstone Enabled
          </p>
          <h2 className="font-serif text-xl text-navy-900 mb-3">
            This agent knows your team before it starts working.
          </h2>
          <p className="text-sm text-navy-700 leading-relaxed">
            {agent.name} uses your team's ECS Cornerstone profiles — configured during the ECS AI
            Audit — to adapt its communication style to every person it interacts with. The same
            agent speaks differently to a Vanguard than it does to a Cultivator.
          </p>
          <Link
            to="/cornerstone"
            className="inline-block mt-4 text-sm font-semibold text-gold-500 hover:text-gold-400 underline underline-offset-2 transition-colors"
          >
            Learn about ECS Cornerstone →
          </Link>
        </section>
      )}

      {/* ── Section 5: Pricing ──────────────────────────────────────────── */}
      <section className="mb-10 rounded-lg bg-navy-50 border border-navy-100 px-6 py-6">
        <h2 className="font-serif text-2xl text-navy-900 mb-5">Pricing</h2>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <p className="text-3xl font-semibold text-navy-900">
              ${agent.monthlyStartingAt.toLocaleString()}
              <span className="text-base font-normal text-navy-700">/month</span>
            </p>
            <p className="text-sm text-navy-700 mt-1">Starting price — final pricing set after assessment.</p>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-navy-700">
            <p className="flex items-center gap-2">
              <Check size={13} className="text-gold-500 shrink-0" strokeWidth={3} />
              ${agent.reservationFee} deposit to reserve — applied to first month
            </p>
            <p className="flex items-center gap-2">
              <Check size={13} className="text-gold-500 shrink-0" strokeWidth={3} />
              Pause anytime — billing stops immediately
            </p>
            <p className="flex items-center gap-2">
              <Check size={13} className="text-gold-500 shrink-0" strokeWidth={3} />
              Bundle discounts for 3–5 agents {/* [UPDATE] add percentage once confirmed */}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={() => (isSelected ? removeAgent(agent.id) : addAgent(agent.id))}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded text-sm font-semibold transition-colors ${
              isSelected
                ? 'bg-navy-200 text-navy-700 hover:bg-navy-300'
                : 'bg-navy-900 text-white hover:bg-navy-800'
            }`}
          >
            {isSelected ? <><Check size={14} /> Added to Roster</> : <><Plus size={14} /> Add to Roster</>}
          </button>
          <Link
            to="/agents"
            className="flex items-center justify-center px-6 py-3 rounded text-sm font-semibold border border-navy-200 text-navy-700 hover:border-navy-400 transition-colors"
          >
            Browse all agents
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-1">
          <PricingNote variant="deposit" />
          <PricingNote variant="pause" />
        </div>
      </section>

      {/* ── Section 6: Audit note ────────────────────────────────────────── */}
      <section className="rounded-lg bg-navy-950 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-gray mb-2">
          First time here?
        </p>
        <h2 className="font-serif text-xl text-white mb-3">
          Haven't completed your ECS AI Full Assessment yet?
        </h2>
        <p className="text-sm text-navy-100 leading-relaxed mb-5">
          That's the first step. Your audit is where this agent gets configured to your team —
          communication profiles mapped, workflows defined, tone calibrated. You can reserve your
          spot now and complete the assessment before deployment.
        </p>
        <Link
          to="/assessment"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-gold-500 text-navy-950 text-sm font-semibold hover:bg-gold-400 transition-colors"
        >
          Book Your ECS Assessment
        </Link>
      </section>
    </div>
  );
}
