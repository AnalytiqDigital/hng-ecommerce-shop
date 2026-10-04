import { router } from "expo-router";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const featuredImage =
  "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1200&q=88";

const categories = [
  { title: "Home", note: "Little details, lasting impact", mark: "01" },
  { title: "Accessories", note: "Made to move with you", mark: "02" },
  { title: "Lighting", note: "A softer kind of glow", mark: "03" },
];

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brand}>FORM & FIELD</Text>
          <Text style={styles.brandNote}>THOUGHTFUL LIVING, EVERY DAY</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open your account"
          style={styles.accountButton}
          onPress={() => router.push("/account")}
        >
          <Text style={styles.accountInitial}>F</Text>
        </TouchableOpacity>
      </View>

      <ImageBackground
        source={{ uri: featuredImage }}
        style={styles.hero}
        imageStyle={styles.heroImage}
        resizeMode="cover"
      >
        <View style={styles.heroShade} />
        <View style={styles.heroContent}>
          <View style={styles.editionTag}>
            <Text style={styles.editionText}>THE SLOWER COLLECTION · NO. 04</Text>
          </View>
          <Text style={styles.heroTitle}>
            Make room for{"\n"}
            <Text style={styles.heroAccent}>the everyday.</Text>
          </Text>
          <Text style={styles.heroBody}>
            Useful things, made with care. A small collection for living well
            with less.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.heroButton}
            onPress={() => router.push("/shop")}
          >
            <Text style={styles.heroButtonText}>EXPLORE THE COLLECTION</Text>
            <Text style={styles.heroArrow}>↗</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroIndex}>01 — 03</Text>
      </ImageBackground>

      <View style={styles.promiseRow}>
        <View style={styles.promiseItem}>
          <Text style={styles.promiseMark}>✳</Text>
          <Text style={styles.promiseText}>A considered edit</Text>
        </View>
        <View style={styles.promiseDivider} />
        <View style={styles.promiseItem}>
          <Text style={styles.promiseMark}>↗</Text>
          <Text style={styles.promiseText}>Made for everyday</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>OBJECTS WITH INTENTION</Text>
          <Text style={styles.sectionTitle}>Find your feeling.</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/shop")}>
          <Text style={styles.viewAll}>VIEW ALL ↗</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryList}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.title}
            style={styles.categoryCard}
            onPress={() => router.push("/shop")}
          >
            <Text style={styles.categoryMark}>{category.mark}</Text>
            <View style={styles.categoryCopy}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryNote}>{category.note}</Text>
            </View>
            <Text style={styles.categoryArrow}>↗</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.closingNote}>
        <Text style={styles.closingQuote}>“</Text>
        <Text style={styles.closingText}>
          Good design earns a place in your day, then stays.
        </Text>
        <Text style={styles.closingByline}>A NOTE FROM FORM & FIELD</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f3ec",
  },
  container: {
    paddingBottom: 36,
  },
  topBar: {
    minHeight: 76,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    color: "#26372c",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2.4,
  },
  brandNote: {
    marginTop: 5,
    color: "#858377",
    fontSize: 8,
    letterSpacing: 1.5,
  },
  accountButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: "#d9d5cb",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffcf5",
  },
  accountInitial: {
    color: "#344b3b",
    fontSize: 14,
    fontWeight: "600",
  },
  hero: {
    minHeight: 450,
    marginHorizontal: 14,
    justifyContent: "flex-end",
    overflow: "hidden",
    backgroundColor: "#7d7667",
    borderRadius: 5,
  },
  heroImage: {
    borderRadius: 5,
  },
  heroShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(29, 34, 28, 0.43)",
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingBottom: 35,
    paddingTop: 60,
  },
  editionTag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  editionText: {
    color: "#fffdf8",
    fontSize: 8,
    letterSpacing: 1.5,
  },
  heroTitle: {
    marginTop: 21,
    color: "#fffdf8",
    fontSize: 39,
    lineHeight: 43,
    fontWeight: "500",
  },
  heroAccent: {
    fontStyle: "italic",
    fontWeight: "400",
  },
  heroBody: {
    maxWidth: 300,
    marginTop: 13,
    color: "rgba(255,253,248,0.86)",
    fontSize: 13,
    lineHeight: 20,
  },
  heroButton: {
    minHeight: 48,
    marginTop: 23,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f6f3ec",
  },
  heroButtonText: {
    color: "#26372c",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  heroArrow: {
    color: "#26372c",
    fontSize: 18,
  },
  heroIndex: {
    position: "absolute",
    top: 20,
    right: 20,
    color: "rgba(255,255,255,0.82)",
    fontSize: 9,
    letterSpacing: 1.7,
  },
  promiseRow: {
    marginTop: 15,
    marginHorizontal: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#ece9df",
  },
  promiseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  promiseMark: {
    color: "#a76349",
    fontSize: 13,
  },
  promiseText: {
    color: "#52584e",
    fontSize: 9,
    letterSpacing: 0.3,
  },
  promiseDivider: {
    height: 20,
    width: 1,
    backgroundColor: "#d5d1c6",
  },
  sectionHeader: {
    marginTop: 34,
    marginHorizontal: 22,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionEyebrow: {
    color: "#a76349",
    fontSize: 8,
    letterSpacing: 1.7,
  },
  sectionTitle: {
    marginTop: 7,
    color: "#293a2e",
    fontSize: 25,
    fontWeight: "500",
  },
  viewAll: {
    paddingBottom: 4,
    color: "#526153",
    fontSize: 8,
    letterSpacing: 1.1,
  },
  categoryList: {
    marginTop: 15,
    marginHorizontal: 14,
    gap: 9,
  },
  categoryCard: {
    minHeight: 76,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e6e1d7",
  },
  categoryMark: {
    width: 38,
    color: "#b5aa95",
    fontSize: 10,
    letterSpacing: 1,
  },
  categoryCopy: {
    flex: 1,
  },
  categoryTitle: {
    color: "#293a2e",
    fontSize: 15,
    fontWeight: "600",
  },
  categoryNote: {
    marginTop: 4,
    color: "#838477",
    fontSize: 10,
  },
  categoryArrow: {
    color: "#a76349",
    fontSize: 18,
  },
  closingNote: {
    marginTop: 30,
    marginHorizontal: 14,
    paddingHorizontal: 22,
    paddingVertical: 23,
    alignItems: "center",
    backgroundColor: "#e7e9df",
  },
  closingQuote: {
    height: 26,
    color: "#a76349",
    fontSize: 37,
    lineHeight: 40,
  },
  closingText: {
    maxWidth: 250,
    color: "#344538",
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
  closingByline: {
    marginTop: 12,
    color: "#7f8377",
    fontSize: 8,
    letterSpacing: 1.4,
  },
});
