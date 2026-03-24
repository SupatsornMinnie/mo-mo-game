import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { GAME_IMAGES } from '../../utils/gameConfig';

interface HeartDisplayProps {
  hearts: number;
  maxHearts: number;
}

export default function HeartDisplay({ hearts, maxHearts }: HeartDisplayProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxHearts }).map((_, i) => (
        <Image
          key={i}
          source={GAME_IMAGES.heart}
          style={[styles.heart, i >= hearts && styles.heartEmpty]}
          contentFit="contain"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 6,
  },
  heart: {
    width: 20,
    height: 20,
  },
  heartEmpty: {
    opacity: 0.25,
  },
});
