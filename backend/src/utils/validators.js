export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePollInput = (data) => {
  const errors = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters.');
  }

  if (!data.options || data.options.length < 2) {
    errors.push('At least 2 options are required.');
  }

  if (!data.startDate) {
    errors.push('Start date is required.');
  }

  if (!data.endDate) {
    errors.push('End date is required.');
  }

  if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
    errors.push('End date must be after start date.');
  }

  return errors;
};
