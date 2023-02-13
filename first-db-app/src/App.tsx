import React, { Component } from "react";
class Customer extends Component {
  dbName: string;
  constructor(dbName: string) {
    super(dbName); // これよくわからない
    this.dbName = dbName;
    console.log("constructor");
    // this.removeAllRows = this.removeAllRows.bind(this); // これいらない?
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
        // onerrorメソッド存在しないって言われる

        // データベース操作のトランザクションを開始して、リクエストを行う
        // Create an index to search customers by name and email
        objectStore.createIndex("name", "name", { unique: false });
        objectStore.createIndex("email", "email", { unique: true });

        objectStore.transaction.oncomplete = (event) => {
          const customerObjectStore = db.transaction("customers", "readwrite").objectStore("customers");
          // Populate the database with the initial set of rows
          customerData.forEach(function (customer) {
            customerObjectStore.put(customer);
          });
        };
        db.close();
        console.log("処理終了");
      } else {
        console.log("event.targetがnullだよ");
      }
    };

    request.onsuccess = (event) => {
      // console.log(event);
      // const db = (event.target as IDBOpenDBRequest).result;

      // var transaction = db.transaction("customers");
      // console.log("ここのけっかみたい");
      // console.log(transaction.objectStore("customers").getAll("name"));

      console.log("成功");
    };
  }

  render() {
    return <></>;
  }
}

const App: React.FC = () => {
  const DBNAME = "customer_dbd";

  /**
   * Clear all customer data from the database
   */
  const clearDB = () => {
    console.log("Delete all rows from the Customers database");
    let customer = new Customer(DBNAME);
    customer.removeAllRows();
  };

  /**
   * Add customer data to the database
   */
  const loadDB = () => {
    console.log("Load the Customers database");

    // Customers to add to initially populate the database with
    const customerData = [
      { userid: "444", name: "Bill", email: "bill@company.com" },
      { userid: "555", name: "Donna", email: "donna@home.org" },
    ];
    let customer = new Customer(DBNAME);
    customer.initialLoad(customerData);
  };

  return (
    <>
      <div>
        <button onClick={() => loadDB()}>LoadDB</button>
      </div>
      <div>
        <button>QueryDB</button>
      </div>
      <div>
        <button onClick={() => clearDB()}>ClearDB</button>
      </div>
      <div>通知パネル</div>
      <div>ログパネル</div>
    </>
  );
};

export default App;
