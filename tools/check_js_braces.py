import sys
path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as f:
    s = f.read()
stack = []
pairs = {'{':'}','(':')','[':']'}
line = 1
col = 0
issues = []
for i,ch in enumerate(s):
    col += 1
    if ch == '\n':
        line += 1
        col = 0
        continue
    if ch in pairs:
        stack.append((ch,line,col))
    elif ch in pairs.values():
        if not stack:
            issues.append((line,col,'closing without opening',ch))
        else:
            last, lline, lcol = stack[-1]
            if pairs[last] == ch:
                stack.pop()
            else:
                issues.append((line,col,'mismatch',last, pairs[last], ch))
if stack:
    for ch, lline, lcol in stack:
        issues.append((lline,lcol,'unclosed',ch))
print('issues_count=', len(issues))
for it in issues[:200]:
    print(it)
if issues:
    sys.exit(2)
else:
    print('No issues found')
