document.addEventListener('DOMContentLoaded', function() {
  const toggleUserBtns = document.querySelectorAll('.btn-toggle-user-status');
  toggleUserBtns.forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      const userId = this.dataset.userId;
      const status = this.dataset.status;
      const action = status === 'active' ? 'khóa' : 'mở khóa';
      if (!confirm(`${action} tài khoản này?`)) return;
      try {
        const res = await fetch(`/admin/users/${userId}/toggle-status`, { method: 'POST' });
        const data = await res.json();
        alert(data.message);
        if (data.success) window.location.reload();
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  });

  const promoteBtns = document.querySelectorAll('.btn-promote-teacher');
  promoteBtns.forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      const userId = this.dataset.userId;
      if (!confirm('Cấp quyền giảng viên?')) return;
      try {
        const res = await fetch(`/admin/users/${userId}/promote`, { method: 'POST' });
        const data = await res.json();
        alert(data.message);
        if (data.success) window.location.reload();
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  });

  const toggleCourseBtns = document.querySelectorAll('.btn-toggle-course-status');
  toggleCourseBtns.forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      const courseId = this.dataset.courseId;
      const status = this.dataset.status;
      const action = status === 'completed' ? 'đình chỉ' : 'kích hoạt';
      if (!confirm(`${action} khóa học?`)) return;
      try {
        const res = await fetch(`/admin/courses/${courseId}/toggle-status`, { method: 'POST' });
        const data = await res.json();
        alert(data.message);
        if (data.success) window.location.reload();
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  });
});
