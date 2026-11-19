// Profile color and picture, each behind a row that opens on tap (one at a
// time), so the screen stays calm until the user wants to change something.
// - Color: ten quick picks, then "Any color": a hue strip to tap or drag along
//   and five tones of that hue. Every tone keeps the dark letter readable.
// - Picture: the letter, illustrated avatars, then sport icons.
// Used when a profile is created and on the Profile screen.

import { useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View, type GestureResponderEvent, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PROFILE_AVATARS, PROFILE_ICONS, ProfileGlyph } from '@/components/ProfileIcon';
import { Display, UI } from '@/components/Txt';
import { Avatar, PrimaryButton, Ring } from '@/components/ui';
import { t } from '@/i18n';
import { hsl, hueOf, toneColors } from '@/theme/profileColor';
import { PROFILE_COLORS, colors } from '@/theme/tokens';

const DOT = 44;
const SMALL = 32;
const STRIP = 36;
const HUES = Array.from({ length: 72 }, (_, i) => i * 5);

type Section = 'color' | 'picture' | null;

export function AvatarPicker({
  color,
  icon,
  initial,
  onColor,
  onIcon,
  preview = true,
}: {
  color: string;
  icon: string | null;
  initial: string;
  onColor: (c: string) => void;
  onIcon: (i: string | null) => void;
  /** Show the big preview circle (onboarding); Profile already shows the picture at the top. */
  preview?: boolean;
}) {
  const [open, setOpen] = useState<Section>(null);
  /** Color while dragging along the strip; saved when the finger lifts. */
  const [draft, setDraft] = useState<string | null>(null);
  const [hue, setHue] = useState(() => hueOf(color));
  const [stripW, setStripW] = useState(0);
  /** Choices in the open card; saved only with Done. */
  const [pick, setPick] = useState<{ color: string; icon: string | null }>({ color, icon });
  const shown = draft ?? pick.color;
  const show = (s: Section) => {
    setPick({ color, icon });
    setHue(hueOf(color));
    setOpen(s);
  };
  const setColor = (c: string) => setPick((p) => ({ ...p, color: c }));
  const setIcon = (i: string | null) => setPick((p) => ({ ...p, icon: i }));
  const done = () => {
    if (pick.color !== color) onColor(pick.color);
    if (pick.icon !== icon) onIcon(pick.icon);
    setOpen(null);
  };
  const tones = toneColors(hue);
  
  const hueAt = (e: GestureResponderEvent) => (stripW ? Math.max(0, Math.min(359, (e.nativeEvent.locationX / stripW) * 360)) : hue);
  const slide = (e: GestureResponderEvent) => {
    const h = hueAt(e);
    setHue(h);
    setDraft(toneColors(h)[1]);
  };
  const release = (e: GestureResponderEvent) => {
    const h = hueAt(e);
    setHue(h);
    setDraft(null);
    setColor(toneColors(h)[1]);
  };

  return (
    <View>
      {preview && (
        <View style={styles.previewRow}>
          <Avatar size={84} color={color} initial={initial} fontSize={46} icon={icon}>
            <Ring width={9} color="rgba(0,0,0,0.16)" radius={42} />
          </Avatar>
          <UI size={16} lh={1.4} color={colors.muted} style={{ flex: 1 }}>
            {t('Pick an icon, or add your own photo later on your profile.')}
          </UI>
        </View>
      )}

      <Header label={t('Profile color')} onPress={() => show('color')} first={!preview}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
      </Header>
      <Header label={t('Profile picture')} onPress={() => show('picture')}>
        <View style={[styles.swatch, styles.clipSmall, { backgroundColor: color }]}>
          {icon ? (
            <ProfileGlyph icon={icon} circle={SMALL} />
          ) : (
            <Display size={16} weight={900} color={colors.onPlate}>
              {initial}
            </Display>
          )}
        </View>
      </Header>

      <Sheet
        visible={open !== null}
        title={open === 'picture' ? t('Profile picture') : t('Profile color')}
        onClose={() => setOpen(null)}
        onDone={done}
        top={
          <Avatar size={72} color={shown} initial={initial} fontSize={40} icon={pick.icon}>
            <Ring width={7} color="rgba(0,0,0,0.16)" radius={36} />
          </Avatar>
        }>
        {open === 'color' ? (
          <>
          <View style={styles.wrap}>
            {PROFILE_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  setHue(hueOf(c));
                  setColor(c);
                }}
                accessibilityRole="button"
                accessibilityLabel={c}
                accessibilityState={{ selected: c === pick.color }}
                style={[styles.dot, { backgroundColor: c }]}>
                {c === shown && <Ring width={2} color={colors.ink} radius={DOT / 2} offset={4} />}
              </Pressable>
            ))}
          </View>

          <UI size={16} weight={600} style={{ marginTop: 24 }}>
            {t('Any color')}
          </UI>
          <UI size={14} lh={1.4} color={colors.muted} style={{ marginTop: 4 }}>
            {t('Tap or slide along the strip, then pick a tone.')}
          </UI>
          <View
            onLayout={(e) => setStripW(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={slide}
            onResponderMove={slide}
            onResponderRelease={release}
            accessibilityRole="adjustable"
            accessibilityLabel={t('Any color')}
            style={styles.strip}>
            <View pointerEvents="none" style={styles.stripFill}>
              {HUES.map((h) => (
                <View key={h} style={{ flex: 1, backgroundColor: hsl(h, 0.85, 0.6) }} />
              ))}
            </View>
            {stripW > 0 && (
              <View pointerEvents="none" style={[styles.knob, { left: (hue / 360) * stripW - STRIP / 2, backgroundColor: tones[1] }]} />
            )}
          </View>
          <View style={[styles.wrap, { marginTop: 16 }]}>
            {tones.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityRole="button"
                accessibilityLabel={c}
                accessibilityState={{ selected: c === pick.color }}
                style={[styles.dot, { backgroundColor: c }]}>
                {c === shown && <Ring width={2} color={colors.ink} radius={DOT / 2} offset={4} />}
              </Pressable>
            ))}
          </View>
          </>
        ) : (
          <>
          <Choices keys={[null, ...Object.keys(PROFILE_AVATARS)]} label={t('Avatars')} color={shown} icon={pick.icon} initial={initial} onIcon={setIcon} />
          <Choices keys={Object.keys(PROFILE_ICONS)} label={t('Icons')} color={shown} icon={pick.icon} initial={initial} onIcon={setIcon} />
          </>
        )}
      </Sheet>
    </View>
  );
}

/** Web only: blur what is behind the card (CSS backdrop-filter). */
const BLUR = (Platform.OS === 'web' ? { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } : {}) as ViewStyle;

/**
 * A card over the screen: the screen behind is dimmed and blurred, the card
 * shows a live preview, the choices, and Done. Only Done saves; the close
 * button and tapping outside leave the profile as it was.
 */
function Sheet({ visible, title, top, onClose, onDone, children }: { visible: boolean; title: string; top: ReactNode; onClose: () => void; onDone: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, BLUR]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('Close')} />
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.cardHead}>
            {top}
            <Display size={32} weight={900} style={{ flex: 1 }}>
              {title}
            </Display>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('Close')} style={styles.close}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path d="M6 6l12 12M18 6 6 18" stroke={colors.ink} strokeWidth={2.2} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 24 }}>
            {children}
          </ScrollView>
          <PrimaryButton label={t('Done')} onPress={onDone} />
        </View>
      </View>
    </Modal>
  );
}

/** A full-width row: label on the left, the current choice and a chevron on the right. */
function Header({ label, onPress, first, children }: { label: string; onPress: () => void; first?: boolean; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.header, !first && styles.divider]}>
      <UI size={16} weight={600} style={{ flex: 1 }}>
        {label}
      </UI>
      {children}
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M9 6l6 6-6 6" fill="none" stroke={colors.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

function Choices({
  keys,
  label,
  color,
  icon,
  initial,
  onIcon,
}: {
  keys: (string | null)[];
  label: string;
  color: string;
  icon: string | null;
  initial: string;
  onIcon: (i: string | null) => void;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <UI size={14} color={colors.muted} style={{ marginTop: 8 }}>
        {label}
      </UI>
      <View style={styles.wrap}>
        {keys.map((k) => {
          const on = k === icon;
          return (
            <Pressable
              key={k ?? 'letter'}
              onPress={() => onIcon(k)}
              accessibilityRole="button"
              accessibilityLabel={k ?? t('Letter')}
              accessibilityState={{ selected: on }}
              style={[styles.dot, { backgroundColor: color }]}>
              {k ? (
                <View style={styles.clip}>
                  <ProfileGlyph icon={k} circle={DOT} />
                </View>
              ) : (
                <Display size={24} weight={900} color={colors.onPlate}>
                  {initial}
                </Display>
              )}
              {on && <Ring width={2} color={colors.ink} radius={DOT / 2} offset={4} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 32, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 64 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  backdrop: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: 'rgba(10,12,16,0.4)' },
  card: { backgroundColor: colors.bg, borderRadius: 32, padding: 24, maxHeight: '88%', width: '100%', maxWidth: 480, alignSelf: 'center' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16, paddingHorizontal: 4 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: SMALL, height: SMALL, borderRadius: SMALL / 2 },
  clipSmall: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  /** Avatars fill the circle; the selection ring sits outside it. */
  clip: { width: DOT, height: DOT, borderRadius: DOT / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  strip: { height: STRIP, marginTop: 16, justifyContent: 'center' },
  stripFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', borderRadius: STRIP / 2, overflow: 'hidden' },
  knob: { position: 'absolute', width: STRIP, height: STRIP, borderRadius: STRIP / 2, borderWidth: 3, borderColor: '#FFFFFF' },
});
