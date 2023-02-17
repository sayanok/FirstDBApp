import React, { useState } from "react";
class Customer {
  dbName: string;
  constructor(dbName: string) {
    this.dbName = dbName;
    console.log("constructor");
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
        // db.close();
        // ※※※ここでcloseするとデータを登録することができない※※※
        // ※※※しかし、参考にはここでDBをcloseしている※※※
        // ※※※どこでDBをcloseすべきか？closeは本当に必要か※※※
      } else {
        console.log("event.targetがnullだよ");
      }
    };

    request.onsuccess = (event) => {
      console.log("成功");
      // ここにデータを登録するソースコードが必要？
      // データを削除したあとに"loadDB"ボタンをクリックしても、データを登録することができていない
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
  const DBNAME = "customer_dbk";
  const [statusMessage, setStatusMessage] = useState("");
  const [customerData, setCustomerData] = useState<Array<{ userid: number; name: string; email: string }>>();
  let customer = new Customer(DBNAME);

  /**
   * Clear all customer data from the database
   */
  const clearDB = () => {
    console.log("Delete all rows from the Customers database");
    setStatusMessage("Delete all rows from the Customers database");
    customer.removeAllRows();
    queryDB();
  };

  /**
   * Add customer data to the database
   */
  const loadDB = () => {
    console.log("Load the Customers database");
    setStatusMessage("Load the Customers database");

    // Customers to add to initially populate the database with
    const customerData = [
      { userid: "444", name: "Bill", email: "bill@company.com" },
      { userid: "555", name: "Donna", email: "donna@home.org" },
    ];
    customer.initialLoad(customerData);
  };

  const queryDB = () => {
    setStatusMessage("データを取得しています");
    customer.getAllRows(setCustomerData);
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
      {/* ユーザーは、ログ パネルで通知パネル メッセージの実行履歴を確認できます。 */}
      {/* →実行内容の履歴を表示することとする */}
      <div>クエリ結果領域</div>
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
    </>
  );
};

export default App;

// 通知パネル
// →ステータスメッセージを表示する
// →ロード操作の開始時と終了時にその旨を表示する(クエリの開始時と終了時も)
//　→クリア操作の開始時と終了時も

// ログパネル
// →通知パネルの履歴を表示する
//　→実行内容(DBのロードとかの履歴を表示する)

// クエリ結果領域
//　→表示する行がないとき、その旨がメッセージとして表示される ok
//　→ユーザーの詳細情報を表示する

// LoadDBボタン
//　データを入力できる

// QueryDBボタン
// →クエリ結果領域にすべての顧客の一覧を表示できる　ok

// ClearDBボタン
// →DBからすべての行を削除できる ok
