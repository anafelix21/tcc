import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export type IconFamily = 'ionicons' | 'material';

export interface IconoProps {
  name: string;
  family?: IconFamily;
  size?: number;
  color?: string;
}

export function Icono({ name, family = 'ionicons', size = 22, color = '#2E7D32' }: IconoProps) {
  if (family === 'material') {
    return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
  }
  return <Ionicons name={name as any} size={size} color={color} />;
}
