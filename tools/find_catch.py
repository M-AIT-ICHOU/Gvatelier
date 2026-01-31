import sys
p = 'tmp_served.js'
with open(p, 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines, 1):
    if 'catch' in l:
        start = max(1, i-3)
        end = min(len(lines), i+3)
        print('---', i, '---')
        for j in range(start, end+1):
            print(f'{j:4}: {lines[j-1].rstrip()}')
        print()
