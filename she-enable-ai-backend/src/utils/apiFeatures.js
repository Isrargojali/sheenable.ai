class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    // Create a shallow copy to avoid mutating the original
    const queryCopy = { ...this.queryStr };

    // Remove fields that are not for filtering
    const removeFields = ['page', 'limit', 'sort', 'search'];
    removeFields.forEach((field) => delete queryCopy[field]);

    // Advanced filtering for price, salary, experience, etc.
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search() {
    if (this.queryStr.search) {
      const keyword = this.queryStr.search;
      this.query = this.query.find({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { location: { $regex: keyword, $options: 'i' } },
        ],
      });
    }
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  pagination() {
    const page = parseInt(this.queryStr.page) || 1;
    const limit = parseInt(this.queryStr.limit) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.limit(limit).skip(skip);
    this.pagination_result = { page, limit };

    return this;
  }

  async execute() {
    return this.query;
  }
}

module.exports = APIFeatures;
