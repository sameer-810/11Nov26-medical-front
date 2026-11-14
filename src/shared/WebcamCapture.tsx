import React, { useEffect, useRef, useState } from "react";
import { View, Modal, Pressable, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import { palette, radius } from "@shared/designSystem";
import { Text, Button, HStack } from "@shared/ui";

/**
 * Takes one still photo from the computer's webcam (web only).
 *
 * A desktop browser ignores the "open the camera" hint on a file input and
 * shows a file picker instead, so "Take photo" on a counter PC never reached
 * the camera. Phones are left on the native camera app (sharper bill photos).
 */
export const canUseWebcam = () =>
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof window !== "undefined" &&
  !window.matchMedia?.("(pointer: coarse)").matches;

interface Props {
  visible: boolean;
  onCapture: (dataUrl: string, width: number, height: number) => void;
  onClose: () => void;
  /** Offered when the camera can't start: pick a file instead. */
  onUseFile?: () => void;
}

export function WebcamCapture({
  visible,
  onCapture,
  onClose,
  onUseFile,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      await Promise.resolve(); // not a synchronous setState inside the effect
      if (cancelled) return;
      setReady(false);
      setError("");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // Ask for a large frame: the AI reads small print off this photo.
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        const name = (e as { name?: string })?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access in the browser and try again."
            : name === "NotFoundError"
              ? "No camera was found on this computer."
              : "Couldn't start the camera. Close any other app using it and try again.",
        );
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [visible]);

  if (!visible) return null;

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    onCapture(
      canvas.toDataURL("image/jpeg", 0.92),
      v.videoWidth,
      v.videoHeight,
    );
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text variant="label-lg" tone="primary">
              Take a photo of the bill
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityLabel="Close camera"
            >
              <X size={20} color={palette.text.tertiary} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={styles.viewport}>
            {error ? (
              <Text variant="body-sm" tone="danger" style={styles.msg}>
                {error}
              </Text>
            ) : (
              React.createElement("video", {
                ref: videoRef,
                autoPlay: true,
                muted: true,
                playsInline: true,
                style: { width: "100%", height: "100%", objectFit: "contain" },
              })
            )}
          </View>
          <Text variant="caption" tone="tertiary" style={{ marginTop: 8 }}>
            Hold the bill flat and fill the frame, in good light.
          </Text>
          <HStack gap={10} style={{ marginTop: 12 }} wrap>
            {error ? (
              onUseFile ? (
                <Button
                  label="Choose a file instead"
                  fullWidth={false}
                  onPress={onUseFile}
                />
              ) : null
            ) : (
              <Button
                label="Capture"
                fullWidth={false}
                disabled={!ready}
                onPress={capture}
              />
            )}
            <Button
              label="Cancel"
              variant="secondary"
              fullWidth={false}
              onPress={onClose}
            />
          </HStack>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: palette.surface.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border.default,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  viewport: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: radius.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  msg: { textAlign: "center", padding: 16 },
});
