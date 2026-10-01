import React from 'react';
import { Writer } from './Writer';

interface WritingCenterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const WritingCenter: React.FC<WritingCenterProps> = ({ onNavigate }) => {
  return <Writer onNavigate={onNavigate} />;
};
