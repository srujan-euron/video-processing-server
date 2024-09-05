import { DeleteResult, sql } from "kysely";
import { v4 as uuid } from "uuid";
import { db } from "../db/connection";

export enum TableName {
  User = "User",
  Reel = "Reel",
}

export class CrudRepository<T extends { id: string }> {
  public _db = db;
  private _tableName: TableName;
  private _userIdAttribute: string;
  private _idAttribute: string;

  constructor(tablename: TableName, userIdAttribute: string, idAttribute: string) {
    this._tableName = tablename;
    this._userIdAttribute = userIdAttribute;
    this._idAttribute = idAttribute;
  }

  getTableName(): TableName {
    return this._tableName;
  }


  async exists(attributeId: keyof T & string, tableName: TableName) {
    return this._db.selectFrom(tableName).selectAll().where(`id`, "=", attributeId).executeTakeFirst();
  }

  async checkUniqueAttribute(attribute: keyof T & string, value: T[keyof T & string]): Promise<{ id: string }> {
    return this._db.selectFrom(this._tableName).select("id").where(sql.ref(attribute), "=", value).executeTakeFirst() as Promise<{ id: string }>;
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    return this._db
      //@ts-ignore
      .insertInto(this._tableName)
      .values({
        id: uuid(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returningAll()
      .executeTakeFirst() as Promise<T>;
  }

  async getAll(): Promise<T[]> {
    return this._db
      //@ts-ignore
      .selectFrom(this._tableName)
      .selectAll()
      .execute() as Promise<T[]>;
  }

  async getAllOfLinker(linkerId: string): Promise<T[]> {
    return this._db
      //@ts-ignore
      .selectFrom(this._tableName)
      .selectAll()
      .where(sql.ref(this._userIdAttribute), "=", linkerId)
      .execute() as Promise<T[]>;
  }

  async get(id: string): Promise<T> {
    return this._db
      //@ts-ignore
      .selectFrom(this._tableName)
      .selectAll()
      .where(sql.ref(this._idAttribute), "=", id)
      .executeTakeFirst() as Promise<T>;
  }

  async update(data: Partial<T>): Promise<T | null> {
    return this._db
      //@ts-ignore
      .updateTable(this._tableName)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(sql.ref("id"), "=", data.id)
      .returningAll()
      .executeTakeFirst() as Promise<T | null>;
  }

  async delete(id: string): Promise<DeleteResult> {
    return this._db
      //@ts-ignore
      .deleteFrom(this._tableName)
      .where(sql.ref("id"), "=", id)
      .executeTakeFirst() as Promise<DeleteResult>;
  }

  async deleteUsingKeys(keys: Record<string, string>): Promise<T | null> {
    //@ts-ignore
    let query = this._db.deleteFrom(this._tableName);
    for (const [key, value] of Object.entries(keys)) {
      query = query.where(sql.ref(key), "=", value);
    }
    return query.returningAll().executeTakeFirst() as Promise<T | null>;
  }

  async deleteAll(ids: string[]): Promise<DeleteResult[]> {
    return this._db
      //@ts-ignore
      .deleteFrom(this._tableName)
      .where(sql.ref("id"), "in", ids)
      .execute();
  }
}


export type CrudRepositoryType<T extends { id: string }> = {
  getTableName(): TableName
  exists(attributeId: string, tableName: TableName): any
  checkUniqueAttribute(attribute: keyof T & string, value: T[keyof T & string]): Promise<{ id: string }>
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  getAll(): Promise<T[]>;
  getAllOfLinker(linkerId: string): Promise<T[]>
  get(userId: string): Promise<T>;
  update(data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<DeleteResult>;
  deleteUsingKeys(keys: Record<string, string>): Promise<T | null>;
  deleteAll(ids: string[]): Promise<DeleteResult[]>;
};