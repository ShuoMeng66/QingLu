import sys, json, subprocess

items = [
    {"kcal": 180, "protein_g": 4, "carb_g": 12, "fat_g": 10},
    {"kcal": 188, "protein_g": 33, "carb_g": 0, "fat_g": 6},
    {"kcal": 110, "protein_g": 18, "carb_g": 3, "fat_g": 2},
    {"kcal": 95, "protein_g": 14, "carb_g": 2, "fat_g": 3},
    {"kcal": 56, "protein_g": 4, "carb_g": 8, "fat_g": 0},
    {"kcal": 35, "protein_g": 1, "carb_g": 6, "fat_g": 0}
]

# Run calc_macros with stdin
p = subprocess.run(
    [sys.executable, "hackathod_skill/base/nutrition-engine/scripts/calc_macros.py", "--meal", "dinner"],
    input=json.dumps(items),
    capture_output=True, text=True, cwd="D:/Hackathod/Agent"
)
print("STDOUT:", p.stdout)
print("STDERR:", p.stderr)
print("RC:", p.returncode)
