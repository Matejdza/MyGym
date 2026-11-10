import { useScreenAwake } from '@/hooks/useScreenAwake';
import { CardioLog } from '@/screens/CardioLog';
import { StrengthLog } from '@/screens/StrengthLog';
import { useActive } from '@/state/store';

/** The live workout: strength or cardio, depending on the routine. The screen stays on meanwhile. */
export default function LogScreen() {
  const { session } = useActive();
  useScreenAwake();
  if (!session) return null;
  return session.type === 'cardio' ? <CardioLog session={session} /> : <StrengthLog session={session} />;
}
