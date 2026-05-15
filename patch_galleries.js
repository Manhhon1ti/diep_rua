const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const galleriesHTML = `
      <div class="details__galleries">
        <div class="gallery" data-gallery="0">
          <img src="./assets/img/web_rua-01.webp" alt="Gallery 1">
          <img src="./assets/img/web_rua-02.webp" alt="Gallery 2">
          <img src="./assets/img/web_rua-03.webp" alt="Gallery 3">
          <img src="./assets/img/web_rua-04.webp" alt="Gallery 4">
          <img src="./assets/img/web_rua-05.webp" alt="Gallery 5">
          <img src="./assets/img/web_rua-06.webp" alt="Gallery 6">
        </div>
      </div>
    </div> <!-- end details__body -->
`;

html = html.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<!-- Dấu X để đóng -->/s, `</div>\n${galleriesHTML}\n  </div>\n\n  <!-- Dấu X để đóng -->`);

// Đổi thẻ <p> thành <div> cho tất cả các data-desc để không vi phạm HTML rules nếu cần,
// Hoặc cứ giữ nguyên vì gallery đã nằm ở cấp cha details__body.
fs.writeFileSync('index.html', html);
console.log("Galleries added!");
