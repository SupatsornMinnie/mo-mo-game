import { StyleSheet, Dimensions } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

export const homeStyles = StyleSheet.create({
  // พื้นหลังเต็มจอ
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },

  // กรอบตัวหนังสือ "MoMo Alphabet"
  titleArea: {
    position: 'absolute',
    top: SH * 0.06,
    width: '100%',
    alignItems: 'center',
    zIndex: 30,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ปุ่ม Play — กลางหน้าจอ
  playWrap: {
    position: 'absolute',
    top: SH * 0.35,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  playGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD700',
    top: -10,
  },
  playBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  playTriangleWrap: {
    marginLeft: 5,
    marginBottom: 2,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 24,
    borderTopWidth: 16,
    borderBottomWidth: 16,
    borderLeftColor: '#FFF',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  playText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 2,
  },
});

export { SW, SH };
