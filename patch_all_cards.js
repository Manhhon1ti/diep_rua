const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const turtles = [
  { id: 0, name: "Rùa hộp trán vàng miền Nam (Cuora picturata)" },
  { id: 1, name: "Rùa ba gờ (Snail-eating turtle)" },
  { id: 2, name: "Rùa sao Ấn Độ (Indian Star Tortoise)" },
  { id: 3, name: "Rùa cổ rắn (Snake-necked turtle)" },
  { id: 4, name: "Rùa cạn Sulcata (African Spurred Tortoise)" },
  { id: 5, name: "Rùa hộp lưng đen (Cuora amboinensis)" },
  { id: 6, name: "Rùa cá sấu (Alligator Snapping)" },
  { id: 7, name: "Rùa Leopard (Leopard Tortoise)" }
];

let newTexts = `<div class="details__texts">\n        <!-- 10 khối mô tả tương ứng với 10 ảnh -->\n`;

turtles.forEach(t => {
  newTexts += `        <p data-desc="${t.id}" data-text>
          ${t.name}, một trong những loài rùa cạn bán thủy sinh đặc hữu quý hiếm. Loài này thuộc họ Geoemydidae và có giá trị bảo tồn rất cao.<br><br>
          <span class="section-title">PHÂN BỐ TỰ NHIÊN</span><br>
          Đây là loài đặc hữu, chủ yếu được tìm thấy ở các vùng sinh thái đặc trưng phù hợp với tập tính của chúng.<br><br>
          <span class="section-title">ĐẶC ĐIỂM NHẬN DẠNG CHÍNH</span><br>
          <b>Kích thước:</b> Chiều dài mai thẳng có thể đạt từ 15-30 cm.<br>
          <b>Mai:</b> Có cấu trúc đặc trưng, vòm cao hoặc phẳng tùy loài, thường có các vệt và đốm hoa văn để ngụy trang.<br>
          <b>Đầu và Yếm:</b> Màu sắc và cấu trúc đa dạng giúp phân biệt giới tính và độ tuổi.<br>
          <b>Phân biệt giới tính:</b> Con đực thường có yếm lõm, đuôi dài và dày hơn con cái.<br><br>
          <span class="section-title">ĐẶC ĐIỂM SINH THÁI</span><br>
          <b>Sinh cảnh:</b> Môi trường sống đa dạng từ đầm lầy, nước ngọt đến hoang mạc và thảo nguyên.<br>
          <b>Thức ăn:</b> Thức ăn chủ yếu là thực vật, giun đất, và côn trùng.<br>
          <b>Sinh sản:</b> Sinh sản theo mùa, số lượng trứng phụ thuộc vào loài và kích thước cơ thể.<br><br>
          <span class="section-title">TÌNH TRẠNG BẢO TỒN</span><br>
          <b>Sách Đỏ IUCN:</b> Đang được đánh giá mức độ nguy cấp<br>
          <b>Công ước CITES:</b> Quản lý nghiêm ngặt việc buôn bán<br>
          <b>Pháp luật:</b> Được bảo vệ bởi luật pháp quốc tế và các nghị định địa phương
        </p>\n`;
});

newTexts += `      </div>`;

// Replace details__texts
html = html.replace(/<div class="details__texts">[\s\S]*?<\/div>/, newTexts);

let galleriesHTML = `      <div class="details__galleries">\n`;
for(let i=0; i<=7; i++) {
  galleriesHTML += `        <div class="gallery" data-gallery="${i}">
          <img src="./assets/img/web_rua-01.webp" alt="Gallery 1">
          <img src="./assets/img/web_rua-02.webp" alt="Gallery 2">
          <img src="./assets/img/web_rua-03.webp" alt="Gallery 3">
          <img src="./assets/img/web_rua-04.webp" alt="Gallery 4">
          <img src="./assets/img/web_rua-05.webp" alt="Gallery 5">
          <img src="./assets/img/web_rua-06.webp" alt="Gallery 6">
        </div>\n`;
}
galleriesHTML += `      </div>`;

// Replace details__galleries
html = html.replace(/<div class="details__galleries">[\s\S]*?<\/div>\s*<\/div>/, galleriesHTML + "\n    </div> <!-- end details__body -->");

fs.writeFileSync('index.html', html);
console.log("Updated texts and galleries!");
