import { useLocalSearchParams } from 'expo-router';

import { Library } from '@/screens/Library';

/** "Add exercise" from the routine editor: pick a muscle group first. */
export default function PickExercise() {
  const { rid } = useLocalSearchParams<{ rid: string }>();
  return <Library pickFor={rid} />;
}
