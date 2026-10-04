import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>FORM & FIELD</Text>

        <Text style={styles.eyebrow}>
          OBJECTS FOR EVERYDAY RITUALS
        </Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>
          THE SLOWER COLLECTION / NO. 04
        </Text>

        <Text style={styles.title}>
          Make room for{" "}
          <Text style={styles.titleAccent}>the everyday.</Text>
        </Text>

        <Text style={styles.body}>
          Useful things, made with care. A small collection for living
          well with less, and keeping what matters close.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/shop")}
        >
          <Text style={styles.buttonText}>SHOP THE COLLECTION</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>
          OBJECTS WITH INTENTION
        </Text>

        <Text style={styles.sectionTitle}>
          The considered edit
        </Text>

        <Text style={styles.body}>
          Good design does not ask for attention. It earns a place
          in your day, then stays.
        </Text>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => router.push("/shop")}
        >
          <Text style={styles.outlineButtonText}>VIEW PRODUCTS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f7f2",
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#dddcd6",
  },
  brand: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#111827",
  },
  eyebrow: {
    marginTop: 6,
    fontSize: 9,
    letterSpacing: 1.5,
    color: "#6b7280",
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 54,
  },
  heroEyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: "#8b5e3c",
    textTransform: "uppercase",
  },
  title: {
    marginTop: 14,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "600",
    color: "#111827",
  },
  titleAccent: {
    fontStyle: "italic",
  },
  body: {
    marginTop: 18,
    fontSize: 15,
    lineHeight: 24,
    color: "#6b7280",
  },
  button: {
    marginTop: 28,
    height: 52,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
  },
  section: {
    marginHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: "#dddcd6",
  },
  sectionEyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: "#8b5e3c",
  },
  sectionTitle: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "600",
    color: "#111827",
  },
  outlineButton: {
    marginTop: 24,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#111827",
  },
  outlineButtonText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: "#111827",
  },
});