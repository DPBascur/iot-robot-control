declare module 'better-sqlite3' {
  export type RunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  export interface Statement {
    get<T = unknown>(...params: unknown[]): T;
    all<T = unknown>(...params: unknown[]): T[];
    run(...params: unknown[]): RunResult;
  }

  export interface Database {
    exec(sql: string): void;
    pragma(value: string): unknown;
    prepare(sql: string): Statement;
    close(): void;
  }

  export default class DatabaseCtor {
    constructor(filename: string);
    exec(sql: string): void;
    pragma(value: string): unknown;
    prepare(sql: string): Statement;
    close(): void;
  }
}
