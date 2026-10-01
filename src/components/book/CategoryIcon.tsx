import React from 'react';
import {
  BookOpen,
  BookMarked,
  Landmark,
  GraduationCap,
  Sparkles,
  Feather,
  Heart,
  Baby,
  FlaskConical,
  Compass,
  History,
  User,
  Coffee,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface CategoryIconProps {
  iconName?: string;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'book-open': BookOpen,
  book: BookOpen,
  islamic: Landmark,
  landmark: Landmark,
  novel: BookMarked,
  story: Coffee,
  poetry: Feather,
  feather: Feather,
  essay: FileText,
  history: History,
  education: GraduationCap,
  biography: User,
  user: User,
  child: Baby,
  baby: Baby,
  'self-dev': Sparkles,
  sparkles: Sparkles,
  science: FlaskConical,
  compass: Compass,
  heart: Heart,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = 'w-4 h-4' }) => {
  const IconComponent = (iconName && iconMap[iconName.toLowerCase()]) || BookOpen;
  return <IconComponent className={className} />;
};
