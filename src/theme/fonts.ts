import { Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold } from '@expo-google-fonts/archivo';
import {
  BigShouldersDisplay_700Bold,
  BigShouldersDisplay_800ExtraBold,
  BigShouldersDisplay_900Black,
} from '@expo-google-fonts/big-shoulders-display';
import { MartianMono_400Regular, MartianMono_500Medium } from '@expo-google-fonts/martian-mono';

import { fonts } from './tokens';

/** Font map passed to `useFonts` in the root layout. */
export const fontAssets = {
  [fonts.display700]: BigShouldersDisplay_700Bold,
  [fonts.display800]: BigShouldersDisplay_800ExtraBold,
  [fonts.display900]: BigShouldersDisplay_900Black,
  [fonts.ui400]: Archivo_400Regular,
  [fonts.ui500]: Archivo_500Medium,
  [fonts.ui600]: Archivo_600SemiBold,
  [fonts.ui700]: Archivo_700Bold,
  [fonts.mono400]: MartianMono_400Regular,
  [fonts.mono500]: MartianMono_500Medium,
};
