/**
 * DANH SÁCH QUYỀN HỆ THỐNG
 * ─────────────────────────────────────────────────────────────────────────────
 * Mỗi khi thêm tính năng mới vào trang quản trị, hãy thêm quyền tương ứng vào
 * mảng SYSTEM_PERMISSIONS bên dưới. Seeder sẽ tự động đồng bộ vào database khi
 * khởi động ứng dụng:  nếu quyền chưa tồn tại → tạo mới; nếu đã tồn tại →
 * cập nhật label/group.
 *
 * Format: { key: 'module.action', label: 'Mô tả', group: 'Nhóm tính năng' }
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface PermissionDef {
  key: string;
  label: string;
  group: string;
}

export const SYSTEM_PERMISSIONS: PermissionDef[] = [
  // ── Dashboard ──────────────────────────────────────────────────────────────
  {
    key: 'dashboard.view',
    label: 'Xem dashboard & thống kê',
    group: 'Dashboard',
  },

  // ── Quản lý người dùng ─────────────────────────────────────────────────────
  {
    key: 'users.view',
    label: 'Xem danh sách người dùng',
    group: 'Quản lý người dùng',
  },
  {
    key: 'users.create',
    label: 'Tạo người dùng mới',
    group: 'Quản lý người dùng',
  },
  {
    key: 'users.edit',
    label: 'Chỉnh sửa thông tin người dùng',
    group: 'Quản lý người dùng',
  },
  {
    key: 'users.delete',
    label: 'Xóa người dùng',
    group: 'Quản lý người dùng',
  },
  {
    key: 'users.change-role',
    label: 'Thay đổi vai trò người dùng (admin/user)',
    group: 'Quản lý người dùng',
  },

  // ── Vai trò & Quyền hạn ────────────────────────────────────────────────────
  {
    key: 'roles.view',
    label: 'Xem danh sách vai trò',
    group: 'Vai trò & Quyền hạn',
  },
  {
    key: 'roles.create',
    label: 'Tạo vai trò mới',
    group: 'Vai trò & Quyền hạn',
  },
  {
    key: 'roles.edit',
    label: 'Chỉnh sửa vai trò',
    group: 'Vai trò & Quyền hạn',
  },
  {
    key: 'roles.delete',
    label: 'Xóa vai trò',
    group: 'Vai trò & Quyền hạn',
  },
  {
    key: 'roles.assign-permissions',
    label: 'Gán quyền cho vai trò',
    group: 'Vai trò & Quyền hạn',
  },
  {
    key: 'permissions.view',
    label: 'Xem danh sách quyền hệ thống',
    group: 'Vai trò & Quyền hạn',
  },

  // ── Quản lý bộ sưu tập ────────────────────────────────────────────────────
  {
    key: 'collections.view',
    label: 'Xem danh sách bộ sưu tập',
    group: 'Quản lý bộ sưu tập',
  },
  {
    key: 'collections.create',
    label: 'Tạo bộ sưu tập mới',
    group: 'Quản lý bộ sưu tập',
  },
  {
    key: 'collections.edit',
    label: 'Chỉnh sửa bộ sưu tập',
    group: 'Quản lý bộ sưu tập',
  },
  {
    key: 'collections.delete',
    label: 'Xóa bộ sưu tập',
    group: 'Quản lý bộ sưu tập',
  },

  // ── Quản lý khung Lego ───────────────────────────────────────────────────
  {
    key: 'lego-frames.view',
    label: 'Xem danh sách biến thể khung Lego',
    group: 'Khung tranh Lego',
  },
  {
    key: 'lego-frames.create',
    label: 'Tạo biến thể khung Lego',
    group: 'Khung tranh Lego',
  },
  {
    key: 'lego-frames.edit',
    label: 'Chỉnh sửa biến thể khung Lego',
    group: 'Khung tranh Lego',
  },
  {
    key: 'lego-frames.delete',
    label: 'Xóa biến thể khung Lego',
    group: 'Khung tranh Lego',
  },

  // ── Danh mục sản phẩm ────────────────────────────────────────────────────
  {
    key: 'product-categories.view',
    label: 'Xem danh mục sản phẩm',
    group: 'Danh mục sản phẩm',
  },
  {
    key: 'product-categories.create',
    label: 'Tạo danh mục sản phẩm',
    group: 'Danh mục sản phẩm',
  },
  {
    key: 'product-categories.edit',
    label: 'Chỉnh sửa danh mục sản phẩm',
    group: 'Danh mục sản phẩm',
  },
  {
    key: 'product-categories.delete',
    label: 'Xóa danh mục sản phẩm',
    group: 'Danh mục sản phẩm',
  },

  // ── Tùy chỉnh Lego ───────────────────────────────────────────────────────
  {
    key: 'lego-customizations.view',
    label: 'Xem nhóm và lựa chọn tùy chỉnh Lego',
    group: 'Tùy chỉnh Lego',
  },
  {
    key: 'lego-customizations.create',
    label: 'Tạo nhóm và lựa chọn tùy chỉnh Lego',
    group: 'Tùy chỉnh Lego',
  },
  {
    key: 'lego-customizations.edit',
    label: 'Chỉnh sửa nhóm và lựa chọn tùy chỉnh Lego',
    group: 'Tùy chỉnh Lego',
  },
  {
    key: 'lego-customizations.delete',
    label: 'Xóa nhóm và lựa chọn tùy chỉnh Lego',
    group: 'Tùy chỉnh Lego',
  },

  // ── Thêm nhóm quyền mới ở đây khi phát triển thêm tính năng ───────────────
];
