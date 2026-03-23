import { StyleSheet } from 'react-native';

export const gameStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderWidth: 2,
    borderColor: '#4A90D9',
  },
  backText: {
    fontSize: 28,
    color: '#4A90D9',
    fontWeight: '700',
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
