import { router } from "expo-router";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const edits = [
  {
    category: "Home",
    subtitle: "For the corners you come back to.",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=85",
    number: "01",
  },
  {
    category: "Accessories",
    subtitle: "Everyday companions, chosen well.",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85",
    number: "02",
  },
  {
    category: "Lighting",
    subtitle: "A softer way to set the mood.",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85",
    number: "03",
  },
  {
    category: "Clothing",
    subtitle: "Easy layers for everyday living.",
    image:
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85",
    number: "04",
  },
];

export default function ExploreScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>A LITTLE INSPIRATION</Text>
        <Text style={styles.title}>Explore the edit.</Text>
        <Text style={styles.intro}>
          Useful things, chosen with care. Find something that feels like you.
        </Text>
      </View>

      <View style={styles.editList}>
        {edits.map((edit) => (
          <TouchableOpacity
            key={edit.category}
            accessibilityRole="button"
            accessibilityLabel={`Explore ${edit.category}`}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/shop",
                params: { category: edit.category },
              })
            }
          >
            <ImageBackground
              source={{ uri: edit.image }}
              style={styles.editCard}
              imageStyle={styles.editImage}
              resizeMode="cover"
            >
              <View style={styles.scrim} />
              <Text style={styles.editNumber}>{edit.number} / 04</Text>
              <View style={styles.editCopy}>
                <Text style={styles.editSubtitle}>{edit.subtitle}</Text>
                <View style={styles.editTitleRow}>
                  <Text style={styles.editTitle}>{edit.category}</Text>
                  <Text style={styles.editArrow}>↗</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.allButton}
        onPress={() => router.push("/shop")}
      >
        <Text style={styles.allButtonText}>SEE THE FULL COLLECTION</Text>
        <Text style={styles.allButtonArrow}>↗</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f3ec",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  eyebrow: {
    color: "#a76349",
    fontSize: 8,
    letterSpacing: 1.8,
  },
  title: {
    marginTop: 8,
    color: "#293a2e",
    fontSize: 30,
    fontWeight: "500",
  },
  intro: {
    maxWidth: 300,
    marginTop: 8,
    color: "#74766d",
    fontSize: 12,
    lineHeight: 19,
  },
  editList: {
    gap: 12,
  },
  editCard: {
    height: 184,
    justifyContent: "flex-end",
    overflow: "hidden",
    backgroundColor: "#77766d",
    borderRadius: 4,
  },
  editImage: {
    borderRadius: 4,
  },
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(25, 31, 26, 0.35)",
  },
  editNumber: {
    position: "absolute",
    top: 13,
    right: 14,
    color: "rgba(255,253,248,0.8)",
    fontSize: 8,
    letterSpacing: 1.4,
  },
  editCopy: {
    paddingHorizontal: 17,
    paddingBottom: 16,
  },
  editSubtitle: {
    color: "rgba(255,253,248,0.82)",
    fontSize: 10,
  },
  editTitleRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editTitle: {
    color: "#fffdf8",
    fontSize: 25,
    fontWeight: "500",
  },
  editArrow: {
    color: "#fffdf8",
    fontSize: 19,
  },
  allButton: {
    minHeight: 49,
    marginTop: 17,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#344b3b",
    borderRadius: 3,
  },
  allButtonText: {
    color: "#fffdf8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  allButtonArrow: {
    color: "#fffdf8",
    fontSize: 18,
  },
});
