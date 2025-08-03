#!/usr/bin/env python3
"""
Dead code removal script for BoxdBuddies Phase 4 Code Quality
Removes all functions marked with #[allow(dead_code)]
"""

import re

def remove_dead_code_functions(content):
    """Remove all functions marked with #[allow(dead_code)]"""
    
    # Track whether we're inside a dead function
    lines = content.split('\n')
    result_lines = []
    inside_dead_function = False
    brace_count = 0
    skip_next_function = False
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this line has #[allow(dead_code)]
        if '#[allow(dead_code)]' in line:
            # Skip this line and mark to skip the next function
            skip_next_function = True
            i += 1
            continue
            
        # Check if we're starting a function after seeing #[allow(dead_code)]
        if skip_next_function and line.strip().startswith('fn ') or line.strip().startswith('async fn '):
            inside_dead_function = True
            skip_next_function = False
            brace_count = 0
            i += 1
            continue
            
        # If we're inside a dead function, count braces to find the end
        if inside_dead_function:
            brace_count += line.count('{')
            brace_count -= line.count('}')
            
            # If brace count reaches 0, we've reached the end of the function
            if brace_count <= 0:
                inside_dead_function = False
            i += 1
            continue
            
        # If we're not in a dead function, keep the line
        result_lines.append(line)
        i += 1
    
    return '\n'.join(result_lines)

# Read the file
with open('src-tauri/src/main.rs', 'r') as f:
    content = f.read()

# Remove dead code
clean_content = remove_dead_code_functions(content)

# Write back to file
with open('src-tauri/src/main.rs', 'w') as f:
    f.write(clean_content)

print("✅ Dead code removal complete!")
print("📊 Original lines:", len(content.split('\n')))
print("📊 Clean lines:", len(clean_content.split('\n')))
print("📊 Lines removed:", len(content.split('\n')) - len(clean_content.split('\n')))
