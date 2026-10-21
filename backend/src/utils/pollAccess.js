export const canAccessPoll = (poll, user) => {
  if (user?.id === poll.organizerId) {
    return true;
  }

  if (poll.status !== 'ACTIVE') {
    return false;
  }

  return poll.isPublic || Boolean(user);
};
