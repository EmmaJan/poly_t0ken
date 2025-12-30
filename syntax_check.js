const fs = require('fs');
const content = fs.readFileSync('/Users/polyconseil/Desktop/emma-plugin-dev/code.js', 'utf8');

try {
    // Try to wrap in a function to allow return statements if any
    new Function(content);
    console.log('✅ Syntax OK');
} catch (e) {
    console.log('❌ Syntax Error:', e.message);

    // Try to find the location
    // Note: 'new Function' might report line numbers relative to the wrapper
    // Let's try to parse with a parser if possible, or just crude check

    // Crude brace check
    let depth = 0;
    let lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Remove comments
        const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');

        for (let char of cleanLine) {
            if (char === '{') depth++;
            if (char === '}') depth--;
        }
        if (depth < 0) {
            console.log(`First Extra closing brace at line ${i + 1}`);
            break;
        }
    }
    if (depth > 0) {
        console.log(`Unclosed braces at end: ${depth}`);
    }
}
