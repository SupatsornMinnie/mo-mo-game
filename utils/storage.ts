import AsyncStorage from '@react-native-async-storage/async-storage';

const HINT_KEY = 'momo_hint_data';

export interface HintData {
  count: number;   // จำนวนที่ใช้ไปแล้ววันนี้
  date: string;    // วันที่ล่าสุดที่ใช้ เช่น "Tue Mar 24 2026"
}

export async function saveHintData(data: HintData): Promise<void> {
  try {
    await AsyncStorage.setItem(HINT_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('saveHintData error:', e);
  }
}

export async function loadHintData(): Promise<HintData> {
  try {
    const raw = await AsyncStorage.getItem(HINT_KEY);
    if (raw) return JSON.parse(raw) as HintData;
  } catch (e) {
    console.warn('loadHintData error:', e);
  }
  return { count: 0, date: '' };
}
