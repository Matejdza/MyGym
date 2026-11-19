// Exercises added from the owner's list of 103 (2026-11-19). Written by hand;
// the first 34 exercises (catalog.ts) cover the rest of that list. Photos come
// later: until then the app shows a small body figure with the muscles worked.
// Serbian texts are in src/i18n/exercises.sr.ts, muscles in src/domain/muscles.ts.

import type { Exercise } from '@/domain/types';

const ex = (id: string, e: Omit<Exercise, 'id'>): Exercise => ({ id, ...e });

export const EX_MORE: Record<string, Exercise> = {
  // ── Chest ──
  inclinebb: ex('inclinebb', {
    name: 'Incline bench press', group: 'chest', equipment: 'Barbell, incline bench',
    description: 'Upper chest and front delts with a barbell. Set the bench to 30–45 degrees.',
    steps: ['Lie on the incline bench, shoulder blades pulled back.', 'Lower the bar to the upper chest under control.', 'Press back up over the shoulders.'],
  }),
  decline: ex('decline', {
    name: 'Decline bench press', group: 'chest', equipment: 'Barbell, decline bench',
    description: 'Lower chest. The decline angle lets you press a little more weight.',
    steps: ['Hook your feet in and lie back on the decline bench.', 'Lower the bar to the lower chest.', 'Press up until your arms are straight.'],
  }),
  dbbench: ex('dbbench', {
    name: 'Dumbbell bench press', group: 'chest', equipment: 'Dumbbells, flat bench',
    description: 'Chest with dumbbells on a flat bench. Each arm works on its own.',
    steps: ['Lie on the bench, dumbbells over your chest.', 'Lower them to the sides of the chest, elbows at about 45°.', 'Press up and slightly in.'],
  }),
  dbfly: ex('dbfly', {
    name: 'Dumbbell flyes', group: 'chest', equipment: 'Dumbbells, flat bench',
    description: 'Chest isolation with a wide arc. Use a light weight and keep the elbows soft.',
    steps: ['Lie on the bench, dumbbells over your chest, elbows slightly bent.', 'Open your arms out to the sides until you feel a stretch.', 'Bring the dumbbells back together in the same arc.'],
  }),
  pecdeck: ex('pecdeck', {
    name: 'Pec deck', group: 'chest', equipment: 'Machine',
    description: 'Chest fly on a machine. Easy to learn and steady through the whole movement.',
    steps: ['Sit with your back against the pad, handles at chest height.', 'Bring the handles together in front of your chest.', 'Open slowly until you feel a stretch.'],
  }),
  chestpress: ex('chestpress', {
    name: 'Chest press machine', group: 'chest', equipment: 'Machine',
    description: 'A guided press for the chest. A good start before free weights.',
    steps: ['Set the seat so the handles are at mid-chest.', 'Press forward until your arms are almost straight.', 'Return slowly without letting the weight touch down.'],
  }),
  pushup: ex('pushup', {
    name: 'Push-ups', group: 'chest', equipment: 'Body weight', bodyweight: true,
    description: 'Chest, shoulders and triceps with your own weight. Do them on your knees to make them easier.',
    steps: ['Hands slightly wider than your shoulders, body in a straight line.', 'Lower your chest close to the floor, elbows at about 45°.', 'Push back up without letting the hips sag.'],
  }),

  // ── Back ──
  chinup: ex('chinup', {
    name: 'Chin-ups', group: 'back', equipment: 'Bar', bodyweight: true,
    description: 'Like a pull-up with an underhand grip, so the biceps help more.',
    steps: ['Grip the bar underhand at shoulder width.', 'Pull until your chin clears the bar.', 'Lower to straight arms without swinging.'],
  }),
  dbrow: ex('dbrow', {
    name: 'One arm dumbbell row', group: 'back', equipment: 'Dumbbell, bench',
    description: 'Back and lats one side at a time, with a hand on the bench for support.',
    steps: ['Knee and hand on the bench, back flat, dumbbell hanging.', 'Pull the dumbbell to your hip, elbow close to the body.', 'Lower to a full stretch, then switch sides.'],
  }),
  tbarrow: ex('tbarrow', {
    name: 'T-bar row', group: 'back', equipment: 'T-bar or landmine',
    description: 'Thick middle back. The handle keeps the grip close and the pull strong.',
    steps: ['Stand over the bar, hinge to about 45°, back flat.', 'Pull the handle to your chest.', 'Lower under control to straight arms.'],
  }),
  csrow: ex('csrow', {
    name: 'Chest supported row', group: 'back', equipment: 'Dumbbells, incline bench',
    description: 'Rowing with your chest on a bench, so the lower back can rest.',
    steps: ['Lie face down on an incline bench, dumbbells hanging.', 'Pull the dumbbells up, squeezing the shoulder blades together.', 'Lower slowly to straight arms.'],
  }),
  sapulldown: ex('sapulldown', {
    name: 'Straight arm pulldown', group: 'back', equipment: 'Cable',
    description: 'Lats without the biceps doing the work. Arms stay almost straight.',
    steps: ['Face the cable, arms straight out in front, slight lean forward.', 'Pull the bar down to your thighs in an arc.', 'Return slowly to shoulder height.'],
  }),
  machinerow: ex('machinerow', {
    name: 'Machine row', group: 'back', equipment: 'Machine',
    description: 'A guided row for the middle back. Easy to set up and safe for beginners.',
    steps: ['Sit with your chest against the pad.', 'Pull the handles to your sides, shoulder blades together.', 'Return slowly until your arms are straight.'],
  }),

  // ── Shoulders ──
  arnold: ex('arnold', {
    name: 'Arnold press', group: 'shoulders', equipment: 'Dumbbells, bench',
    description: 'A dumbbell press with a turn of the wrists that works the whole shoulder.',
    steps: ['Sit upright, dumbbells in front of your shoulders, palms facing you.', 'Press up while turning your palms forward.', 'Lower and turn back to the start.'],
  }),
  cablelateral: ex('cablelateral', {
    name: 'Cable lateral raise', group: 'shoulders', equipment: 'Cable',
    description: 'Side delts with constant cable tension, one arm at a time.',
    steps: ['Stand side-on to the cable, handle in the far hand.', 'Raise your arm out to shoulder height.', 'Lower slowly, then switch sides.'],
  }),
  frontraise: ex('frontraise', {
    name: 'Front raises', group: 'shoulders', equipment: 'Dumbbells',
    description: 'Front delts. Lift only to shoulder height.',
    steps: ['Dumbbells in front of your thighs, elbows soft.', 'Raise your arms forward to shoulder height.', 'Lower slowly without swinging.'],
  }),
  revfly: ex('revfly', {
    name: 'Reverse flyes', group: 'shoulders', equipment: 'Dumbbells',
    description: 'Rear delts and upper back, bent forward. Good for posture.',
    steps: ['Hinge forward, back flat, dumbbells hanging.', 'Raise your arms out to the sides.', 'Lower slowly.'],
  }),
  revpecdeck: ex('revpecdeck', {
    name: 'Reverse pec deck', group: 'shoulders', equipment: 'Machine',
    description: 'Rear delts on the fly machine, facing the pad.',
    steps: ['Sit facing the pad, arms straight forward on the handles.', 'Open your arms back to the sides.', 'Return slowly.'],
  }),
  uprightrow: ex('uprightrow', {
    name: 'Upright row', group: 'shoulders', equipment: 'Barbell or EZ bar',
    description: 'Side delts and traps. Pull only to chest height to spare the shoulders.',
    steps: ['Hold the bar in front of your thighs, hands shoulder-width apart.', 'Pull the bar up along your body, elbows leading.', 'Stop at chest height and lower slowly.'],
  }),

  // ── Arms: biceps ──
  inclinecurl: ex('inclinecurl', {
    name: 'Incline dumbbell curl', group: 'arms', equipment: 'Dumbbells, incline bench',
    description: 'Biceps from a long stretch, lying back on an incline bench.',
    steps: ['Lie back on the incline bench, arms hanging straight.', 'Curl the dumbbells up without moving the elbows forward.', 'Lower all the way down.'],
  }),
  conccurl: ex('conccurl', {
    name: 'Concentration curl', group: 'arms', equipment: 'Dumbbell, bench',
    description: 'One arm at a time with the elbow braced on your thigh. Strict and focused.',
    steps: ['Sit, elbow against the inside of your thigh.', 'Curl the dumbbell up to your shoulder.', 'Lower slowly, then switch arms.'],
  }),
  preacher: ex('preacher', {
    name: 'Preacher curl', group: 'arms', equipment: 'EZ bar, preacher bench',
    description: 'Biceps with the upper arms on a pad, so you cannot swing.',
    steps: ['Upper arms flat on the pad, underhand grip.', 'Curl the bar up.', 'Lower slowly until the arms are almost straight.'],
  }),
  cablecurl: ex('cablecurl', {
    name: 'Cable bicep curl', group: 'arms', equipment: 'Cable',
    description: 'Biceps with constant tension from the cable.',
    steps: ['Face the low cable, underhand grip, elbows at your sides.', 'Curl the handle to your chest.', 'Lower slowly.'],
  }),
  revcurl: ex('revcurl', {
    name: 'Reverse curl', group: 'arms', equipment: 'Barbell or EZ bar',
    description: 'Forearms and biceps with an overhand grip.',
    steps: ['Hold the bar overhand at shoulder width.', 'Curl it up, elbows at your sides.', 'Lower slowly.'],
  }),
  machinecurl: ex('machinecurl', {
    name: 'Machine bicep curl', group: 'arms', equipment: 'Machine',
    description: 'A guided curl on the machine. Easy to learn.',
    steps: ['Set the seat so your upper arms rest on the pad.', 'Curl the handles up.', 'Lower slowly.'],
  }),

  // ── Arms: triceps ──
  ropepushdown: ex('ropepushdown', {
    name: 'Rope pushdown', group: 'arms', equipment: 'Cable, rope',
    description: 'Triceps on the cable with a rope, spreading the ends at the bottom.',
    steps: ['Face the cable, elbows pinned to your sides.', 'Push the rope down and spread the ends apart.', 'Return to about 90° at the elbow.'],
  }),
  cableohext: ex('cableohext', {
    name: 'Cable overhead extension', group: 'arms', equipment: 'Cable, rope',
    description: 'Triceps, especially the long head, facing away from the cable.',
    steps: ['Face away from the cable, rope behind your head, one foot forward.', 'Straighten your arms forward and up.', 'Bend the elbows back slowly.'],
  }),
  closegrip: ex('closegrip', {
    name: 'Close grip bench press', group: 'arms', equipment: 'Barbell, flat bench',
    description: 'Triceps and chest. Hands about shoulder-width apart.',
    steps: ['Lie on the bench, grip at shoulder width.', 'Lower the bar to the lower chest, elbows close to the body.', 'Press up.'],
  }),
  benchdip: ex('benchdip', {
    name: 'Bench dips', group: 'arms', equipment: 'Bench', bodyweight: true,
    description: 'Triceps with your hands on a bench behind you.',
    steps: ['Hands on the bench edge, legs out in front.', 'Lower your body by bending the elbows to about 90°.', 'Push back up.'],
  }),
  kickback: ex('kickback', {
    name: 'Triceps kickbacks', group: 'arms', equipment: 'Dumbbell',
    description: 'Triceps, bent over, straightening the arm back.',
    steps: ['Hinge forward, upper arm along your body.', 'Straighten your arm back.', 'Bend back to 90° slowly.'],
  }),
  onearmext: ex('onearmext', {
    name: 'Single arm cable extension', group: 'arms', equipment: 'Cable',
    description: 'Triceps one arm at a time on the cable.',
    steps: ['Hold the handle, elbow at your side.', 'Push down until the arm is straight.', 'Return slowly, then switch arms.'],
  }),

  // ── Legs: quads ──
  frontsquat: ex('frontsquat', {
    name: 'Front squat', group: 'legs', equipment: 'Barbell',
    description: 'Squat with the bar on the front of the shoulders. More quads, upright torso.',
    steps: ['Bar on the front of the shoulders, elbows high.', 'Squat down keeping the chest up.', 'Drive up through the whole foot.'],
  }),
  hacksquat: ex('hacksquat', {
    name: 'Hack squat', group: 'legs', equipment: 'Machine',
    description: 'A guided squat on the machine. Quads without balancing a bar.',
    steps: ['Back against the pad, feet shoulder-width on the platform.', 'Lower until the knees reach about 90°.', 'Press back up.'],
  }),
  legext: ex('legext', {
    name: 'Leg extension', group: 'legs', equipment: 'Machine',
    description: 'Isolates the quads on the machine.',
    steps: ['Sit with the pad on your lower shins.', 'Straighten your legs.', 'Lower slowly.'],
  }),
  goblet: ex('goblet', {
    name: 'Goblet squat', group: 'legs', equipment: 'Dumbbell or kettlebell',
    description: 'Squat holding one weight at your chest. Great for learning the squat.',
    steps: ['Hold the weight at your chest, feet shoulder-width apart.', 'Squat down between your knees, chest up.', 'Stand back up.'],
  }),
  walklunge: ex('walklunge', {
    name: 'Walking lunges', group: 'legs', equipment: 'Dumbbells',
    description: 'Lunges that move forward. Legs, glutes and balance.',
    steps: ['Step forward and lower the back knee toward the floor.', 'Push through the front foot and step the back foot forward.', 'Keep alternating legs.'],
  }),
  revlunge: ex('revlunge', {
    name: 'Reverse lunges', group: 'legs', equipment: 'Dumbbells',
    description: 'Stepping back instead of forward. Easier on the knees.',
    steps: ['Stand tall and step one foot back.', 'Lower the back knee toward the floor.', 'Push through the front foot to stand up.'],
  }),
  stepup: ex('stepup', {
    name: 'Step-ups', group: 'legs', equipment: 'Bench or box, dumbbells',
    description: 'Stepping onto a bench, one leg at a time.',
    steps: ['Place one foot on the bench.', 'Push through that foot to stand on the bench.', 'Step down slowly, then switch.'],
  }),
  sumo: ex('sumo', {
    name: 'Sumo squat', group: 'legs', equipment: 'Dumbbell or kettlebell',
    description: 'Wide stance squat. More inner thighs and glutes.',
    steps: ['Feet wide, toes turned out, weight hanging between your legs.', 'Squat down, knees following the toes.', 'Stand back up.'],
  }),

  // ── Legs: glutes and hamstrings ──
  stiffleg: ex('stiffleg', {
    name: 'Stiff leg deadlift', group: 'legs', equipment: 'Barbell',
    description: 'Hamstrings with the legs almost straight.',
    steps: ['Hold the bar, legs almost straight.', 'Hinge forward until you feel the hamstrings stretch.', 'Stand back up.'],
  }),
  hipthrust: ex('hipthrust', {
    name: 'Hip thrust', group: 'legs', equipment: 'Barbell, bench',
    description: 'The strongest glute exercise. Upper back on a bench, bar on the hips.',
    steps: ['Upper back on the bench, bar over your hips, feet flat.', 'Drive your hips up until the body is flat.', 'Lower slowly.'],
  }),
  glutebridge: ex('glutebridge', {
    name: 'Glute bridge', group: 'legs', equipment: 'Body weight', bodyweight: true,
    description: 'Glutes from the floor. A good start before hip thrusts.',
    steps: ['Lie on your back, knees bent, feet flat.', 'Lift your hips until the body is straight.', 'Lower slowly.'],
  }),
  seatedlegcurl: ex('seatedlegcurl', {
    name: 'Seated leg curl', group: 'legs', equipment: 'Machine',
    description: 'Hamstrings on the seated machine.',
    steps: ['Sit with the pad above your heels.', 'Curl your heels down and back.', 'Return slowly.'],
  }),
  standlegcurl: ex('standlegcurl', {
    name: 'Standing leg curl', group: 'legs', equipment: 'Machine or cable',
    description: 'Hamstrings one leg at a time, standing.',
    steps: ['Stand at the machine, pad behind your ankle.', 'Curl the heel toward your glutes.', 'Lower slowly, then switch.'],
  }),
  kickbackglute: ex('kickbackglute', {
    name: 'Cable glute kickback', group: 'legs', equipment: 'Cable, ankle strap',
    description: 'Glutes one leg at a time on the cable.',
    steps: ['Strap on the ankle, hold the machine.', 'Push the leg back and up.', 'Return slowly, then switch.'],
  }),
  abduction: ex('abduction', {
    name: 'Hip abduction', group: 'legs', equipment: 'Machine',
    description: 'Outer hips and glutes on the machine.',
    steps: ['Sit with the pads outside your knees.', 'Push your knees apart.', 'Return slowly.'],
  }),
  adduction: ex('adduction', {
    name: 'Hip adduction', group: 'legs', equipment: 'Machine',
    description: 'Inner thighs on the machine.',
    steps: ['Sit with the pads inside your knees.', 'Squeeze your knees together.', 'Open slowly.'],
  }),
  pullthrough: ex('pullthrough', {
    name: 'Cable pull through', group: 'legs', equipment: 'Cable, rope',
    description: 'Glutes and hamstrings with a hip hinge, facing away from the cable.',
    steps: ['Face away from the low cable, rope between your legs.', 'Hinge back, letting the rope pass between your legs.', 'Drive the hips forward to stand up.'],
  }),

  // ── Legs: calves ──
  seatedcalf: ex('seatedcalf', {
    name: 'Seated calf raises', group: 'legs', equipment: 'Machine',
    description: 'Calves seated, which works the deeper calf muscle.',
    steps: ['Sit with the pad on your knees, balls of the feet on the step.', 'Rise onto your toes.', 'Lower your heels for a full stretch.'],
  }),
  presscalf: ex('presscalf', {
    name: 'Leg press calf raises', group: 'legs', equipment: 'Leg press machine',
    description: 'Calves on the leg press, pushing with the balls of the feet.',
    steps: ['Balls of the feet on the bottom edge of the platform, legs straight.', 'Push the platform with your toes.', 'Let the heels come back for a stretch.'],
  }),

  // ── Core ──
  crunch: ex('crunch', {
    name: 'Crunches', group: 'core', equipment: 'Body weight', bodyweight: true,
    description: 'Upper abs. A short movement, lower back stays on the floor.',
    steps: ['Lie on your back, knees bent.', 'Curl your shoulders up off the floor.', 'Lower slowly.'],
  }),
  situp: ex('situp', {
    name: 'Sit-ups', group: 'core', equipment: 'Body weight', bodyweight: true,
    description: 'The full sit-up, all the way up.',
    steps: ['Lie on your back, knees bent, feet on the floor.', 'Sit all the way up.', 'Lower back down under control.'],
  }),
  cablecrunch: ex('cablecrunch', {
    name: 'Cable crunch', group: 'core', equipment: 'Cable, rope',
    description: 'Abs with weight, kneeling at the cable.',
    steps: ['Kneel facing the cable, rope by your head.', 'Crunch down, bringing your elbows toward your knees.', 'Return slowly.'],
  }),
  kneeraise: ex('kneeraise', {
    name: 'Hanging knee raises', group: 'core', equipment: 'Bar', bodyweight: true,
    description: 'An easier version of the hanging leg raise.',
    steps: ['Hang from the bar.', 'Bring your knees up to your chest.', 'Lower slowly without swinging.'],
  }),
  revcrunch: ex('revcrunch', {
    name: 'Reverse crunch', group: 'core', equipment: 'Body weight', bodyweight: true,
    description: 'Lower abs, lifting the hips off the floor.',
    steps: ['Lie on your back, knees bent up.', 'Roll your hips up off the floor.', 'Lower slowly.'],
  }),
  sideplank: ex('sideplank', {
    name: 'Side plank', group: 'core', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Obliques. Hold on one side, then the other. Logged in seconds.',
    steps: ['Lie on your side, elbow under your shoulder.', 'Lift your hips so the body is straight.', 'Hold, then switch sides.'],
  }),
  russiantwist: ex('russiantwist', {
    name: 'Russian twists', group: 'core', equipment: 'Body weight or plate', bodyweight: true,
    description: 'Obliques, turning the torso side to side while sitting.',
    steps: ['Sit leaning back, feet lifted or on the floor.', 'Turn your torso to one side.', 'Turn to the other side. Each turn is one rep.'],
  }),
  abmachine: ex('abmachine', {
    name: 'Ab crunch machine', group: 'core', equipment: 'Machine',
    description: 'A guided crunch with weight.',
    steps: ['Sit and hold the handles.', 'Crunch forward.', 'Return slowly.'],
  }),

  // ── Cardio ──
  inclinewalk: ex('inclinewalk', {
    name: 'Incline walking', group: 'cardio', equipment: 'Treadmill', kind: 'cardio', unit: 'km', step: 0.1,
    description: 'Fast walking on a steep incline. Easy on the joints, hard on the legs and lungs.',
    steps: ['Set an incline of 8 to 12%.', 'Walk without holding the rails.', 'Keep a pace you can talk at.'],
  }),

  // ── Functional ──
  jumprope: ex('jumprope', {
    name: 'Jump rope', group: 'functional', equipment: 'Jump rope', bodyweight: true, timed: true,
    description: 'Fast conditioning and coordination. Logged in seconds.',
    steps: ['Small jumps on the balls of your feet.', 'Turn the rope with your wrists, not your arms.', 'Keep a steady rhythm.'],
  }),
  burpee: ex('burpee', {
    name: 'Burpees', group: 'functional', equipment: 'Body weight', bodyweight: true,
    description: 'The whole body in one move: squat, push-up position and a jump.',
    steps: ['Squat and put your hands on the floor.', 'Jump your feet back to a plank, then back in.', 'Jump up with your arms overhead.'],
  }),
  climber: ex('climber', {
    name: 'Mountain climbers', group: 'functional', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Core and conditioning in a plank position. Logged in seconds.',
    steps: ['Start in a high plank.', 'Drive one knee to your chest, then switch quickly.', 'Keep your hips low.'],
  }),
  jumpsquat: ex('jumpsquat', {
    name: 'Jump squats', group: 'functional', equipment: 'Body weight', bodyweight: true,
    description: 'Explosive legs: a squat and a jump.',
    steps: ['Squat down.', 'Jump up as high as you can.', 'Land softly and go straight into the next squat.'],
  }),
  battlerope: ex('battlerope', {
    name: 'Battle ropes', group: 'functional', equipment: 'Battle ropes', timed: true,
    description: 'Shoulders and conditioning with heavy ropes. Logged in seconds.',
    steps: ['Hold the ropes, knees soft.', 'Make waves by moving the arms up and down fast.', 'Keep going for the set time.'],
  }),
  farmer: ex('farmer', {
    name: "Farmer's walk", group: 'functional', equipment: 'Dumbbells or kettlebells', timed: true,
    description: 'Grip, traps and core: walking with heavy weights. Logged in seconds.',
    steps: ['Pick up heavy weights, one in each hand.', 'Walk with short steps, shoulders back.', 'Put them down under control.'],
  }),
  kbswing: ex('kbswing', {
    name: 'Kettlebell swings', group: 'functional', equipment: 'Kettlebell',
    description: 'Glutes, hamstrings and conditioning with a hip hinge.',
    steps: ['Hinge and swing the kettlebell back between your legs.', 'Snap your hips forward to swing it to chest height.', 'Let it fall back and repeat.'],
  }),
  boxjump: ex('boxjump', {
    name: 'Box jumps', group: 'functional', equipment: 'Box', bodyweight: true,
    description: 'Explosive legs, jumping onto a box.',
    steps: ['Stand in front of the box.', 'Swing your arms and jump onto the box.', 'Step down and reset.'],
  }),
  sled: ex('sled', {
    name: 'Sled push', group: 'functional', equipment: 'Sled', timed: true,
    description: 'Legs and conditioning, pushing a loaded sled. Logged in seconds.',
    steps: ['Hold the handles with your body leaning forward.', 'Drive with short, powerful steps.', 'Push for the set time.'],
  }),
  turkish: ex('turkish', {
    name: 'Turkish get-up', group: 'functional', equipment: 'Kettlebell',
    description: 'Whole-body control: from lying to standing with a weight overhead.',
    steps: ['Lie down, kettlebell held straight up in one hand.', 'Stand up step by step, eyes on the weight.', 'Reverse the steps back down, then switch sides.'],
  }),
  ropeslam: ex('ropeslam', {
    name: 'Battle rope slams', group: 'functional', equipment: 'Battle ropes', timed: true,
    description: 'Slam both ropes into the floor. Power and conditioning. Logged in seconds.',
    steps: ['Hold the ropes, feet shoulder-width apart.', 'Lift both ropes overhead.', 'Slam them into the floor and repeat.'],
  }),

  // ── Warm-up (added 2026-11-19; done for a time before the first exercise) ──
  jumpingjack: ex('jumpingjack', {
    name: 'Jumping jacks', group: 'mobility', mobility: 'warmup', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Raises the heart rate and warms the whole body.',
    steps: ['Jump your feet apart while raising your arms overhead.', 'Jump back together, arms down.', 'Keep a light, steady rhythm.'],
  }),
  highknees: ex('highknees', {
    name: 'High knees', group: 'mobility', mobility: 'warmup', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Running on the spot with high knees. Warms the legs and hips.',
    steps: ['Run on the spot.', 'Bring each knee up to hip height.', 'Pump your arms.'],
  }),
  armcircles: ex('armcircles', {
    name: 'Arm circles', group: 'mobility', mobility: 'warmup', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Loosens the shoulders before upper-body work.',
    steps: ['Arms straight out to the sides.', 'Make small circles, growing bigger.', 'Halfway through, change direction.'],
  }),
  legswings: ex('legswings', {
    name: 'Leg swings', group: 'mobility', mobility: 'warmup', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Opens the hips before squats and lunges.',
    steps: ['Hold on to something for balance.', 'Swing one leg forward and back, relaxed.', 'Halfway through, switch legs.'],
  }),
  hipcircles: ex('hipcircles', {
    name: 'Hip circles', group: 'mobility', mobility: 'warmup', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Loosens the hips and lower back.',
    steps: ['Hands on your hips, feet shoulder-width apart.', 'Draw big circles with your hips.', 'Halfway through, change direction.'],
  }),
  airsquat: ex('airsquat', {
    name: 'Bodyweight squat', group: 'mobility', mobility: 'warmup', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Squats without weight to warm the legs and practise the movement.',
    steps: ['Feet shoulder-width apart, arms forward.', 'Squat down, chest up.', 'Stand up and repeat at an easy pace.'],
  }),
  inchworm: ex('inchworm', {
    name: 'Inchworm', group: 'mobility', mobility: 'warmup', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Walks the hands out to a plank. Warms the hamstrings, shoulders and core.',
    steps: ['Bend forward and put your hands on the floor.', 'Walk your hands out to a plank.', 'Walk them back and stand up.'],
  }),
  greateststretch: ex('greateststretch', {
    name: "World's greatest stretch", group: 'mobility', mobility: 'warmup', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'A lunge with a twist. Opens the hips, back and shoulders in one move.',
    steps: ['Step into a long lunge, hands on the floor.', 'Turn your chest and reach one arm to the ceiling.', 'Switch sides.'],
  }),
  catcow: ex('catcow', {
    name: 'Cat-cow', group: 'mobility', mobility: 'warmup', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Moves the spine gently. Good before back and core work.',
    steps: ['On hands and knees.', 'Round your back up, then let it sink down.', 'Move slowly with your breath.'],
  }),

  // ── Stretching (done for a time after the last exercise) ──
  chestStretch: ex('chestStretch', {
    name: 'Doorway chest stretch', group: 'mobility', mobility: 'stretch', equipment: 'Wall or doorway', bodyweight: true, timed: true,
    description: 'Stretches the chest and front of the shoulders.',
    steps: ['Forearm on a door frame, elbow at shoulder height.', 'Step forward until you feel the stretch.', 'Hold, then switch sides.'],
  }),
  latStretch: ex('latStretch', {
    name: 'Lat stretch', group: 'mobility', mobility: 'stretch', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Stretches the sides of the back.',
    steps: ['Reach one arm overhead.', 'Lean to the other side.', 'Hold, then switch sides.'],
  }),
  shoulderStretch: ex('shoulderStretch', {
    name: 'Cross-body shoulder stretch', group: 'mobility', mobility: 'stretch', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Stretches the back of the shoulder.',
    steps: ['Bring one arm across your chest.', 'Pull it closer with the other hand.', 'Hold, then switch sides.'],
  }),
  tricepsStretch: ex('tricepsStretch', {
    name: 'Overhead triceps stretch', group: 'mobility', mobility: 'stretch', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Stretches the triceps.',
    steps: ['Reach one hand down your back, elbow pointing up.', 'Press the elbow gently with the other hand.', 'Hold, then switch sides.'],
  }),
  bicepsStretch: ex('bicepsStretch', {
    name: 'Wall biceps stretch', group: 'mobility', mobility: 'stretch', equipment: 'Wall', bodyweight: true, timed: true,
    description: 'Stretches the biceps and forearms.',
    steps: ['Palm flat on a wall behind you, arm straight.', 'Turn your body away from the wall.', 'Hold, then switch sides.'],
  }),
  quadStretch: ex('quadStretch', {
    name: 'Standing quad stretch', group: 'mobility', mobility: 'stretch', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Stretches the front of the thigh.',
    steps: ['Stand on one leg, hold something if needed.', 'Pull the other heel toward your glutes.', 'Hold, then switch legs.'],
  }),
  hamStretch: ex('hamStretch', {
    name: 'Hamstring stretch', group: 'mobility', mobility: 'stretch', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Stretches the back of the thigh.',
    steps: ['Sit with one leg straight, the other bent.', 'Reach toward the foot of the straight leg, back long.', 'Hold, then switch legs.'],
  }),
  hipFlexorStretch: ex('hipFlexorStretch', {
    name: 'Kneeling hip flexor stretch', group: 'mobility', mobility: 'stretch', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Stretches the front of the hip. Good after squats and long sitting.',
    steps: ['Kneel on one knee, the other foot in front.', 'Shift your hips forward, torso upright.', 'Hold, then switch sides.'],
  }),
  glutStretch: ex('glutStretch', {
    name: 'Figure-four glute stretch', group: 'mobility', mobility: 'stretch', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Stretches the glutes and outer hip.',
    steps: ['Lie on your back, one ankle over the other knee.', 'Pull the lower leg toward your chest.', 'Hold, then switch sides.'],
  }),
  calfStretch: ex('calfStretch', {
    name: 'Wall calf stretch', group: 'mobility', mobility: 'stretch', equipment: 'Wall', bodyweight: true, timed: true,
    description: 'Stretches the calves.',
    steps: ['Hands on a wall, one leg back, heel down.', 'Lean into the wall until you feel the calf stretch.', 'Hold, then switch legs.'],
  }),
  childsPose: ex('childsPose', {
    name: "Child's pose", group: 'mobility', mobility: 'stretch', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Relaxes the back and shoulders.',
    steps: ['Kneel and sit back on your heels.', 'Reach your arms forward on the floor.', 'Breathe slowly and relax.'],
  }),
  cobra: ex('cobra', {
    name: 'Cobra stretch', group: 'mobility', mobility: 'stretch', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Stretches the abs and front of the body.',
    steps: ['Lie face down, hands under your shoulders.', 'Press your chest up, hips on the floor.', 'Hold and breathe.'],
  }),
  spinalTwist: ex('spinalTwist', {
    name: 'Lying spinal twist', group: 'mobility', mobility: 'stretch', equipment: 'Body weight', bodyweight: true, timed: true,
    description: 'Relaxes the lower back and obliques.',
    steps: ['Lie on your back, arms out to the sides.', 'Drop both knees to one side.', 'Hold, then switch sides.'],
  }),
};

/** Library order from the owner's list, grouped by muscle (ids not listed keep their place at the end). */
export const ORDER = [
  // chest
  'bench', 'inclinebb', 'decline', 'dbbench', 'incline', 'dbfly', 'fly', 'pecdeck', 'chestpress', 'pushup', 'dips',
  // back
  'lat', 'pullup', 'chinup', 'cablerow', 'row', 'dbrow', 'tbarrow', 'csrow', 'sapulldown', 'machinerow', 'deadlift',
  // shoulders
  'ohp', 'dbpress', 'arnold', 'lateral', 'cablelateral', 'frontraise', 'revfly', 'revpecdeck', 'facepull', 'uprightrow',
  // arms
  'curl', 'dbcurl', 'hammer', 'inclinecurl', 'conccurl', 'preacher', 'cablecurl', 'revcurl', 'machinecurl',
  'pushdown', 'ropepushdown', 'cableohext', 'ohext', 'skull', 'closegrip', 'benchdip', 'kickback', 'onearmext',
  // legs
  'squat', 'frontsquat', 'press', 'hacksquat', 'legext', 'bulgarian', 'goblet', 'walklunge', 'lunge', 'revlunge', 'stepup',
  'rdl', 'stiffleg', 'hipthrust', 'glutebridge', 'legcurl', 'seatedlegcurl', 'standlegcurl', 'kickbackglute', 'abduction',
  'adduction', 'sumo', 'pullthrough', 'calf', 'seatedcalf', 'presscalf',
  // core
  'crunch', 'situp', 'cablecrunch', 'legraise', 'kneeraise', 'revcrunch', 'plank', 'sideplank', 'russiantwist', 'abwheel', 'abmachine',
  // cardio
  'treadmill', 'inclinewalk', 'stairs', 'bike', 'elliptical', 'rower',
  // functional
  'jumprope', 'burpee', 'climber', 'jumpsquat', 'battlerope', 'farmer', 'kbswing', 'boxjump', 'sled', 'turkish', 'ropeslam',
  // warm-up
  'jumpingjack', 'highknees', 'armcircles', 'legswings', 'hipcircles', 'airsquat', 'inchworm', 'greateststretch', 'catcow',
  // stretching
  'chestStretch', 'latStretch', 'shoulderStretch', 'tricepsStretch', 'bicepsStretch', 'quadStretch', 'hamStretch',
  'hipFlexorStretch', 'glutStretch', 'calfStretch', 'childsPose', 'cobra', 'spinalTwist',
];

/** Sub-groups shown as headings inside a muscle group (groups not listed show one list). */
export const SECTIONS: Partial<Record<string, { label: string; ids: string[] }[]>> = {
  arms: [
    { label: 'Biceps', ids: ['curl', 'dbcurl', 'hammer', 'inclinecurl', 'conccurl', 'preacher', 'cablecurl', 'revcurl', 'machinecurl'] },
    { label: 'Triceps', ids: ['pushdown', 'ropepushdown', 'cableohext', 'ohext', 'skull', 'closegrip', 'benchdip', 'kickback', 'onearmext'] },
  ],
  legs: [
    { label: 'Quads', ids: ['squat', 'frontsquat', 'press', 'hacksquat', 'legext', 'bulgarian', 'goblet', 'walklunge', 'lunge', 'revlunge', 'stepup'] },
    {
      label: 'Glutes & hamstrings',
      ids: ['rdl', 'stiffleg', 'hipthrust', 'glutebridge', 'legcurl', 'seatedlegcurl', 'standlegcurl', 'kickbackglute', 'abduction', 'adduction', 'sumo', 'pullthrough'],
    },
    { label: 'Calves', ids: ['calf', 'seatedcalf', 'presscalf'] },
  ],
  mobility: [
    { label: 'Warm-up', ids: ['jumpingjack', 'highknees', 'armcircles', 'legswings', 'hipcircles', 'airsquat', 'inchworm', 'greateststretch', 'catcow'] },
    {
      label: 'Stretching',
      ids: ['chestStretch', 'latStretch', 'shoulderStretch', 'tricepsStretch', 'bicepsStretch', 'quadStretch', 'hamStretch', 'hipFlexorStretch', 'glutStretch', 'calfStretch', 'childsPose', 'cobra', 'spinalTwist'],
    },
  ],
};
