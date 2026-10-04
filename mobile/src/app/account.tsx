import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";

type AuthMode = "sign-in" | "create-account";

export default function AccountScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) setUserEmail(session?.user.email ?? null);
      } catch (cause) {
        if (mounted) {
          setErrorMessage(
            cause instanceof Error ? cause.message : "Unable to load your account."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserEmail(session?.user.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit() {
    setErrorMessage("");
    setNotice("");
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setErrorMessage("Enter your email address and password to continue.");
      return;
    }
    if (mode === "create-account" && password.length < 8) {
      setErrorMessage("Choose a password with at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in here.");
          setMode("sign-in");
          setPassword("");
        }
      }
    } catch (cause) {
      setErrorMessage(
        cause instanceof Error ? cause.message : "We could not complete that request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (cause) {
      setErrorMessage(
        cause instanceof Error ? cause.message : "Unable to sign out right now."
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#344b3b" />
        <Text style={styles.loadingText}>Preparing your account...</Text>
      </View>
    );
  }

  if (userEmail) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>YOUR PRIVATE CORNER</Text>
        <Text style={styles.title}>Welcome back.</Text>
        <Text style={styles.intro}>
          Your thoughtful finds and account details, all in one place.
        </Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userEmail.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.cardEyebrow}>SIGNED IN AS</Text>
          <Text style={styles.email}>{userEmail}</Text>
          <View style={styles.memberDivider} />
          <Text style={styles.memberNote}>
            Use this same account to shop on the Form & Field website.
          </Text>
        </View>

        {errorMessage ? <Text style={styles.errorBox}>{errorMessage}</Text> : null}
        <TouchableOpacity style={styles.primaryButton} onPress={handleSignOut}>
          <Text style={styles.primaryButtonText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authHero}>
          <Text style={styles.authBrand}>FORM & FIELD</Text>
          <Text style={styles.authBrandNote}>THOUGHTFUL LIVING, EVERY DAY</Text>
          <View style={styles.authRule} />
          <Text style={styles.eyebrowLight}>YOUR PRIVATE CORNER</Text>
          <Text style={styles.authTitle}>
            {mode === "sign-in" ? "Good to have\nyou back." : "Make yourself\nat home."}
          </Text>
          <Text style={styles.authIntro}>
            {mode === "sign-in"
              ? "Sign in with the account you use on our website."
              : "Create an account and keep your favourite things close."}
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === "sign-in" && styles.modeTabActive]}
              onPress={() => {
                setMode("sign-in");
                setErrorMessage("");
                setNotice("");
              }}
            >
              <Text style={[styles.modeText, mode === "sign-in" && styles.modeTextActive]}>
                SIGN IN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === "create-account" && styles.modeTabActive]}
              onPress={() => {
                setMode("create-account");
                setErrorMessage("");
                setNotice("");
              }}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === "create-account" && styles.modeTextActive,
                ]}
              >
                CREATE ACCOUNT
              </Text>
            </TouchableOpacity>
          </View>

          {notice ? <Text style={styles.noticeBox}>{notice}</Text> : null}
          {errorMessage ? <Text style={styles.errorBox}>{errorMessage}</Text> : null}

          <Text style={styles.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@example.com"
            placeholderTextColor="#aaa596"
            style={styles.input}
            editable={!submitting}
          />

          <View style={styles.passwordLabel}>
            <Text style={styles.label}>Password</Text>
            {mode === "create-account" ? (
              <Text style={styles.hint}>8 characters minimum</Text>
            ) : null}
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            textContentType={mode === "sign-in" ? "password" : "newPassword"}
            placeholder="Enter your password"
            placeholderTextColor="#aaa596"
            style={styles.input}
            editable={!submitting}
            returnKeyType="done"
            onSubmitEditing={() => void handleSubmit()}
          />

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fffdf8" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === "sign-in" ? "SIGN IN TO YOUR ACCOUNT" : "CREATE MY ACCOUNT"}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.secureNote}>Your account is protected by secure sign-in.</Text>
        </View>

        <Text style={styles.footerNote}>
          Good things are even better when they feel like yours.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f3ec",
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6f3ec",
  },
  loadingText: {
    marginTop: 12,
    color: "#73776d",
    fontSize: 12,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 34,
  },
  authHero: {
    minHeight: 246,
    padding: 23,
    justifyContent: "flex-end",
    backgroundColor: "#344b3b",
  },
  authBrand: {
    position: "absolute",
    left: 23,
    top: 23,
    color: "#fffdf8",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2.2,
  },
  authBrandNote: {
    position: "absolute",
    left: 23,
    top: 43,
    color: "rgba(255,253,248,0.64)",
    fontSize: 7,
    letterSpacing: 1.3,
  },
  authRule: {
    position: "absolute",
    left: 23,
    right: 23,
    top: 72,
    height: 1,
    backgroundColor: "rgba(255,253,248,0.18)",
  },
  eyebrowLight: {
    color: "#d8b59c",
    fontSize: 8,
    letterSpacing: 1.7,
  },
  authTitle: {
    marginTop: 9,
    color: "#fffdf8",
    fontSize: 34,
    lineHeight: 37,
    fontWeight: "500",
  },
  authIntro: {
    maxWidth: 260,
    marginTop: 9,
    color: "rgba(255,253,248,0.76)",
    fontSize: 11,
    lineHeight: 17,
  },
  eyebrow: {
    color: "#a76349",
    fontSize: 8,
    letterSpacing: 1.7,
  },
  title: {
    marginTop: 10,
    color: "#293a2e",
    fontSize: 36,
    fontWeight: "500",
  },
  intro: {
    marginTop: 10,
    color: "#74766d",
    fontSize: 13,
    lineHeight: 21,
  },
  formCard: {
    marginTop: 13,
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e6e1d7",
  },
  modeTabs: {
    marginHorizontal: -18,
    marginBottom: 15,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e3d9",
  },
  modeTab: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  modeTabActive: {
    borderBottomColor: "#a76349",
  },
  modeText: {
    color: "#979488",
    fontSize: 8,
    letterSpacing: 1,
  },
  modeTextActive: {
    color: "#344b3b",
    fontWeight: "700",
  },
  label: {
    marginTop: 13,
    marginBottom: 7,
    color: "#575c52",
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  passwordLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hint: {
    marginTop: 13,
    color: "#979488",
    fontSize: 9,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e0dbd0",
    backgroundColor: "#fbf9f3",
    paddingHorizontal: 12,
    color: "#293a2e",
    fontSize: 13,
  },
  primaryButton: {
    minHeight: 49,
    marginTop: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#344b3b",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#fffdf8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  secureNote: {
    marginTop: 12,
    color: "#929084",
    fontSize: 9,
    textAlign: "center",
  },
  noticeBox: {
    marginTop: 6,
    padding: 11,
    color: "#344b3b",
    backgroundColor: "#e8eee5",
    fontSize: 11,
    lineHeight: 17,
  },
  errorBox: {
    marginTop: 6,
    padding: 11,
    color: "#7f1d1d",
    backgroundColor: "#f9e9e5",
    fontSize: 11,
    lineHeight: 17,
  },
  footerNote: {
    marginTop: 18,
    color: "#89877b",
    fontSize: 10,
    textAlign: "center",
    fontStyle: "italic",
  },
  profileCard: {
    marginTop: 25,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e6e1d7",
  },
  avatar: {
    width: 68,
    height: 68,
    marginBottom: 16,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e9e1",
  },
  avatarText: {
    color: "#344b3b",
    fontSize: 27,
    fontWeight: "500",
  },
  cardEyebrow: {
    color: "#a76349",
    fontSize: 8,
    letterSpacing: 1.5,
  },
  email: {
    marginTop: 8,
    color: "#293a2e",
    fontSize: 15,
    fontWeight: "600",
  },
  memberDivider: {
    width: "100%",
    height: 1,
    marginVertical: 19,
    backgroundColor: "#e8e3d9",
  },
  memberNote: {
    color: "#77786e",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },
});
