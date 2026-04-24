/**
 * Kiểm tra quyền sử dụng lệnh
 * So sánh role của user với danh sách role được phép trong config
 */

function kiemTraQuyen(thanhVien, danhSachRoleId) {
    if (!thanhVien || !thanhVien.roles) return false;
    return thanhVien.roles.cache.some(role => danhSachRoleId.includes(role.id));
}

module.exports = { kiemTraQuyen };
