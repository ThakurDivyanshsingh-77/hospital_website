const toDateOnly = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const toDateOnlyString = (value) => {
  return toDateOnly(value) || "";
};

const todayDateOnly = () => {
  return new Date().toISOString().slice(0, 10);
};

module.exports = {
  toDateOnly,
  toDateOnlyString,
  todayDateOnly,
};
