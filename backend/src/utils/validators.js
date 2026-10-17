export const validateEmail = (email) => {
  if (typeof email !== 'string') {
    return false;
  }

  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePollInput = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['Poll data must be an object.'];
  }

  const errors = [];

  if (typeof data.title !== 'string' || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters.');
  }
  if (typeof data.title === 'string' && data.title.length > 200) {
    errors.push('Title must be 200 characters or fewer.');
  }
  if (data.maxVotes !== undefined && data.maxVotes !== null && data.maxVotes !== '') {
    const maxVotesNum = Number(data.maxVotes);
    if (!Number.isInteger(maxVotesNum) || maxVotesNum < 1) {
      errors.push('Max votes must be a positive whole number.');
    }
  }

  if (!Array.isArray(data.options) || data.options.length < 2) {
    errors.push('At least 2 options are required.');
  } else {
    if (data.options.length > 10) {
      errors.push('A poll cannot have more than 10 options.');
    }
    if (data.options.some((option) => {
      const text = typeof option === 'string' ? option : option?.text;
      return typeof text !== 'string' || text.trim().length === 0;
    })) {
      errors.push('Each option must have non-empty text.');
    }
  }

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('Description must be text.');
  }
  if (data.type !== undefined && typeof data.type !== 'string') {
    errors.push('Poll type must be text.');
  }
  if (data.isPublic !== undefined && typeof data.isPublic !== 'boolean') {
    errors.push('Poll visibility must be true or false.');
  }

  if (!data.startDate) {
    errors.push('Start date is required.');
  } else if (Number.isNaN(new Date(data.startDate).getTime())) {
    errors.push('Start date must be valid.');
  }

  if (!data.endDate) {
    errors.push('End date is required.');
  } else if (Number.isNaN(new Date(data.endDate).getTime())) {
    errors.push('End date must be valid.');
  }

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (
    data.startDate &&
    data.endDate &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    startDate >= endDate
  ) {
    errors.push('End date must be after start date.');
  }

  return errors;
};
