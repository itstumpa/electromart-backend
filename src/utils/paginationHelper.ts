type SortOrder = 'asc' | 'desc';

export type IPaginationOptions = {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: string;
};

export type IPaginationResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: SortOrder;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const calculatePagination = (
  options: IPaginationOptions,
  allowedSortFields: string[] = ['createdAt']
): IPaginationResult => {
  const parsedPage = Number(options.page);
  const parsedLimit = Number(options.limit);

  const page =
    Number.isInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : DEFAULT_PAGE;

  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  const skip = (page - 1) * limit;

  const requestedSortBy = String(options.sortBy || 'createdAt').trim();
  const sortBy = allowedSortFields.includes(requestedSortBy)
    ? requestedSortBy
    : 'createdAt';

  const requestedOrder = String(options.sortOrder || 'desc').toLowerCase();
  const sortOrder: SortOrder =
    requestedOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export const paginationHelper = {
  calculatePagination,
};