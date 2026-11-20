import { View } from 'react-native';

import { espacios } from '@/theme';

// Separador vertical estándar entre ítems de un FlatList.
export function Separador() {
  return <View style={{ height: espacios.md }} />;
}

export function SeparadorGrande() {
  return <View style={{ height: espacios.lg }} />;
}
