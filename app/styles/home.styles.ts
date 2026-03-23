import { StyleSheet, Dimensions } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  // My Bubble ไอคอนมุมขวาบน
  myBubbleBtn: {
    position: 'absolute',
    top: SH * 0.03,
    right: SW * 0.03,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  myBubbleText: {
    color: '#4A90D9',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  myBubbleCount: {
    color: '#FF6B9D',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 6,
  },
});

export { SW, SH };
