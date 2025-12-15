const fs = require('fs');

const html = fs.readFileSync('ui.html', 'utf8');
const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);

if (scriptMatch) {
  fs.writeFileSync('extracted_js.js', scriptMatch[1]);
  console.log('JavaScript extrait dans extracted_js.js');
} else {
  console.log('Aucun script trouvé');
}



