import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/types";

type ExerciseInsert = Database["public"]["Tables"]["exercises"]["Insert"];

const exercises: Omit<ExerciseInsert, "id" | "created_at" | "updated_at" | "is_custom" | "is_active">[] = [
  // Chest
  { name: "Barbell Bench Press", primary_muscle_group: "Chest", secondary_muscle_groups: ["Triceps", "Shoulders"], equipment: "Barbell", tracking_type: "reps", description: "Lie on a bench and press a barbell upward from chest level." },
  { name: "Dumbbell Bench Press", primary_muscle_group: "Chest", secondary_muscle_groups: ["Triceps", "Shoulders"], equipment: "Dumbbell", tracking_type: "reps", description: "Press dumbbells upward while lying on a bench." },
  { name: "Incline Barbell Press", primary_muscle_group: "Chest", secondary_muscle_groups: ["Shoulders", "Triceps"], equipment: "Barbell", tracking_type: "reps", description: "Bench press on an incline bench targeting upper chest." },
  { name: "Incline Dumbbell Press", primary_muscle_group: "Chest", secondary_muscle_groups: ["Shoulders", "Triceps"], equipment: "Dumbbell", tracking_type: "reps", description: "Dumbbell press on an incline bench." },
  { name: "Dumbbell Fly", primary_muscle_group: "Chest", secondary_muscle_groups: [], equipment: "Dumbbell", tracking_type: "reps", description: "Open arms wide and bring dumbbells together over chest." },
  { name: "Cable Fly", primary_muscle_group: "Chest", secondary_muscle_groups: [], equipment: "Cable", tracking_type: "reps", description: "Use cable machine to perform chest fly motion." },
  { name: "Pec Deck Machine", primary_muscle_group: "Chest", secondary_muscle_groups: [], equipment: "Machine", tracking_type: "reps", description: "Machine-based chest fly with fixed range of motion." },
  { name: "Push-ups", primary_muscle_group: "Chest", secondary_muscle_groups: ["Triceps", "Shoulders"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Classic bodyweight chest exercise from plank position." },
  { name: "Decline Bench Press", primary_muscle_group: "Chest", secondary_muscle_groups: ["Triceps"], equipment: "Barbell", tracking_type: "reps", description: "Bench press on a decline bench targeting lower chest." },
  { name: "Dips", primary_muscle_group: "Chest", secondary_muscle_groups: ["Triceps", "Shoulders"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Lower and raise body using parallel bars, leaning forward for chest emphasis." },

  // Back
  { name: "Deadlift", primary_muscle_group: "Back", secondary_muscle_groups: ["Hamstrings", "Glutes", "Traps"], equipment: "Barbell", tracking_type: "reps", description: "Lift a barbell from the ground to hip level." },
  { name: "Pull-ups", primary_muscle_group: "Back", secondary_muscle_groups: ["Biceps", "Lats"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Pull body up to a bar with overhand grip." },
  { name: "Chin-ups", primary_muscle_group: "Back", secondary_muscle_groups: ["Biceps", "Lats"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Pull body up to a bar with underhand grip." },
  { name: "Lat Pulldown", primary_muscle_group: "Back", secondary_muscle_groups: ["Biceps", "Lats"], equipment: "Cable", tracking_type: "reps", description: "Pull a cable bar down to upper chest level." },
  { name: "Barbell Row", primary_muscle_group: "Back", secondary_muscle_groups: ["Biceps", "Lats"], equipment: "Barbell", tracking_type: "reps", description: "Bend over and row a barbell to lower chest/abdomen." },
  { name: "Dumbbell Row", primary_muscle_group: "Back", secondary_muscle_groups: ["Biceps", "Lats"], equipment: "Dumbbell", tracking_type: "reps", description: "Single-arm row with dumbbell on a bench." },
  { name: "T-Bar Row", primary_muscle_group: "Back", secondary_muscle_groups: ["Biceps", "Lats"], equipment: "Barbell", tracking_type: "reps", description: "Row using a T-bar landmine attachment." },
  { name: "Seated Cable Row", primary_muscle_group: "Back", secondary_muscle_groups: ["Biceps", "Lats"], equipment: "Cable", tracking_type: "reps", description: "Row a cable attachment while seated." },
  { name: "Face Pulls", primary_muscle_group: "Back", secondary_muscle_groups: ["Shoulders", "Traps"], equipment: "Cable", tracking_type: "reps", description: "Pull rope attachment toward face level to target rear delts and upper back." },
  { name: "Straight Arm Pulldown", primary_muscle_group: "Back", secondary_muscle_groups: ["Lats"], equipment: "Cable", tracking_type: "reps", description: "Keep arms straight and pull cable bar down to thighs." },

  // Shoulders
  { name: "Overhead Press", primary_muscle_group: "Shoulders", secondary_muscle_groups: ["Triceps", "Traps"], equipment: "Barbell", tracking_type: "reps", description: "Press barbell overhead from shoulder level." },
  { name: "Dumbbell Overhead Press", primary_muscle_group: "Shoulders", secondary_muscle_groups: ["Triceps"], equipment: "Dumbbell", tracking_type: "reps", description: "Press dumbbells overhead from shoulder level." },
  { name: "Lateral Raise", primary_muscle_group: "Shoulders", secondary_muscle_groups: [], equipment: "Dumbbell", tracking_type: "reps", description: "Raise dumbbells out to sides up to shoulder height." },
  { name: "Front Raise", primary_muscle_group: "Shoulders", secondary_muscle_groups: [], equipment: "Dumbbell", tracking_type: "reps", description: "Raise dumbbells forward and upward to shoulder height." },
  { name: "Reverse Fly", primary_muscle_group: "Shoulders", secondary_muscle_groups: ["Back"], equipment: "Dumbbell", tracking_type: "reps", description: "Bend forward and raise dumbbells out to sides." },
  { name: "Upright Row", primary_muscle_group: "Shoulders", secondary_muscle_groups: ["Traps"], equipment: "Barbell", tracking_type: "reps", description: "Pull barbell upward toward chin level." },
  { name: "Arnold Press", primary_muscle_group: "Shoulders", secondary_muscle_groups: ["Triceps"], equipment: "Dumbbell", tracking_type: "reps", description: "Rotate dumbbells while pressing overhead." },
  { name: "Cable Lateral Raise", primary_muscle_group: "Shoulders", secondary_muscle_groups: [], equipment: "Cable", tracking_type: "reps", description: "Lateral raise using cable machine for constant tension." },

  // Biceps
  { name: "Barbell Curl", primary_muscle_group: "Biceps", secondary_muscle_groups: ["Forearms"], equipment: "Barbell", tracking_type: "reps", description: "Curl barbell upward with elbows fixed at sides." },
  { name: "Dumbbell Curl", primary_muscle_group: "Biceps", secondary_muscle_groups: ["Forearms"], equipment: "Dumbbell", tracking_type: "reps", description: "Curl dumbbells upward with elbows fixed at sides." },
  { name: "Hammer Curl", primary_muscle_group: "Biceps", secondary_muscle_groups: ["Forearms"], equipment: "Dumbbell", tracking_type: "reps", description: "Curl dumbbells with neutral grip (palms facing each other)." },
  { name: "Preacher Curl", primary_muscle_group: "Biceps", secondary_muscle_groups: ["Forearms"], equipment: "Barbell", tracking_type: "reps", description: "Curl barbell on a preacher bench for isolated bicep work." },
  { name: "Cable Curl", primary_muscle_group: "Biceps", secondary_muscle_groups: ["Forearms"], equipment: "Cable", tracking_type: "reps", description: "Curl cable bar or rope attachment upward." },
  { name: "Incline Dumbbell Curl", primary_muscle_group: "Biceps", secondary_muscle_groups: ["Forearms"], equipment: "Dumbbell", tracking_type: "reps", description: "Curl dumbbells while lying back on an incline bench." },
  { name: "Concentration Curl", primary_muscle_group: "Biceps", secondary_muscle_groups: ["Forearms"], equipment: "Dumbbell", tracking_type: "reps", description: "Single-arm curl with elbow braced against inner thigh." },

  // Triceps
  { name: "Tricep Pushdown", primary_muscle_group: "Triceps", secondary_muscle_groups: [], equipment: "Cable", tracking_type: "reps", description: "Push cable bar or rope down until arms are fully extended." },
  { name: "Overhead Tricep Extension", primary_muscle_group: "Triceps", secondary_muscle_groups: [], equipment: "Dumbbell", tracking_type: "reps", description: "Extend dumbbell overhead to target long head of triceps." },
  { name: "Skull Crushers", primary_muscle_group: "Triceps", secondary_muscle_groups: [], equipment: "Barbell", tracking_type: "reps", description: "Lie on bench and lower barbell toward forehead, then extend." },
  { name: "Close Grip Bench Press", primary_muscle_group: "Triceps", secondary_muscle_groups: ["Chest"], equipment: "Barbell", tracking_type: "reps", description: "Bench press with narrow grip emphasizing triceps." },
  { name: "Tricep Kickbacks", primary_muscle_group: "Triceps", secondary_muscle_groups: [], equipment: "Dumbbell", tracking_type: "reps", description: "Bend forward and extend dumbbell backward until arm is straight." },
  { name: "Dips (Tricep Focus)", primary_muscle_group: "Triceps", secondary_muscle_groups: ["Chest", "Shoulders"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Dips with upright torso to emphasize triceps." },
  { name: "Diamond Push-ups", primary_muscle_group: "Triceps", secondary_muscle_groups: ["Chest", "Shoulders"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Push-ups with hands close together forming a diamond shape." },

  // Quadriceps
  { name: "Barbell Squat", primary_muscle_group: "Quadriceps", secondary_muscle_groups: ["Glutes", "Hamstrings"], equipment: "Barbell", tracking_type: "reps", description: "Squat down with barbell on upper back, then stand up." },
  { name: "Front Squat", primary_muscle_group: "Quadriceps", secondary_muscle_groups: ["Glutes", "Hamstrings"], equipment: "Barbell", tracking_type: "reps", description: "Squat with barbell held across front deltoids." },
  { name: "Leg Press", primary_muscle_group: "Quadriceps", secondary_muscle_groups: ["Glutes", "Hamstrings"], equipment: "Machine", tracking_type: "reps", description: "Push weight away using leg press machine." },
  { name: "Leg Extension", primary_muscle_group: "Quadriceps", secondary_muscle_groups: [], equipment: "Machine", tracking_type: "reps", description: "Extend knees to lift padded bar on leg extension machine." },
  { name: "Walking Lunges", primary_muscle_group: "Quadriceps", secondary_muscle_groups: ["Glutes", "Hamstrings"], equipment: "Dumbbell", tracking_type: "reps", description: "Step forward into lunge, alternating legs while walking." },
  { name: "Bulgarian Split Squat", primary_muscle_group: "Quadriceps", secondary_muscle_groups: ["Glutes", "Hamstrings"], equipment: "Dumbbell", tracking_type: "reps", description: "Single-leg squat with rear foot elevated on a bench." },
  { name: "Hack Squat", primary_muscle_group: "Quadriceps", secondary_muscle_groups: ["Glutes", "Hamstrings"], equipment: "Machine", tracking_type: "reps", description: "Squat on hack squat machine with fixed back support." },
  { name: "Goblet Squat", primary_muscle_group: "Quadriceps", secondary_muscle_groups: ["Glutes", "Hamstrings"], equipment: "Dumbbell", tracking_type: "reps", description: "Hold dumbbell at chest level and squat down." },
  { name: "Air Squats", primary_muscle_group: "Quadriceps", secondary_muscle_groups: ["Glutes", "Hamstrings"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Bodyweight squat with arms extended forward." },
  { name: "Sissy Squat", primary_muscle_group: "Quadriceps", secondary_muscle_groups: [], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Lean back while squatting to isolate quadriceps." },

  // Hamstrings
  { name: "Romanian Deadlift", primary_muscle_group: "Hamstrings", secondary_muscle_groups: ["Glutes", "Lower Back"], equipment: "Barbell", tracking_type: "reps", description: "Hinge at hips and lower barbell down legs with slight knee bend." },
  { name: "Lying Leg Curl", primary_muscle_group: "Hamstrings", secondary_muscle_groups: [], equipment: "Machine", tracking_type: "reps", description: "Lie face down and curl heels toward glutes." },
  { name: "Seated Leg Curl", primary_muscle_group: "Hamstrings", secondary_muscle_groups: [], equipment: "Machine", tracking_type: "reps", description: "Sit and curl lower legs back under the padded bar." },
  { name: "Good Morning", primary_muscle_group: "Hamstrings", secondary_muscle_groups: ["Lower Back", "Glutes"], equipment: "Barbell", tracking_type: "reps", description: "Hinge forward at hips with barbell on upper back." },
  { name: "Glute-Ham Raise", primary_muscle_group: "Hamstrings", secondary_muscle_groups: ["Glutes", "Calves"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Use glute-ham developer to raise torso from horizontal position." },
  { name: "Nordic Hamstring Curl", primary_muscle_group: "Hamstrings", secondary_muscle_groups: ["Calves"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Anchor heels and lower torso forward, curling back up with hamstrings." },

  // Glutes
  { name: "Hip Thrust", primary_muscle_group: "Glutes", secondary_muscle_groups: ["Hamstrings"], equipment: "Barbell", tracking_type: "reps", description: "Thrust hips upward with upper back on a bench and barbell on hips." },
  { name: "Glute Bridge", primary_muscle_group: "Glutes", secondary_muscle_groups: ["Hamstrings"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Lie on back and thrust hips upward, squeezing glutes." },
  { name: "Cable Kickback", primary_muscle_group: "Glutes", secondary_muscle_groups: [], equipment: "Cable", tracking_type: "reps", description: "Kick leg backward against cable resistance." },
  { name: "Sumo Squat", primary_muscle_group: "Glutes", secondary_muscle_groups: ["Quadriceps", "Hamstrings"], equipment: "Dumbbell", tracking_type: "reps", description: "Wide stance squat with toes pointing outward." },
  { name: "Step-ups", primary_muscle_group: "Glutes", secondary_muscle_groups: ["Quadriceps", "Hamstrings"], equipment: "Dumbbell", tracking_type: "reps", description: "Step up onto a bench or box, alternating legs." },
  { name: "Donkey Kicks", primary_muscle_group: "Glutes", secondary_muscle_groups: [], equipment: "Bodyweight", tracking_type: "bodyweight", description: "On all fours, kick one leg back and up, squeezing glutes." },

  // Calves
  { name: "Standing Calf Raise", primary_muscle_group: "Calves", secondary_muscle_groups: [], equipment: "Machine", tracking_type: "reps", description: "Raise heels up while standing on calf raise machine." },
  { name: "Seated Calf Raise", primary_muscle_group: "Calves", secondary_muscle_groups: [], equipment: "Machine", tracking_type: "reps", description: "Raise heels up while seated with weight on thighs." },
  { name: "Donkey Calf Raise", primary_muscle_group: "Calves", secondary_muscle_groups: [], equipment: "Machine", tracking_type: "reps", description: "Bend forward and raise heels with weight on lower back." },
  { name: "Single Leg Calf Raise", primary_muscle_group: "Calves", secondary_muscle_groups: [], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Stand on one leg and raise heel up." },

  // Abs
  { name: "Plank", primary_muscle_group: "Abs", secondary_muscle_groups: ["Lower Back"], equipment: "Bodyweight", tracking_type: "duration", description: "Hold plank position on forearms, keeping body straight." },
  { name: "Crunches", primary_muscle_group: "Abs", secondary_muscle_groups: [], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Lie on back and curl shoulders toward pelvis." },
  { name: "Hanging Leg Raise", primary_muscle_group: "Abs", secondary_muscle_groups: ["Hip Flexors"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Hang from bar and raise legs up to hip level or higher." },
  { name: "Cable Crunch", primary_muscle_group: "Abs", secondary_muscle_groups: [], equipment: "Cable", tracking_type: "reps", description: "Kneel and crunch downward pulling cable rope toward floor." },
  { name: "Ab Wheel Rollout", primary_muscle_group: "Abs", secondary_muscle_groups: ["Lower Back", "Shoulders"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Roll ab wheel forward from kneeling position, extending body." },
  { name: "Russian Twist", primary_muscle_group: "Abs", secondary_muscle_groups: ["Obliques"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Sit and twist torso side to side while holding feet off ground." },
  { name: "Bicycle Crunch", primary_muscle_group: "Abs", secondary_muscle_groups: ["Obliques"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Alternate bringing opposite elbow to knee in a pedaling motion." },
  { name: "Dead Bug", primary_muscle_group: "Abs", secondary_muscle_groups: [], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Lie on back and extend opposite arm and leg while keeping lower back pressed down." },

  // Forearms
  { name: "Wrist Curl", primary_muscle_group: "Forearms", secondary_muscle_groups: [], equipment: "Barbell", tracking_type: "reps", description: "Curl wrist upward with forearms resting on thighs or bench." },
  { name: "Reverse Wrist Curl", primary_muscle_group: "Forearms", secondary_muscle_groups: [], equipment: "Barbell", tracking_type: "reps", description: "Curl wrist backward with palms facing down." },
  { name: "Farmer's Walk", primary_muscle_group: "Forearms", secondary_muscle_groups: ["Traps", "Calves"], equipment: "Dumbbell", tracking_type: "distance", description: "Walk while holding heavy dumbbells in each hand." },

  // Traps
  { name: "Barbell Shrug", primary_muscle_group: "Traps", secondary_muscle_groups: ["Forearms"], equipment: "Barbell", tracking_type: "reps", description: "Shrug shoulders upward toward ears while holding barbell." },
  { name: "Dumbbell Shrug", primary_muscle_group: "Traps", secondary_muscle_groups: ["Forearms"], equipment: "Dumbbell", tracking_type: "reps", description: "Shrug shoulders upward while holding dumbbells at sides." },

  // Lats
  { name: "Wide Grip Pulldown", primary_muscle_group: "Lats", secondary_muscle_groups: ["Biceps"], equipment: "Cable", tracking_type: "reps", description: "Pull cable bar down with wide overhand grip." },
  { name: "Single Arm Pulldown", primary_muscle_group: "Lats", secondary_muscle_groups: ["Biceps"], equipment: "Cable", tracking_type: "reps", description: "Pull cable handle down with one arm for isolated lat work." },

  // Lower Back
  { name: "Back Extension", primary_muscle_group: "Lower Back", secondary_muscle_groups: ["Glutes", "Hamstrings"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Bend forward and extend back up on a hyperextension bench." },
  { name: "Superman", primary_muscle_group: "Lower Back", secondary_muscle_groups: ["Glutes"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Lie face down and lift arms and legs simultaneously." },

  // Full Body
  { name: "Clean and Jerk", primary_muscle_group: "Full Body", secondary_muscle_groups: ["Shoulders", "Quadriceps", "Back"], equipment: "Barbell", tracking_type: "reps", description: "Olympic lift: clean barbell to shoulders, then jerk overhead." },
  { name: "Snatch", primary_muscle_group: "Full Body", secondary_muscle_groups: ["Shoulders", "Quadriceps", "Back"], equipment: "Barbell", tracking_type: "reps", description: "Olympic lift: lift barbell from ground to overhead in one motion." },
  { name: "Thrusters", primary_muscle_group: "Full Body", secondary_muscle_groups: ["Shoulders", "Quadriceps", "Glutes"], equipment: "Barbell", tracking_type: "reps", description: "Squat down then press barbell overhead in one fluid motion." },
  { name: "Burpees", primary_muscle_group: "Full Body", secondary_muscle_groups: ["Chest", "Shoulders", "Quadriceps"], equipment: "Bodyweight", tracking_type: "bodyweight", description: "Drop to push-up position, jump back up, and clap overhead." },
  { name: "Kettlebell Swing", primary_muscle_group: "Full Body", secondary_muscle_groups: ["Glutes", "Hamstrings", "Back"], equipment: "Kettlebell", tracking_type: "reps", description: "Swing kettlebell between legs and up to chest level using hip hinge." },
  { name: "Turkish Get-up", primary_muscle_group: "Full Body", secondary_muscle_groups: ["Shoulders", "Abs", "Glutes"], equipment: "Kettlebell", tracking_type: "reps", description: "Move from lying to standing while holding kettlebell overhead." },

  // Cardio
  { name: "Running", primary_muscle_group: "Cardio", secondary_muscle_groups: ["Quadriceps", "Calves"], equipment: "Bodyweight", tracking_type: "duration", description: "Outdoor or treadmill running for cardiovascular fitness." },
  { name: "Cycling", primary_muscle_group: "Cardio", secondary_muscle_groups: ["Quadriceps", "Hamstrings"], equipment: "Bodyweight", tracking_type: "duration", description: "Stationary or outdoor cycling for cardiovascular fitness." },
  { name: "Rowing Machine", primary_muscle_group: "Cardio", secondary_muscle_groups: ["Back", "Quadriceps"], equipment: "Machine", tracking_type: "duration", description: "Use rowing machine for full-body cardiovascular exercise." },
  { name: "Jump Rope", primary_muscle_group: "Cardio", secondary_muscle_groups: ["Calves"], equipment: "Bodyweight", tracking_type: "duration", description: "Jump over a rope continuously for cardiovascular fitness." },
  { name: "Swimming", primary_muscle_group: "Cardio", secondary_muscle_groups: ["Full Body"], equipment: "Bodyweight", tracking_type: "duration", description: "Swimming laps for cardiovascular and full-body fitness." },
];

async function seed() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables (need SUPABASE_SERVICE_ROLE_KEY for seeding)");
    process.exit(1);
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  const seedData = exercises.map((ex) => ({
    ...ex,
    is_custom: false,
    is_active: true,
  }));

  const { data, error } = await supabase
    .from("exercises")
    .upsert(seedData, { onConflict: "name" });

  if (error) {
    console.error("Error seeding exercises:", error);
    process.exit(1);
  }

  const { count, error: countError } = await supabase
    .from("exercises")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Error counting exercises:", countError);
    process.exit(1);
  }

  console.log(`✅ Seeded ${seedData.length} exercises. Total in database: ${count}`);
}

seed();
