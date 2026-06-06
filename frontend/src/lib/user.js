/** Normalize user id from login/me responses (id vs _id, string vs ObjectId). */
export function getUserId(user) {
  if (!user) return null
  const id = user.id ?? user._id
  return id != null ? String(id) : null
}

export function isSameUser(user, entityUserId) {
  const currentId = getUserId(user)
  if (!currentId || entityUserId == null) return false
  return currentId === String(entityUserId)
}
