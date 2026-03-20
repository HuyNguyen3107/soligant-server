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

  // ── Quản lý ưu đãi ────────────────────────────────────────────────────────
  {
    key: 'promotions.view',
    label: 'Xem danh sách ưu đãi',
    group: 'Quản lý ưu đãi',
  },
  {
    key: 'promotions.create',
    label: 'Tạo ưu đãi mới',
    group: 'Quản lý ưu đãi',
  },
  {
    key: 'promotions.edit',
    label: 'Chỉnh sửa ưu đãi',
    group: 'Quản lý ưu đãi',
  },
  {
    key: 'promotions.delete',
    label: 'Xóa ưu đãi',
    group: 'Quản lý ưu đãi',
  },

  // ── Quản lý Option mua thêm ───────────────────────────────────────────────
  {
    key: 'addon-options.view',
    label: 'Xem danh sách option mua thêm',
    group: 'Option mua thêm',
  },
  {
    key: 'addon-options.create',
    label: 'Tạo option mua thêm',
    group: 'Option mua thêm',
  },
  {
    key: 'addon-options.edit',
    label: 'Chỉnh sửa option mua thêm',
    group: 'Option mua thêm',
  },
  {
    key: 'addon-options.delete',
    label: 'Xóa option mua thêm',
    group: 'Option mua thêm',
  },

  // ── Quản lý thông tin khách hàng ─────────────────────────────────────────
  {
    key: 'customer-order-fields.view',
    label: 'Xem cấu hình form thông tin khách hàng',
    group: 'Thông tin khách hàng',
  },
  {
    key: 'customer-order-fields.edit',
    label: 'Chỉnh sửa cấu hình form thông tin khách hàng',
    group: 'Thông tin khách hàng',
  },

  // ── Quản lý đơn hàng ───────────────────────────────────────────────────────
  {
    key: 'orders.view',
    label: 'Xem danh sách đơn hàng',
    group: 'Đơn hàng',
  },
  {
    key: 'orders.edit',
    label: 'Cập nhật trạng thái đơn hàng',
    group: 'Đơn hàng',
  },

  // ── Quản lý feedback ─────────────────────────────────────────────────────
  {
    key: 'feedbacks.view',
    label: 'Xem danh sách feedback',
    group: 'Quản lý Feedback',
  },
  {
    key: 'feedbacks.create',
    label: 'Tạo feedback mới',
    group: 'Quản lý Feedback',
  },
  {
    key: 'feedbacks.edit',
    label: 'Cập nhật feedback',
    group: 'Quản lý Feedback',
  },
  {
    key: 'feedbacks.delete',
    label: 'Xóa feedback',
    group: 'Quản lý Feedback',
  },

  // ── Quản lý kho ───────────────────────────────────────────────────────────
  {
    key: 'inventory.view',
    label: 'Xem tồn kho sản phẩm',
    group: 'Quản lý kho',
  },
  {
    key: 'inventory.edit',
    label: 'Cập nhật tồn kho sản phẩm',
    group: 'Quản lý kho',
  },

  // ── Quản lý Chủ đề Background ────────────────────────────────────────────────────────
  {
    key: 'background-themes.view',
    label: 'Xem danh sách',
    group: 'Quản lý Chủ đề Background',
  },
  {
    key: 'background-themes.create',
    label: 'Tạo chủ đề background mới',
    group: 'Quản lý Chủ đề Background',
  },
  {
    key: 'background-themes.edit',
    label: 'Chỉnh sửa chủ đề background',
    group: 'Quản lý Chủ đề Background',
  },
  {
    key: 'background-themes.delete',
    label: 'Xóa chủ đề background',
    group: 'Quản lý Chủ đề Background',
  },

  // ── Quản lý Background ────────────────────────────────────────────────────────
  {
    key: 'backgrounds.view',
    label: 'Xem danh sách',
    group: 'Quản lý Backgrounds',
  },
  {
    key: 'backgrounds.create',
    label: 'Tạo background mới',
    group: 'Quản lý Backgrounds',
  },
  {
    key: 'backgrounds.edit',
    label: 'Chỉnh sửa background',
    group: 'Quản lý Backgrounds',
  },
  {
    key: 'backgrounds.delete',
    label: 'Xóa background',
    group: 'Quản lý Backgrounds',
  },

  // ── Quản lý Gấu ───────────────────────────────────────────────────────────
  {
    key: 'bear-variants.view',
    label: 'Xem danh sách biến thể gấu',
    group: 'Quản lý Gấu',
  },
  {
    key: 'bear-variants.create',
    label: 'Tạo biến thể gấu',
    group: 'Quản lý Gấu',
  },
  {
    key: 'bear-variants.edit',
    label: 'Chỉnh sửa biến thể gấu',
    group: 'Quản lý Gấu',
  },
  {
    key: 'bear-variants.delete',
    label: 'Xóa biến thể gấu',
    group: 'Quản lý Gấu',
  },
  {
    key: 'bear-customizations.view',
    label: 'Xem tùy chỉnh Gấu',
    group: 'Quản lý Gấu',
  },
  {
    key: 'bear-customizations.create',
    label: 'Tạo tùy chỉnh Gấu',
    group: 'Quản lý Gấu',
  },
  {
    key: 'bear-customizations.edit',
    label: 'Cập nhật tùy chỉnh Gấu',
    group: 'Quản lý Gấu',
  },
  {
    key: 'bear-customizations.delete',
    label: 'Xóa tùy chỉnh Gấu',
    group: 'Quản lý Gấu',
  },

  // ── Thêm nhóm quyền mới ở đây khi phát triển thêm tính năng ───────────────
];
