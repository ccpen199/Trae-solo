declare module 'better-sqlite3' {
  namespace Database {
    interface Statement {
      run(...params: any[]): any;
      get(...params: any[]): any;
      all(...params: any[]): any[];
    }

    interface Database {
      pragma(source: string): unknown;
      exec(source: string): unknown;
      prepare(source: string): Statement;
      transaction<T extends (...args: any[]) => any>(fn: T): T;
    }
  }

  interface DatabaseConstructor {
    new(filename: string, options?: any): Database.Database;
    (filename: string, options?: any): Database.Database;
  }

  const Database: DatabaseConstructor;
  export = Database;
}
