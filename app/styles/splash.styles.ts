import { StyleSheet, Dimensions } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

export const splashStyles = StyleSheet.create({
  // พื้นหลังเต็มจอ
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },

  // กรอบตัวหนังสือ "MoMo Alphabet" — บนสุด กลางหน้าจอ
  titleArea: {
    position: 'absolute',
    top: SH * 0.10,    // ระยะห่างจากขอบบน (เพิ่ม = ลงมา, ลด = ขึ้นไป)
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});

export { SW, SH };
