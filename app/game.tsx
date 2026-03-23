import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { gameStyles } from './styles/game.styles';

export default function GameScreen() {
  const router = useRouter();
  const { word, id } = useLocalSearchParams<{ word: string; id: string }>();
  const { width: sw, height: sh } = useWindowDimensions();

  return (
    <View style={gameStyles.container}>
      {/* ปุ่ม Back */}
      <Pressable
        style={gameStyles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={gameStyles.backText}>{'←'}</Text>
      </Pressable>

      {/* คำศัพท์ */}
      <Text style={[gameStyles.wordText, { fontSize: Math.min(sw * 0.12, 80) }]}>
        {word || 'Word'}
      </Text>

      <Text style={gameStyles.levelText}>Level {id}</Text>
    </View>
  );
}
