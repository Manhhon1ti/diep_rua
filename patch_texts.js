const fs = require('fs');

const data = [
  {
    id: 0,
    title: "Rùa hộp trán vàng miền Nam (Cuora picturata)",
    intro: "Còn được gọi là rùa hộp trán vàng hay rùa hộp Việt Nam, là loài rùa hộp đặc hữu của khu vực rừng núi miền Nam Việt Nam. Loài này thuộc họ Geoemydidae và được xem là một trong những loài rùa cạn bán thủy sinh đặc hữu quý hiếm của Việt Nam.",
    dist: "Đây là loài đặc hữu, chỉ được tìm thấy ở vùng núi thuộc các tỉnh Nam Trung Bộ như Phú Yên, Khánh Hòa và Ninh Thuận.",
    features: [
      "<b>Kích thước:</b> Chiều dài mai thẳng có thể đạt từ 15-19 cm.",
      "<b>Mai:</b> Có màu nâu cam đến nâu sẫm, vòm cao, thường có các vệt và đốm đen ở phía rìa.",
      "<b>Đầu và Yếm:</b> Đầu có màu kem hoặc vàng với các đường vân xám nhạt. Yếm màu kem, đặc trưng với một đốm đen lớn trên mỗi tấm yếm.",
      "<b>Phân biệt giới tính:</b> Con đực thường có yếm hơi lõm vào trong, móng và đuôi dài, dày hơn so với con cái."
    ],
    eco: [
      "<b>Sinh cảnh:</b> Sống trong các khu rừng thường xanh ở độ cao từ 300-600m, thường ẩn náu dưới lớp lá mục hoặc trong các bụi cây rậm rạp gần suối.",
      "<b>Thức ăn:</b> Thức ăn chủ yếu là giun đất và các loại côn trùng.",
      "<b>Sinh sản:</b> Mỗi năm, rùa cái chỉ đẻ một lứa từ 1-3 trứng."
    ],
    cons: [
      "<b>Sách Đỏ IUCN:</b> CR (Cực kỳ Nguy cấp)",
      "<b>Sách Đỏ Việt Nam (2024):</b> CR (Cực kỳ Nguy cấp)",
      "<b>Công ước CITES:</b> Phụ lục I (Cấm buôn bán quốc tế)",
      "<b>Pháp luật Việt Nam:</b> Nghị định 64/2019/NĐ-CP & 84/2021/NĐ-CP"
    ]
  },
  {
    id: 1,
    title: "Rùa ba gờ (Malayemys subtrijuga)",
    intro: "Hay còn gọi là Snail-eating turtle, là một loài rùa nước ngọt bản địa của khu vực Đông Nam Á, nổi bật với tính cách hiền lành và khả năng chuyên ăn ốc, nhuyễn thể.",
    dist: "Có mặt rộng rãi ở các hệ sinh thái lưu vực sông Mekong, bao gồm Campuchia, Lào, Thái Lan và miền Nam Việt Nam.",
    features: [
      "<b>Kích thước:</b> Chiều dài trung bình từ 20-25 cm.",
      "<b>Mai:</b> Nổi bật với 3 gờ chạy dọc trên lưng rất rõ nét, mai thường có màu nâu sẫm hoặc nâu gụ.",
      "<b>Đầu:</b> Có các sọc vàng đặc trưng chạy dọc hai bên mắt xuống cổ, rất dễ nhận diện.",
      "<b>Yếm:</b> Yếm màu vàng có các đốm đen viền quanh."
    ],
    eco: [
      "<b>Sinh cảnh:</b> Vùng nước chảy chậm như ao hồ, đầm lầy, kênh rạch và ruộng lúa.",
      "<b>Thức ăn:</b> Đặc thù ăn động vật thân mềm (ốc, trai), đôi khi ăn tôm, cua nhỏ.",
      "<b>Sinh sản:</b> Đẻ từ 3-10 trứng mỗi lứa trong mùa khô."
    ],
    cons: [
      "<b>Sách Đỏ IUCN:</b> NT (Sắp bị đe dọa)",
      "<b>Công ước CITES:</b> Phụ lục II",
      "<b>Đe dọa:</b> Mất môi trường sống do đô thị hóa và bị săn bắt làm thức ăn."
    ]
  },
  {
    id: 2,
    title: "Rùa sao Ấn Độ (Geochelone elegans)",
    intro: "Là một trong những loài rùa cạn có vẻ ngoài lộng lẫy nhất thế giới. Nhờ hoa văn hình ngôi sao rực rỡ trên mai, chúng rất được ưa chuộng trong giới nuôi sinh vật cảnh.",
    dist: "Phân bố chủ yếu tại các vùng khô hạn, trảng cỏ và rừng rụng lá ở Ấn Độ, Pakistan và Sri Lanka.",
    features: [
      "<b>Kích thước:</b> Đạt từ 25-30 cm khi trưởng thành.",
      "<b>Mai:</b> Vòm nhô rất cao. Mỗi tâm vảy mai có một đốm sáng, từ đó tỏa ra các đường sọc vàng trên nền đen tạo thành họa tiết ngôi sao.",
      "<b>Công dụng hoa văn:</b> Họa tiết ngôi sao giúp chúng ngụy trang cực tốt trong các bụi cỏ khô."
    ],
    eco: [
      "<b>Sinh cảnh:</b> Thích nghi với môi trường bán hoang mạc, trảng cỏ khô cằn và rừng khô.",
      "<b>Thức ăn:</b> Chế độ ăn hoàn toàn thực vật, chủ yếu là cỏ khô, hoa, trái cây rụng và lá cây mọng nước.",
      "<b>Tập tính:</b> Hoạt động chủ yếu vào sáng sớm và chiều muộn để tránh cái nóng gay gắt."
    ],
    cons: [
      "<b>Sách Đỏ IUCN:</b> VU (Sắp nguy cấp)",
      "<b>Công ước CITES:</b> Phụ lục I (Cấm buôn bán thương mại quốc tế)",
      "<b>Mối đe dọa chính:</b> Bị săn bắt ráo riết để phục vụ thị trường thú cưng chợ đen."
    ]
  },
  {
    id: 3,
    title: "Rùa cổ rắn (Chelodina longicollis)",
    intro: "Hay rùa cổ dài phương Đông (Eastern long-necked turtle), là một loài rùa thủy sinh cực kỳ độc đáo thuộc nhóm rùa cổ gập (Pleurodira) của châu Úc.",
    dist: "Phân bố rộng rãi ở các vùng nước ngọt phía đông nước Úc, từ Queensland kéo dài xuống Nam Úc.",
    features: [
      "<b>Kích thước:</b> Mai dài khoảng 25-30 cm, nặng trung bình 1.5 - 2 kg.",
      "<b>Đặc điểm cổ:</b> Chiếc cổ có thể dài bằng toàn bộ chiều dài mai. Khác với rùa thường, chúng gập cổ sang một bên để giấu dưới mép mai thay vì rụt thẳng vào trong.",
      "<b>Tự vệ:</b> Khi bị đe dọa, chúng tiết ra một chất dịch có mùi hôi cực kỳ khó chịu từ tuyến hôi ở háng."
    ],
    eco: [
      "<b>Sinh cảnh:</b> Sông suối chảy chậm, đầm lầy, ao hồ nội địa.",
      "<b>Thức ăn:</b> Loài ăn thịt hung dữ. Sử dụng chiếc cổ dài phóng ra như rắn để chộp cá, nòng nọc, và động vật giáp xác nhỏ.",
      "<b>Di cư:</b> Khả năng di chuyển trên cạn rất tốt để tìm kiếm các vũng nước mới vào mùa hạn hán."
    ],
    cons: [
      "<b>Sách Đỏ IUCN:</b> LC (Ít quan tâm)",
      "<b>Tình trạng:</b> Quần thể hiện tại tương đối ổn định, tuy nhiên thường xuyên bị tử vong khi băng qua đường bộ."
    ]
  },
  {
    id: 4,
    title: "Rùa cạn Sulcata (Centrochelys sulcata)",
    intro: "Còn gọi là rùa cạn sa mạc châu Phi, đây là loài rùa cạn lớn thứ ba trên thế giới và lớn nhất trong số các loài rùa ở lục địa châu Phi.",
    dist: "Sinh sống dọc theo rìa phía nam của sa mạc Sahara, trải dài qua khu vực Sahel từ Senegal đến Sudan.",
    features: [
      "<b>Kích thước khủng:</b> Có thể đạt chiều dài mai trên 80 cm và nặng từ 40 đến 100 kg.",
      "<b>Mai và Da:</b> Toàn bộ cơ thể có màu vàng cát hoặc nâu nhạt để phản xạ ánh nắng sa mạc. Lớp vảy sừng mọc nhô ra ở hai chi trước như áo giáp.",
      "<b>Tuổi thọ:</b> Rất cao, có thể sống từ 70 đến hơn 100 năm trong điều kiện chăm sóc tốt."
    ],
    eco: [
      "<b>Sinh cảnh:</b> Thích nghi tuyệt vời với hoang mạc khô hạn và xavan. Chúng đào các hang ngầm rất sâu (tới 15m) để làm nơi trú ẩn, tránh cái nóng đổ lửa.",
      "<b>Thức ăn:</b> Thực vật sa mạc nhiều xơ, cỏ khô, cỏ ba lá và thậm chí ăn cả xương rồng.",
      "<b>Nước:</b> Thu nhận hầu hết nước từ thực phẩm và có thể nhịn uống nước trong nhiều tháng."
    ],
    cons: [
      "<b>Sách Đỏ IUCN:</b> EN (Nguy cấp)",
      "<b>Công ước CITES:</b> Phụ lục II",
      "<b>Vấn đề bảo tồn:</b> Chịu sức ép từ suy thoái môi trường sa mạc, chăn thả gia súc quá mức và bị bắt làm thú cưng."
    ]
  },
  {
    id: 5,
    title: "Rùa hộp lưng đen (Cuora amboinensis)",
    intro: "Một trong những loài rùa nước ngọt và bán thủy sinh phổ biến và quen thuộc nhất ở Đông Nam Á, nổi bật với khả năng đóng kín mai như một chiếc hộp kiên cố.",
    dist: "Phân bố trải dài từ vùng Đông Ấn Độ, qua bán đảo Đông Dương, đến tận các đảo của Indonesia và Philippines.",
    features: [
      "<b>Kích thước:</b> Thường đạt khoảng 15-20 cm, nặng tầm 1.0 - 1.5 kg.",
      "<b>Mai:</b> Vòm hình bán cầu, trơn láng, màu đen bóng hoặc xám sẫm.",
      "<b>Đầu:</b> Đầu đen với 3 dải màu vàng chạy song song kéo dài từ mõm xuống tận cổ.",
      "<b>Yếm khép kín:</b> Yếm bụng có khớp nối (hinge) vô cùng linh hoạt. Khi gặp nguy hiểm, rùa rụt đầu tứ chi vào và khép kín nắp yếm lại, không chừa một khe hở."
    ],
    eco: [
      "<b>Sinh cảnh:</b> Rất đa dạng: từ ao hồ tĩnh lặng, đầm lầy, kênh rạch, cho đến ruộng lúa nước nông.",
      "<b>Thức ăn:</b> Rất phàm ăn và ăn tạp, chúng xơi từ thực vật thủy sinh, nấm, trái cây rụng cho đến côn trùng và cá nhỏ."
    ],
    cons: [
      "<b>Sách Đỏ IUCN:</b> EN (Nguy cấp)",
      "<b>Công ước CITES:</b> Phụ lục II",
      "<b>Tình trạng:</b> Đang bị khai thác cạn kiệt để làm thực phẩm, dược liệu cổ truyền và sinh vật cảnh."
    ]
  },
  {
    id: 6,
    title: "Rùa cá sấu (Macrochelys temminckii)",
    intro: "Được mệnh danh là 'khủng long' của thế giới rùa nước ngọt, loài vật sở hữu ngoại hình gai góc thời tiền sử và lực cắn có thể làm dập nát xương.",
    dist: "Là loài đặc hữu của hệ thống sông ngòi, hồ đầm lầy trải dài khắp khu vực Đông Nam Hoa Kỳ.",
    features: [
      "<b>Kích thước khổng lồ:</b> Mai có thể dài từ 40-80 cm, cá thể đực lớn nhất có thể nặng hơn 100 kg.",
      "<b>Ngoại hình:</b> Sở hữu 3 hàng gai sừng gồ ghề nổi cao dọc trên mai, trông giống hệt như lưng cá sấu.",
      "<b>Đầu và Hàm:</b> Đầu cực lớn không thể rụt hết vào mai. Cặp hàm sắc bén có hình dáng giống mỏ chim ưng với lực cắn khủng khiếp."
    ],
    eco: [
      "<b>Sinh cảnh:</b> Sống ẩn dật dưới đáy các con sông chảy chậm, ao đầm sâu nhiều bùn và cành cây mục.",
      "<b>Thức ăn:</b> Sát thủ phục kích. Nằm bất động há miệng, ngọ nguậy phần phụ thịt trên lưỡi trông như con giun đất để nhử cá. Ăn thịt hầu hết mọi thứ từ cá, rắn, chim nước đến rùa khác."
    ],
    cons: [
      "<b>Sách Đỏ IUCN:</b> VU (Sắp nguy cấp)",
      "<b>Mối đe dọa:</b> Thu hẹp sinh cảnh, đắp đập ngăn sông và săn bắt để lấy thịt."
    ]
  },
  {
    id: 7,
    title: "Rùa Leopard (Stigmochelys pardalis)",
    intro: "Một trong những loài rùa cạn lớn và có hoa văn đẹp nhất ở lục địa châu Phi, được đặt tên theo những đốm màu nổi bật giống hệt bộ lông của loài báo hoa mai.",
    dist: "Sinh sống rải rác khắp các vùng xavan, thảo nguyên khô hạn trải dài từ Đông Phi xuống đến tận Nam Phi.",
    features: [
      "<b>Kích thước:</b> Là loài rùa cạn lớn thứ tư thế giới, dài 40-50 cm và nặng từ 13-18 kg.",
      "<b>Hoa văn:</b> Mai vòm cao hình chuông. Trên nền mai vàng rơm hoặc ngà voi được điểm xuyết bởi các vệt đốm đen bất đối xứng tuyệt đẹp, hoa văn rất sắc nét ở con non.",
      "<b>Phòng vệ:</b> Khi giật mình thường phát ra tiếng rít lớn và phóng nước tiểu nếu bị nhấc lên."
    ],
    eco: [
      "<b>Sinh cảnh:</b> Thảo nguyên khô hạn, vùng bán hoang mạc nơi có nhiều bụi cây gai góc.",
      "<b>Thức ăn:</b> Chế độ ăn 100% thực vật. Rất thích gặm cỏ, ăn các bụi cây gai, trái cây rụng và đặc biệt là các loài cây xương rồng, sen đá mọng nước."
    ],
    cons: [
      "<b>Sách Đỏ IUCN:</b> LC (Ít quan tâm)",
      "<b>Công ước CITES:</b> Phụ lục II",
      "<b>Thực trạng:</b> Số lượng trong tự nhiên khá phong phú, tuy nhiên vẫn cần quản lý nghiêm nạn buôn bán thú cưng quốc tế."
    ]
  }
];

let html = fs.readFileSync('index.html', 'utf8');

// Tìm thẻ details__texts và thay thế
let newTexts = `<div class="details__texts">\n        <!-- 10 khối mô tả tương ứng với 10 ảnh -->\n`;

data.forEach(item => {
  newTexts += `        <p data-desc="${item.id}" data-text>
          ${item.title}, ${item.intro}<br><br>
          <span class="section-title">PHÂN BỐ TỰ NHIÊN</span><br>
          ${item.dist}<br><br>
          <span class="section-title">ĐẶC ĐIỂM NHẬN DẠNG CHÍNH</span><br>
          ${item.features.join('<br>\n          ')}<br><br>
          <span class="section-title">ĐẶC ĐIỂM SINH THÁI</span><br>
          ${item.eco.join('<br>\n          ')}<br><br>
          <span class="section-title">TÌNH TRẠNG BẢO TỒN</span><br>
          ${item.cons.join('<br>\n          ')}
        </p>\n`;
});

newTexts += `      </div>`;

html = html.replace(/<div class="details__texts">[\s\S]*?<\/div>/, newTexts);
fs.writeFileSync('index.html', html);
console.log("Rewrote authentic texts for all turtles!");
