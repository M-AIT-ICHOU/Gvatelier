Split CSV instructions

If your large CSV is tracked with Git LFS and you want to include the data directly in the repo by splitting it into smaller files, use one of the scripts in `scripts/`.

Bash (Linux/macOS/WSL):

1. Make the script executable:

```bash
chmod +x scripts/split_csv.sh
```

2. Run (example splitting into 3 parts):

```bash
./scripts/split_csv.sh static/data/MENSQ_all_1950_2023_cleaned.csv 3 static/data/MENSQ_all_1950_2023_cleaned
```

This will create `static/data/MENSQ_all_1950_2023_cleaned_part1.csv`, `_part2.csv`, etc.

PowerShell (Windows):

```powershell
.\scripts\split_csv.ps1 -InputPath static\data\MENSQ_all_1950_2023_cleaned.csv -Parts 3 -OutPrefix static\data\MENSQ_all_1950_2023_cleaned
```

After creating parts:

- Ensure these files are not tracked by Git LFS. If the original was tracked by LFS you may need to:

```bash
git lfs untrack "static/data/MENSQ_all_1950_2023_cleaned.csv"
# remove pointer cached file if present
git rm --cached static/data/MENSQ_all_1950_2023_cleaned.csv
# add new parts
git add static/data/MENSQ_all_1950_2023_cleaned_part*.csv .gitattributes
git commit -m "Add CSV split parts and stop tracking original with LFS"
git push origin main
```

Finally, `app_v2.js` will attempt to detect a pointer file and automatically try `*_partX.csv` or `_X.csv` variants. If you commit parts with that naming the client should load them automatically.
