import sqlite3 from 'sqlite3';

export abstract class BaseRepository {
  protected db: sqlite3.Database;

  constructor(db: sqlite3.Database) {
    this.db = db;
  }

  protected runQuery<T = any>(
    query: string,
    params: any[] = []
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  protected runQueryAll<T = any>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  protected runStatement(
    query: string,
    params: any[] = []
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(query);
      stmt.run(params, (err) => {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });
  }

  protected runStatementWithLastID(
    query: string,
    params: any[] = []
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(query);
      stmt.run(params, function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      stmt.finalize();
    });
  }

  protected runTransaction(operations: (() => Promise<void>)[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(async () => {
        this.db.run('BEGIN TRANSACTION');
        
        try {
          for (const operation of operations) {
            await operation();
          }
          this.db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve();
          });
        } catch (error) {
          this.db.run('ROLLBACK', () => {
            reject(error);
          });
        }
      });
    });
  }
}
