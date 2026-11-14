import React from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, Boxes, TrendingUp } from "lucide-react-native";
import { palette, radius, layout } from "@shared/designSystem";
import { Text, VStack, HStack } from "@shared/ui";

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const HIGHLIGHTS = [
  { icon: Boxes, text: "Batch & location-level stock tracking" },
  { icon: ShieldCheck, text: "FEFO dispensing, never sell expired" },
  { icon: TrendingUp, text: "GST invoices, returns & live reports" },
];

const LOGO = require("../../../../assets/brand/wordmark.png");
const LOGO_LABEL = "Bombay Medical — Pharmacy + General Stores";

/**
 * Split auth layout — cream brand panel with the full logo on wide screens,
 * form on the right. The logo is designed for a light ground, so the panel is
 * the logo's own cream rather than a green fill.
 */
export function AuthLayout({ title, subtitle, children }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= layout.wideBreakpoint;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        backgroundColor: palette.surface.secondary,
      }}
    >
      {isWide && (
        <View style={styles.brandPanel}>
          <SafeAreaView
            style={{ flex: 1, justifyContent: "space-between", padding: 48 }}
          >
            <Image
              source={LOGO}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel={LOGO_LABEL}
            />

            <VStack gap={18}>
              <Text variant="display-sm" style={{ color: palette.teal[800] }}>
                Medical inventory,{"\n"}warehouse & sales — in one place.
              </Text>
              <VStack gap={14} style={{ marginTop: 12 }}>
                {HIGHLIGHTS.map((h) => (
                  <HStack key={h.text} gap={12} align="center">
                    <View style={styles.hIcon}>
                      <h.icon
                        size={18}
                        color={palette.teal[700]}
                        strokeWidth={2}
                      />
                    </View>
                    <Text variant="body" style={{ color: palette.teal[900] }}>
                      {h.text}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>

            <Text variant="caption" style={{ color: palette.teal[800] }}>
              Bombay Medical Pharmacy + General Stores · Chemist & Druggist
            </Text>
          </SafeAreaView>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.formScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formInner}>
                {!isWide && (
                  <Image
                    source={LOGO}
                    style={[styles.authWordmark, { marginBottom: 28 }]}
                    resizeMode="contain"
                    accessibilityLabel={LOGO_LABEL}
                  />
                )}
                <VStack gap={6} style={{ marginBottom: 24 }}>
                  <Text variant="h1" tone="primary">
                    {title}
                  </Text>
                  <Text variant="body" tone="tertiary">
                    {subtitle}
                  </Text>
                </VStack>
                {children}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandPanel: {
    flex: 1,
    maxWidth: 520,
    backgroundColor: palette.cream[100],
    borderRightWidth: 1,
    borderRightColor: palette.cream[200],
  },
  /** Full logo lockup, at its own 2.78:1 proportions. */
  brandLogo: {
    width: 300,
    height: 108,
  },
  /** Full logo above the form on narrow screens. */
  authWordmark: {
    width: 220,
    height: 79,
    alignSelf: "center",
  },
  hIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: palette.cream[50],
    borderWidth: 1,
    borderColor: palette.cream[200],
    alignItems: "center",
    justifyContent: "center",
  },
  formScroll: { flexGrow: 1, justifyContent: "center", padding: 28 },
  formInner: { width: "100%", maxWidth: 420, alignSelf: "center" },
});
