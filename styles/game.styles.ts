import { StyleSheet } from 'react-native';

export const gameStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordText: {
    color: '#2C3E50',
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  levelText: {
    color: '#95A5A6',
    fontSize: 18,
    marginTop: 12,
    fontWeight: '600',
  },
});
