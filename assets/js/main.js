// ============================================================
// main.js — File JavaScript chính
// ============================================================

// Kiểm tra JS đã được load thành công
console.log('✅ main.js đã được load thành công!');

// ============================================================
// DOMContentLoaded — Chờ HTML load xong mới chạy JS
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  console.log('✅ DOM đã sẵn sàng!');

  // --------------------------------------------------------
  // Khởi tạo các chức năng tại đây
  // --------------------------------------------------------

  // initNavbar();      // Ví dụ: khởi tạo navbar
  // initSlider();      // Ví dụ: khởi tạo slider
  // initAnimations();  // Ví dụ: khởi tạo animation

});

// ============================================================
// FUNCTIONS — Định nghĩa các hàm bên dưới
// ============================================================

// Ví dụ: hàm navbar toggle (xóa hoặc sửa theo ý bạn)
// function initNavbar() {
//   const toggle = document.querySelector('#nav-toggle');
//   const menu   = document.querySelector('#nav-menu');
//   if (!toggle || !menu) return;
//   toggle.addEventListener('click', () => menu.classList.toggle('open'));
// }

// Thêm các hàm khác bên dưới...
