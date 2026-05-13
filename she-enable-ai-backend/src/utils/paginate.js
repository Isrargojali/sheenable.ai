const getPaginationParams = (reqQuery, defaultLimit = 10, maxLimit = 50) => {
  const page = parseInt(reqQuery.page, 10) || 1;
  const limit = Math.min(parseInt(reqQuery.limit, 10) || defaultLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const getPaginationData = (total, page, limit) => {
  return {
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    limit,
  };
};

module.exports = { getPaginationParams, getPaginationData };
