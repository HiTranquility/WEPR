import hbs_sections from 'express-handlebars-sections';

export const hbsHelpers = {
  fill_section: hbs_sections(),
  formatNumber(value) {
    return new Intl.NumberFormat('vi-VN').format(value);
  },
  formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  },
  eq(a, b) {
    return a === b;
  },
  gt(a, b) {
    return a > b;
  },
  calculateDiscount(price, discountPrice) {
    if (!discountPrice || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  },
  isNew(createdAt) {
    const days = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
    return days < 7;
  },
  isBestSeller(enrollmentCount) {
    return enrollmentCount > 1000;
  },
  hasDiscount(price, discountPrice) {
    return discountPrice && discountPrice < price;
  },
  truncate(str, length) {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
  },
  formatDate(date) {
    if (!date) return '';
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  },
  repeat(count) {
    return '⭐'.repeat(count);
  },
  lt(a, b) {
    return a < b;
  },
  ne(a, b) {
    return a !== b;
  },
  math(l, op, r) {
    const left = Number(l);
    const right = Number(r);
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right !== 0 ? left / right : 0;
      default: return 0;
    }
  },
  loopTimes(n, block) {
    let out = '';
    for (let i = 0; i < n; i++) out += block.fn(i);
    return out;
  },
  range(start, end) {
    const arr = [];
    for (let i = Number(start); i <= Number(end); i++) {
      arr.push(i);
    }
    return arr;
  },
  getBadgeClass(badge) {
    if (!badge) return '';
    return 'badge-' + badge;
  },
  getBadgeText(badge) {
    const badges = {
      'featured': 'Nổi bật',
      'new': 'Mới',
      'discount': 'Giảm giá',
      'bestseller': 'Bán chạy'
    };
    return badges[badge] || '';
  },
  hasBadge(badge) {
    return badge && badge.length > 0;
  },
  courseStatusLabel(status) {
    switch ((status || '').toLowerCase()) {
      case 'published':
      case 'completed':
        return 'Đã xuất bản';
      case 'draft':
        return 'Bản nháp';
      case 'suspended':
        return 'Đã đình chỉ';
      case 'incomplete':
        return 'Chưa hoàn thành';
      default:
        return status || 'Không xác định';
    }
  },
  courseStatusClass(status) {
    switch ((status || '').toLowerCase()) {
      case 'published':
      case 'completed':
        return 'badge bg-success';
      case 'draft':
        return 'badge bg-warning text-dark';
      case 'suspended':
        return 'badge bg-danger';
      case 'incomplete':
      default:
        return 'badge bg-secondary';
    }
  },
  json(value) {
    try {
      return JSON.stringify(value ?? null);
    } catch (err) {
      return 'null';
    }
  }
};
export default hbsHelpers;