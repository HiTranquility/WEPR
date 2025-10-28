export const mockUsers = [
  { id: 1, role: "admin", name: "Admin One", email: "admin@example.com", password: "123456" },
  { id: 2, role: "teacher", name: "Teacher Tina", email: "teacher@example.com", password: "123456" },
  { id: 3, role: "student", name: "Student Sam", email: "student@example.com", password: "123456" },
];

export function findUser(email, password) {
  return mockUsers.find((u) => u.email === email && u.password === password) || null;
}
