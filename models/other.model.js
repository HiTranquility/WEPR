import database from "../utils/database.js";

export const baseQuery = database("email_verifications");

//=================
// EMAIL VERIFICATION - CRUD
//=================

// Tạo yêu cầu xác thực mới (tạo OTP)
export const createEmailVerification = async (data) => {
  return await baseQuery.insert(data).returning("*");
};

// Lấy thông tin xác thực theo ID
export const readEmailVerification = async (id) => {
  return await baseQuery.where("id", id).first();
};

// Cập nhật trạng thái (ví dụ: đã xác thực)
export const updateEmailVerification = async (id, data) => {
  return await baseQuery.where("id", id).update(data).returning("*");
};

// Xóa yêu cầu xác thực (thường dùng để dọn dẹp OTP cũ)
export const deleteEmailVerification = async (id) => {
  return await baseQuery.where("id", id).del();
};

// Lấy tất cả yêu cầu xác thực (chủ yếu để debug/admin)
export const getAllEmailVerifications = async () => {
  return await baseQuery.select("*").orderBy("created_at", "desc");
};

//=================
// CUSTOM LOGIC
//=================

// Tìm OTP theo email
export const findVerificationByEmail = async (email) => {
  return await baseQuery
    .clone()
    .where("email", email)
    .orderBy("created_at", "desc")
    .first();
};

// Kiểm tra OTP hợp lệ (email + mã + chưa hết hạn + chưa xác minh)
export const verifyOTP = async (email, otp) => {
  const now = new Date();
  const record = await baseQuery
    .clone()
    .where({ email, otp_code: otp, verified: false })
    .andWhere("expires_at", ">", now)
    .first();

  if (!record) return null;

  // Cập nhật trạng thái verified = true
  await baseQuery.where("id", record.id).update({ verified: true });
  return { ...record, verified: true };
};

// Xóa OTP đã hết hạn
export const deleteExpiredOTPs = async () => {
  const now = new Date();
  return await baseQuery.where("expires_at", "<", now).del();
};