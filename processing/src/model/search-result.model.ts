export interface SearchResult<T> {
  totalCount: number;
  pageSize: number;
  skip: number;
  result: T[];
}