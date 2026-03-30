import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { VOCAB_LIST } from '../../utils/vocabConfig';
import AppleGame from '../../components/game/templates/AppleGame';
import AntGame from '../../components/game/templates/AntGame';

export default function GameById() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vocab = VOCAB_LIST.find(v => v.id === Number(id));

  if (!vocab) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>ไม่พบคำศัพท์ id={id}</Text>
      </View>
    );
  }

  if (vocab.gameType === 'apple') return <AppleGame vocab={vocab} />;
  if (vocab.gameType === 'ant') return <AntGame vocab={vocab} />;

  // TODO: เพิ่ม gameType อื่นๆ ตรงนี้

  return (
    <View style={styles.center}>
      <Text style={styles.text}>Coming soon: {vocab.word}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#87CEEB' },
  text:   { fontSize: 18, color: '#fff' },
});
