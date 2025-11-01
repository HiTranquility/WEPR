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

document.addEventListener('DOMContentLoaded', function() {
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const courseId = this.dataset.courseId;
      const rating = document.querySelector('input[name="rating"]:checked')?.value;
      const comment = document.querySelector('textarea[name="comment"]').value;
      
      if (!rating) {
        alert('Vui lòng chọn số sao!');
        return;
      }
      
      try {
        const res = await fetch('/student/review/' + courseId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, comment })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) window.location.reload();
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  }
});
