import { useScreenAwake } from '@/hooks/useScreenAwake';
import { phaseOf } from '@/domain/mobilitySession';
import { CardioLog } from '@/screens/CardioLog';
import { MobilityLog } from '@/screens/MobilityLog';
import { StrengthLog } from '@/screens/StrengthLog';
import { useActive } from '@/state/store';

/** The live workout: warm-up, then strength or cardio, then stretching. The screen stays on meanwhile. */
export default function LogScreen() {
  const { session } = useActive();
  useScreenAwake();
  if (!session) return null;
  const phase = phaseOf(session);
  if (phase !== 'main') return <MobilityLog session={session} phase={phase} />;
  return session.type === 'cardio' ? <CardioLog session={session} /> : <StrengthLog session={session} />;
}
