import type { PrismaClient } from '../generated/client';
import type { PaginationParams, PaginationResult } from '@pet/shared/types';
import { buildPaginationResult, calculateOffset } from '@pet/shared/utils';

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  protected async paginate<T>(
    query: { count: () => Promise<number>; findMany: (args: { skip: number; take: number }) => Promise<T[]> },
    params: PaginationParams
  ): Promise<PaginationResult<T>> {
    const { page, pageSize } = params;
    const [total, items] = await Promise.all([
      query.count(),
      query.findMany({
        skip: calculateOffset(page, pageSize),
        take: pageSize,
      }),
    ]);
    return buildPaginationResult(items, total, page, pageSize);
  }
}
