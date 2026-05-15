const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Extract details__extra-images
const extraImagesMatch = html.match(/<div class="details__extra-images">([\s\S]*?)<\/div>\s*<\/div>/);
const extraImagesHTML = `<div class="details__extra-images">${extraImagesMatch[1]}</div>`;

// Extract details__texts
const detailsTextsMatch = html.match(/<div class="details__texts">[\s\S]*?<\/div>/);
const detailsTextsHTML = detailsTextsMatch[0];

// Replace details__body content
const newBodyContent = `
      <div class="details__top-row">
        <div class="details__thumb"></div>
        ${detailsTextsHTML}
      </div>
      ${extraImagesHTML}
`;

html = html.replace(/<div class="details__body">[\s\S]*?<!-- Dấu X để đóng -->/, `<div class="details__body">${newBodyContent}    </div>\n  </div>\n\n  <!-- Dấu X để đóng -->`);

fs.writeFileSync('index.html', html);
console.log("Replaced layout!");
