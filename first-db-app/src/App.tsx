import React, { useState } from "react";
class Customer {
  dbName: string;
  constructor(dbName: string) {
    this.dbName = dbName;
    this.removeAllRows = this.removeAllRows.bind(this); // これよくわからない
    if (!window.indexedDB) {
      window.alert(
        "Your browser doesn't support a stable version of IndexedDB. \
        Such and such feature will not be available."
      );
    }
  }

  removeAllRows() {
    console.log("removeAllRows");
    const request = indexedDB.open(this.dbName, 1);

    request.onerror = (event) => {
      if (event.target) {
        console.log("removeAllRows - Database error: ", (event.target as IDBOpenDBRequest).error!.message);
      } else {
        console.log("removeAllRows - Database error: event.targetが存在しません");
      }
    };

    request.onsuccess = (event) => {
      console.log("Deleting all customers...");
      const db = (event.target as IDBOpenDBRequest).result;
      const txn = db.transaction("customers", "readwrite");
      txn.onerror = (event) => {
        if (event.target) {
          console.log("removeAllRows - Txn error: ", (event.target as IDBOpenDBRequest).error!.message);
        } else {
          console.log("event.targetが存在しないよ");
        }
      };
      txn.oncomplete = (event) => {
        console.log("All rows removed!");
      };
      const objectStore = txn.objectStore("customers");
      const getAllKeysRequest = objectStore.getAllKeys();
      getAllKeysRequest.onsuccess = (event) => {
        getAllKeysRequest.result.forEach((key) => {
          objectStore.delete(key);
        });
      };
    };
  }

  initialLoad(customerData: Array<{ userid: string; name: string; email: string }>) {
    console.log("initialLoad");
    // DBを開く
    const request = indexedDB.open(this.dbName, 1);

    request.onerror = (event) => {
      if (event.target) {
        console.log("initialLoad - Database error: ", (event.target as IDBOpenDBRequest).error!.message);
      } else {
        console.log("initialLoad - Database error: eventが存在しません");
      }
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      console.log("Populating customers...");
      if (event.target) {
        const db = (event.target as IDBOpenDBRequest).result;
        // DB内にオブジェクトストアを作成する
        const objectStore = db.createObjectStore("customers", { keyPath: "userid" });

        // objectStore.onerror = (event) => {
        //   console.log("initialLoad - objectStore error: ", event.target.error.code, " - ", event.target.error.message);
        // };
        // ※※※onerrorメソッド存在しないって言われる、一旦コメントアウト※※※

        // データベース操作のトランザクションを開始して、リクエストを行う
        // Create an index to search customers by name and email
        objectStore.createIndex("name", "name", { unique: false });
        objectStore.createIndex("email", "email", { unique: true });

        objectStore.transaction.oncomplete = (event) => {
          const customerObjectStore = db.transaction(["customers"], "readwrite").objectStore("customers");
          // Populate the database with the initial set of rows
          customerData.forEach(function (customer) {
            customerObjectStore.put(customer);
          });
        };
        console.log("処理終了");
      } else {
        console.log("event.targetがnullだよ");
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const customerObjectStore = db.transaction(["customers"], "readwrite").objectStore("customers");
      customerData.forEach(function (customer) {
        customerObjectStore.put(customer);
      });
      db.close();
      console.log("データ登録完了");
    };
  }

  getAllRows(callback?: (customers: Array<{ userid: number; name: string; email: string }>) => void) {
    console.log("getAllRows.");
    const request = indexedDB.open(this.dbName, 1);
    const customers: Array<{ userid: number; name: string; email: string }> = [];

    request.onerror = (event) => {
      if (event.target) {
        console.log("getAllRows - Database error: ", (event.target as IDBOpenDBRequest).error!.message);
      } else {
        console.log("getAllRows - Database error: event.targetが存在しません");
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(["customers"]);
      const objectStore = transaction.objectStore("customers");

      objectStore.openCursor().onsuccess = (event) => {
        const cursor: any = (event.target as IDBOpenDBRequest).result;
        if (cursor) {
          customers.push(cursor.value);
          cursor.continue();
        } else {
          callback?.(customers);
        }
      };
    };
  }

  getSpecificRow() {}
}

const App: React.FC = () => {
  const DBNAME = "customer_dbm";
  const [log, setLog] = useState<Array<string>>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [customerData, setCustomerData] = useState<Array<{ userid: number; name: string; email: string }>>();
  let customer = new Customer(DBNAME);

  /**
   * Clear all customer data from the database
   */
  const clearDB = () => {
    logHandler("実行内容: clearDB");
    logHandler("clearDB: データ削除開始");
    setStatusMessage("データ削除開始");
    customer.removeAllRows();
    setStatusMessage("データ削除完了");
    setStatusMessage("データ削除完了");

    queryDB();
  };

  /**
   * Add customer data to the database
   */
  const loadDB = () => {
    logHandler("実行内容: loadDB");
    logHandler("loadDB: ロード開始");

    setStatusMessage("ロード開始"); //これ機能してない

    // Customers to add to initially populate the database with
    const customerData = [
      { userid: "444", name: "Bill", email: "bill@company.com" },
      { userid: "555", name: "Donna", email: "donna@home.org" },
    ];
    customer.initialLoad(customerData);
    setStatusMessage("ロード終了");
    logHandler("loadDB: ロード終了");
  };

  const queryDB = () => {
    logHandler("実行内容: queryDB");
    logHandler("queryDB: データを取得しています");
    setStatusMessage("データを取得しています");
    customer.getAllRows(setCustomerData);
    setStatusMessage("データの取得が完了しました");
    logHandler("queryDB: データの取得が完了しました");
  };

  const logHandler = (message: string) => {
    log.push(message);
    setLog(log);
  };

  return (
    <>
      <div>
        <button onClick={() => loadDB()}>LoadDB</button>
      </div>
      <div>
        <button onClick={() => queryDB()}>QueryDB</button>
      </div>
      <div>
        <button onClick={() => clearDB()}>ClearDB</button>
      </div>
      <div>
        通知パネル
        <p>{statusMessage}</p>
      </div>
      <div>ログパネル</div>
      <div style={{ height: "200px", border: "1px solid #000", overflowY: "scroll" }}>
        {log.map((log, index) => (
          <p>{log}</p>
        ))}
      </div>

      <div>クエリ結果領域</div>
      <div style={{ height: "200px", border: "1px solid #000", overflowY: "scroll" }}>
        {customerData && customerData.length !== 0 ? (
          customerData.map((customer, index) => (
            <li style={{ listStyleType: "none" }}>
              <ul>id：{customer.userid}</ul>
              <ul>名前：{customer.name}</ul>
              <ul>メアド：{customer.email}</ul>
              <hr />
            </li>
          ))
        ) : (
          <p style={{ color: "red" }}>表示できるデータがありません</p>
        )}
      </div>
    </>
  );
};

export default App;

// 通知パネル
// →ステータスメッセージを表示する
// →ロード操作の開始時と終了時にその旨を表示する(クエリの開始時と終了時も)
//　→クリア操作の開始時と終了時も

// ログパネル
// →通知パネルの履歴を表示する ok
//　→実行内容(DBのロードとかの履歴を表示する) ok

// クエリ結果領域
//　→表示する行がないとき、その旨がメッセージとして表示される ok
//　→ユーザーの詳細情報を表示する ok
//　→スクロール可能である ok

// LoadDBボタン
//　データを入力できる ok

// QueryDBボタン
// →クエリ結果領域にすべての顧客の一覧を表示できる　ok

// ClearDBボタン
// →DBからすべての行を削除できる ok
