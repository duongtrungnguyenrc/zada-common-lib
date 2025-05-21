import { DeepPartial, FindOptionsRelationByString, FindOptionsRelations, FindOptionsWhere, Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { Injectable, NotFoundException } from "@nestjs/common";

import { InfiniteDataVM, PagingDataVM } from "../vms";
import { PagingDto } from "../dtos";

/// Internal types

type TypeormFilter<Entity> = FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[];

type TypeormQueryOptions<Entity> = {
  select?: (keyof Entity)[];
  relations?: FindOptionsRelationByString | FindOptionsRelations<Entity>;
  cache?: boolean | { id: string; milliseconds: number };
  withDeleted?: boolean;
};

type TypeormPagingQueryOptions<Entity> = TypeormQueryOptions<Entity> & {
  paging: PagingDto;
};

type UniqueCheckOption<Entity> = {
  fields: (keyof Entity)[];
  message?: string;
};

/// ----

@Injectable()
export class RepositoryService<Entity> {
  constructor(private readonly repository: Repository<Entity>) {}

  private buildFilterFromFields<T>(data: DeepPartial<T>, fields: (keyof T)[]): TypeormFilter<T> {
    return Object.fromEntries(fields.map((field) => [field, data[field as keyof DeepPartial<T>]])) as TypeormFilter<T>;
  }

  async create(data: DeepPartial<Entity>, options?: { checkUnique?: UniqueCheckOption<Entity> }): Promise<Entity> {
    if (options?.checkUnique) {
      const filter = this.buildFilterFromFields<Entity>(data, options.checkUnique.fields);
      await this.checkUniqueConstraint(filter, options.checkUnique);
    }

    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async createMultiple(data: DeepPartial<Entity>[], options?: { checkUnique?: UniqueCheckOption<Entity> }): Promise<Entity[]> {
    if (options?.checkUnique) {
      for (const item of data) {
        const filter = this.buildFilterFromFields<Entity>(item, options.checkUnique.fields);
        await this.checkUniqueConstraint(filter, options.checkUnique);
      }
    }

    const entities = this.repository.create(data);
    return this.repository.save(entities);
  }

  async update(filter: TypeormFilter<Entity>, data: QueryDeepPartialEntity<Entity>, options?: { checkUnique?: UniqueCheckOption<Entity> }): Promise<Entity | null> {
    const existing = await this.repository.findOne({ where: filter });

    if (!existing) return null;

    if (options?.checkUnique) {
      const uniqueFilter = this.buildFilterFromFields<Entity>(data as DeepPartial<Entity>, options.checkUnique.fields);
      const conflict = await this.repository.findOne({ where: uniqueFilter });
      if (conflict && (conflict as any).id !== (existing as any).id) {
        throw new Error(options.checkUnique.message || `Duplicate entry for fields: ${options.checkUnique.fields.join(", ")}`);
      }
    }

    await this.repository.update(filter, data);
    return this.repository.findOne({ where: filter });
  }

  async updateOrThrow(
    filter: TypeormFilter<Entity>,
    data: QueryDeepPartialEntity<Entity>,
    options?: { checkUnique?: UniqueCheckOption<Entity>; notFoundMessage?: string },
  ): Promise<Entity> {
    const updated = await this.update(filter, data, options);
    if (!updated) throw new NotFoundException(options?.notFoundMessage || "Entity not found");
    return updated;
  }

  async updateMultiple(filters: TypeormFilter<Entity>[], data: QueryDeepPartialEntity<Entity>, options?: { checkUnique?: UniqueCheckOption<Entity> }): Promise<(Entity | null)[]> {
    return Promise.all(filters.map((filter) => this.update(filter, data, options)));
  }

  async updateMultipleOrThrow(
    filters: TypeormFilter<Entity>[],
    data: QueryDeepPartialEntity<Entity>,
    options?: { checkUnique?: UniqueCheckOption<Entity>; notFoundMessage?: string },
  ): Promise<Entity[]> {
    const results = await Promise.all(filters.map((filter) => this.update(filter, data, options)));
    const missing = results.find((r) => r === null);
    if (missing) throw new NotFoundException(options?.notFoundMessage || "One or more entities not found");
    return results as Entity[];
  }

  async get(filter: TypeormFilter<Entity>, options: TypeormQueryOptions<Entity> = {}): Promise<Entity | null> {
    return this.repository.findOne({
      where: filter,
      select: options.select as any,
      relations: options.relations,
      cache: options.cache,
      withDeleted: options.withDeleted,
    });
  }

  async getOrThrow(filter: TypeormFilter<Entity>, options: TypeormQueryOptions<Entity> & { notFoundMessage?: string } = {}): Promise<Entity> {
    const entity = await this.get(filter, options);

    if (!entity) throw new NotFoundException(options.notFoundMessage || "Entity not found");

    return entity;
  }

  async getMultiple(filter: TypeormFilter<Entity> = {}, options: TypeormQueryOptions<Entity> = {}): Promise<Entity[]> {
    return this.repository.find({
      where: filter,
      select: options.select as any,
      relations: options.relations,
      cache: options.cache,
      withDeleted: options.withDeleted,
    });
  }

  async getMultiplePaging(filter: TypeormFilter<Entity> = {}, options: TypeormPagingQueryOptions<Entity>): Promise<PagingDataVM<Entity>> {
    const { paging, ...restOptions } = options;

    const [data, total] = await this.repository.findAndCount({
      where: filter,
      skip: (paging.page - 1) * paging.size,
      take: paging.size,
      select: restOptions.select as any,
      relations: restOptions.relations,
      cache: restOptions.cache,
      withDeleted: options.withDeleted,
    });

    return {
      data,
      meta: {
        page: paging.page,
        size: paging.size,
        totalPages: Math.ceil(total / paging.size),
      },
    };
  }

  async getMultipleInfinite(filter: TypeormFilter<Entity> = {}, options: TypeormPagingQueryOptions<Entity>): Promise<InfiniteDataVM<Entity>> {
    const { paging, ...restOptions } = options;

    const data = await this.repository.find({
      where: filter,
      skip: (paging.page - 1) * paging.size,
      take: paging.size + 1,
      select: restOptions.select as any,
      relations: restOptions.relations,
      cache: restOptions.cache,
      withDeleted: options.withDeleted,
    });

    const hasNext = data.length > paging.size;

    return {
      data: hasNext ? data.slice(0, paging.size) : data,
      nextPage: hasNext ? paging.page + 1 : undefined,
    };
  }

  async deleteOrThrow(filter: TypeormFilter<Entity>, notFoundMessage = "Entity not found"): Promise<void> {
    const result = await this.repository.delete(filter);
    if (result.affected === 0) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  async softDeleteOrThrow(filter: TypeormFilter<Entity>, notFoundMessage = "Entity not found"): Promise<void> {
    const result = await this.repository.softDelete(filter);
    if (result.affected === 0) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  async delete(filter: TypeormFilter<Entity>): Promise<void> {
    await this.repository.delete(filter);
  }

  async deleteMultiple(filters: TypeormFilter<Entity>[]): Promise<void> {
    await Promise.all(filters.map((f) => this.repository.delete(f)));
  }

  async softDelete(filter: TypeormFilter<Entity>): Promise<void> {
    await this.repository.softDelete(filter);
  }

  async softDeleteMultiple(filters: TypeormFilter<Entity>[]): Promise<void> {
    await Promise.all(filters.map((f) => this.repository.softDelete(f)));
  }

  async restore(filter: TypeormFilter<Entity>): Promise<void> {
    await this.repository.restore(filter);
  }

  async count(filter: TypeormFilter<Entity> = {}): Promise<number> {
    return this.repository.count({ where: filter });
  }

  async exists(filter: TypeormFilter<Entity> = {}): Promise<boolean> {
    return this.repository.exist({ where: filter });
  }

  async countDeleted(filter: TypeormFilter<Entity> = {}): Promise<number> {
    return this.repository.count({ where: filter, withDeleted: true });
  }

  async existsDeleted(filter: TypeormFilter<Entity> = {}): Promise<boolean> {
    const count = await this.repository.count({ where: filter, withDeleted: true });
    return count > 0;
  }

  async countAll(): Promise<number> {
    return this.repository.count({ withDeleted: true });
  }

  async existsAll(): Promise<boolean> {
    const count = await this.repository.count({ withDeleted: true });
    return count > 0;
  }

  private async checkUniqueConstraint(filter: TypeormFilter<Entity>, options?: UniqueCheckOption<Entity>) {
    const exists = await this.repository.exist({ where: filter });
    if (exists) {
      throw new Error(options?.message || `Duplicate entry for fields: ${options?.fields?.join(", ")}`);
    }
  }
}
