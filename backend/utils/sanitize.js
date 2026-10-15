export function publicUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  const { passwordHash, __v, ...safe } = obj;
  return safe;
}
