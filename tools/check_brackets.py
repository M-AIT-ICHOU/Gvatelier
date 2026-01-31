import sys
from pathlib import Path

if len(sys.argv) < 2:
    print('Usage: python check_brackets.py <file.js>')
    sys.exit(2)

p = Path(sys.argv[1])
if not p.exists():
    print('File not found:', p)
    sys.exit(2)

s = p.read_text(encoding='utf-8')
stack = []
line = 1
col = 0
i = 0
state = 'normal'
strchar = None
while i < len(s):
    ch = s[i]
    col += 1
    if ch == '\n':
        line += 1
        col = 0
        if state == 'linecomment':
            state = 'normal'
        i += 1
        continue
    if state == 'normal':
        # detect comment start
        if ch == '/' and i+1 < len(s) and s[i+1] == '/':
            state = 'linecomment'; i += 2; col += 1; continue
        if ch == '/' and i+1 < len(s) and s[i+1] == '*':
            state = 'blockcomment'; i += 2; col += 1; continue
        if ch in ('"', "'", '`'):
            state = 'string'; strchar = ch; i += 1; continue
        if ch in '([{':
            stack.append((ch, line, col))
        elif ch in ')]}':
            if not stack:
                print('UNMATCHED CLOSING', ch, 'at', line, col)
                sys.exit(3)
            top, tl, tc = stack.pop()
            pairs = {'(':')','[':']','{':'}'}
            if pairs.get(top) != ch:
                print('MISMATCH', top, 'opened at', tl, tc, 'but closed by', ch, 'at', line, col)
                sys.exit(4)
    elif state == 'string':
        if ch == '\\':
            i += 2; col += 1; continue
        if ch == strchar:
            state = 'normal'; strchar = None; i += 1; continue
    elif state == 'blockcomment':
        if ch == '*' and i+1 < len(s) and s[i+1] == '/':
            state = 'normal'; i += 2; col += 1; continue
    elif state == 'linecomment':
        # handled at newline
        i += 1
        continue
    i += 1

if state == 'string':
    print('Unterminated string starting with', strchar)
    sys.exit(5)
if state == 'blockcomment':
    print('Unterminated block comment')
    sys.exit(6)
if stack:
    print('UNMATCHED OPENING', stack[-1][0], 'opened at', stack[-1][1], stack[-1][2])
    sys.exit(7)
print('BRACKETS_OK')
sys.exit(0)
