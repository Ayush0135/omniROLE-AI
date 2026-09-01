import React from 'react';
import {
  Atom,
  Cpu,
  BarChart3,
  Scale,
  Target,
  Bot,
  Code,
  Zap,
  Sparkles,
  Brain,
  ShieldCheck,
  Database,
  FileText,
  LucideProps,
} from 'lucide-react';

interface IconRendererProps extends LucideProps {
  name: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', ...props }) => {
  switch (name?.toLowerCase()) {
    case 'atom':
    case 'research':
      return <Atom className={className} {...props} />;
    case 'cpu':
    case 'code-architect':
      return <Cpu className={className} {...props} />;
    case 'barchart3':
    case 'barchart':
    case 'data':
      return <BarChart3 className={className} {...props} />;
    case 'scale':
    case 'legal':
      return <Scale className={className} {...props} />;
    case 'target':
    case 'marketing':
      return <Target className={className} {...props} />;
    case 'brain':
      return <Brain className={className} {...props} />;
    case 'sparkles':
      return <Sparkles className={className} {...props} />;
    case 'shieldcheck':
    case 'shield':
      return <ShieldCheck className={className} {...props} />;
    case 'database':
      return <Database className={className} {...props} />;
    case 'filetext':
      return <FileText className={className} {...props} />;
    default:
      return <Bot className={className} {...props} />;
  }
};
