document.addEventListener('DOMContentLoaded', function() {
  const enrollBtns = document.querySelectorAll('.btn-enroll');
  enrollBtns.forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      const courseId = this.dataset.courseId;
      if (!confirm('Bạn có chắc muốn đăng ký khóa học này?')) return;
      try {
        const res = await fetch(`/student/enroll/${courseId}`, { method: 'POST' });
        const data = await res.json();
        alert(data.message);
        if (data.success) window.location.href = '/student/my-courses';
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  });

  const wishlistBtns = document.querySelectorAll('.btn-wishlist');
  wishlistBtns.forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      const courseId = this.dataset.courseId;
      try {
        const res = await fetch(`/student/watchlist/${courseId}`, { method: 'POST' });
        const data = await res.json();
        alert(data.message);
        if (data.success) this.textContent = '❤️ Đã thêm';
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  });

  const removeWatchlistBtns = document.querySelectorAll('.btn-remove-watchlist');
  removeWatchlistBtns.forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      const courseId = this.dataset.courseId;
      if (!confirm('Xóa khỏi danh sách yêu thích?')) return;
      try {
        const res = await fetch(`/student/watchlist/${courseId}`, { method: 'DELETE' });
        const data = await res.json();
        alert(data.message);
        if (data.success) window.location.reload();
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  });
});
