import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * On web, default to a light scheme until the client has resolved the actual preference.
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();

  return colorScheme ?? 'light';
}
