import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useVocabProgress } from '../hooks/useVocabProgress';
import { VOCAB_LIST, VocabItem } from '../utils/vocabConfig';

const NUM_COLUMNS = 3;

export default function MyBubbleScreen() {
  const { width: sw } = useWindowDimensions();
  const router = useRouter();
  const { isCompleted, totalCompleted, reload: reloadVocab } = useVocabProgress();

  // อ่าน progress ใหม่ทุกครั้งที่เข้าหน้านี้
  useFocusEffect(useCallback(() => { reloadVocab(); }, [reloadVocab]));

  const cardSize = (sw - 48) / NUM_COLUMNS;

  const handleCardPress = useCallback((item: VocabItem) => {
    // คลิกได้เสมอ — เพื่อเล่น หรือ เล่นซ้ำ
    router.push({
      pathname: item.route as any,
      params: { word: item.word, id: String(item.id) },
    });
  }, [router]);

  const renderCard = useCallback(({ item }: { item: VocabItem }) => {
    const done = isCompleted(item.id);
    return (
      <Pressable
        style={[styles.card, { width: cardSize, height: cardSize * 1.2 }]}
        onPress={() => handleCardPress(item)}
      >
        <View style={[styles.cardInner, done && styles.cardDone]}>
          {/* รูปการ์ด — แสดงเสมอ, ยังไม่ผ่านจะจางลง */}
          <Image
            source={item.card}
            style={{
              width: cardSize * 0.82,
              height: cardSize * 0.82,
              opacity: done ? 1 : 0.35,
            }}
            contentFit="contain"
          />

          {/* Badge ✓ เมื่อผ่านด่าน */}
          {done && (
            <View style={styles.doneBadge}>
              <Text style={styles.doneBadgeText}>✓</Text>
            </View>
          )}

          {/* ป้าย "เล่นเลย" เมื่อยังไม่ผ่าน */}
          {!done && (
            <View style={styles.playBadge}>
              <Text style={styles.playBadgeText}>เล่นเลย!</Text>
            </View>
          )}

          <Text style={[styles.wordText, !done && styles.wordDim]}>
            {item.word}
          </Text>
        </View>
      </Pressable>
    );
  }, [isCompleted, cardSize, handleCardPress]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.title}>🫧 My Bubble</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalCompleted} / {VOCAB_LIST.length}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${VOCAB_LIST.length > 0 ? (totalCompleted / VOCAB_LIST.length) * 100 : 0}%`
          }]} />
        </View>
        <Text style={styles.progressLabel}>
          {totalCompleted === 0
            ? 'เล่นเกมเพื่อสะสมคำศัพท์!'
            : `สะสมแล้ว ${totalCompleted} คำ 🎉`}
        </Text>

        {/* Grid — แสดงทุกคำ */}
        <FlatList
          data={VOCAB_LIST}
          keyExtractor={(item) => String(item.id)}
          numColumns={NUM_COLUMNS}
          renderItem={renderCard}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8F4FD',
  },
  container: {
    flex: 1,
    backgroundColor: '#E8F4FD',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4A90D9',
    elevation: 2,
  },
  backText: {
    fontSize: 20,
    color: '#4A90D9',
    fontWeight: '700',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: '#2C3E50',
  },
  countBadge: {
    backgroundColor: '#4A90D9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Progress
  progressBar: {
    marginHorizontal: 16,
    height: 10,
    backgroundColor: '#D0E8F5',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90D9',
    borderRadius: 5,
  },
  progressLabel: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    marginBottom: 12,
  },

  // Grid
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  card: {
    padding: 6,
  },
  cardInner: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    padding: 6,
  },
  // กรอบทองเมื่อผ่านด่านแล้ว
  cardDone: {
    borderWidth: 2.5,
    borderColor: '#FFD700',
    elevation: 5,
    shadowColor: '#FFD700',
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },

  // Badge ✓ มุมบนขวา
  doneBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },

  // Badge "เล่นเลย!" มุมล่าง
  playBadge: {
    position: 'absolute',
    bottom: 22,
    backgroundColor: '#4A90D9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  playBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  wordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C3E50',
    marginTop: 4,
    textAlign: 'center',
  },
  wordDim: {
    color: '#AAA',
  },
});
