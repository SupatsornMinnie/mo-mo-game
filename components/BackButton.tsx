import { Image } from "expo-image";
import { Pressable, StyleSheet, ViewStyle } from "react-native";

type Props = {
  onPress: () => void;
  style?: ViewStyle;
};

export default function BackButton({ onPress, style }: Props) {
  return (
    <Pressable style={[styles.btn, style]} onPress={onPress}>
      <Image
        source={require("../assets/images/btn_back.webp")}
        style={{ width: 60, height: 60 }}
        contentFit="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    top: 10,
    left: 15,
    zIndex: 100,
  },
});
