import { Phone, Calendar, MessageCircle, FileText, File, Share2, type LucideProps } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  callguard:   Phone,
  bookit:      Calendar,
  supportdesk: MessageCircle,
  invoiceiq:   FileText,
  docupro:     File,
  socialpulse: Share2,
};

interface Props extends LucideProps {
  agentId: string;
}

export default function AgentIcon({ agentId, ...props }: Props) {
  const Icon = ICON_MAP[agentId];
  if (!Icon) return null;
  return <Icon {...props} />;
}
