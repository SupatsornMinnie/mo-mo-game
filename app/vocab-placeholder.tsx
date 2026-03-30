import React from 'react';
import { Image } from "expo-image";
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BackButton from "../components/BackButton";
import { playBubblePop } from '../utils/playBubblePop';

export default function VocabPlaceholderScreen() {
  const router = useRouter();
  const { word } = useLocalSearchParams<{ word: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.word}>{word ?? '?'}</Text>
      <Text style={styles.subtitle}>Coming Soon...</Text>
      <Text style={styles.desc}>เกมนี้กำลังจะมาเร็ว ๆ นี้ 🚀</Text>
      <BackButton onPress={() => { playBubblePop(); router.back(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  word: {
    fontSize: 56,
    fontWeight: '900',
    color: '#4A90D9',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#95A5A6',
  },
  desc: {
    fontSize: 16,
    color: '#BDC3C7',
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: '#4A90D9',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 3,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
