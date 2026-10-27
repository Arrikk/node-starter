export interface PageQuery {
  page: number;
  limit: number;
  skip: number;
}

export function pageQuery(input: { page?: unknown; limit?: unknown }, fallbackLimit = 20): PageQuery {
  const page = Math.max(1, Number(input.page) || 1);
  const rawLimit = Number(input.limit) || fallbackLimit;
  const limit = Math.min(100, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function pageResult<T>(items: T[], total: number, page: PageQuery) {
  return {
    items,
    page: page.page,
    limit: page.limit,
    total,
    pages: Math.ceil(total / page.limit) || 0,
  };
}
