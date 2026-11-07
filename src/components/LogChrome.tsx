// Parts shared by the strength and cardio log screens.

import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Photo } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { BackPill } from '@/components/ui';
import { exPhoto } from '@/data/photos';
import { colors } from '@/theme/tokens';

/** Back · elapsed timer · Finish. */
export function LogTopBar({ elapsed, onFinish }: { elapsed: string; onFinish: () => void }) {
  return (
    <View style={styles.topBar}>
      <BackPill onPress={() => router.back()} />
      <Mono size={17} weight={500}>
        {elapsed}
      </Mono>
      <Pressable onPress={onFinish} accessibilityRole="button" style={styles.finish}>
        <UI size={15} weight={700} color={colors.bg}>
          Finish
        </UI>
      </Pressable>
    </View>
  );
}

/** ‹ thumbnail "Exercise n of N" NAME › */
export function ExerciseSwitcher({
  exId,
  position,
  name,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  exId: string;
  position: string;
  name: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.switcher}>
      <Pressable onPress={onPrev} accessibilityRole="button" accessibilityLabel="Previous" style={styles.arrow}>
        <UI size={22} color={canPrev ? colors.ink : colors.muted}>
          ‹
        </UI>
      </Pressable>
      <Pressable onPress={() => router.push(`/exercise/${exId}`)} accessibilityRole="button" style={styles.current}>
        <Photo source={exPhoto(exId)} style={styles.thumb} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <UI size={13} color={colors.muted}>
            {position}
          </UI>
          <Display size={25} weight={800} lh={1.02} numberOfLines={1} style={{ marginTop: 2 }}>
            {name}
          </Display>
        </View>
      </Pressable>
      <Pressable onPress={onNext} accessibilityRole="button" accessibilityLabel="Next" style={styles.arrow}>
        <UI size={22} color={canNext ? colors.ink : colors.muted}>
          ›
        </UI>
      </Pressable>
    </View>
  );
}

/** One 4 pt segment per exercise: ink when done, accent for the current one. */
export function ProgressSegments({ states }: { states: ('done' | 'current' | 'todo')[] }) {
  return (
    <View style={styles.segs}>
      {states.map((st, i) => (
        <View
          key={i}
          style={[styles.seg, { backgroundColor: st === 'done' ? colors.ink : st === 'current' ? colors.accent : colors.surface2 }]}
        />
      ))}
    </View>
  );
}

/** "End workout" → "Tap again to end" (red), resets after 3 s. */
export function EndWorkoutButton({ confirming, onPress }: { confirming: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.textBtn}>
      <UI size={14} color={confirming ? colors.red : colors.muted}>
        {confirming ? 'Tap again to end' : 'End workout'}
      </UI>
    </Pressable>
  );
}

/** − value + row used in the bottom sheet (74 pt circles). `reverse` mirrors it for left-handed use. */
export const sheetRow = (reverse: boolean) => [styles.sheetRow, { flexDirection: reverse ? ('row-reverse' as const) : ('row' as const) }];

export const logStyles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    gap: 10,
  },
  prevText: { paddingTop: 10, paddingHorizontal: 16 },
  textBtn: { height: 44, paddingHorizontal: 4, justifyContent: 'center' },
});

const styles = StyleSheet.create({
  topBar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  finish: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.ink, justifyContent: 'center' },
  switcher: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, paddingHorizontal: 16 },
  arrow: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  current: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  segs: { flexDirection: 'row', gap: 4, paddingTop: 12, paddingHorizontal: 16 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  textBtn: { height: 44, paddingHorizontal: 4, justifyContent: 'center' },
  sheetRow: { height: 74, alignItems: 'center', gap: 8 },
});
