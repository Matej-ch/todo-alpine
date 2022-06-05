/*document.addEventListener('alpine:init', () => {
	console.log('alpine inicialiazation');
})*/

function todo () {

	return {

		async init() {
			this.events.push({message: `Alpine initialization start`});
			this.dbGlobals.db = null; // The database object will eventually be stored here.
			this.dbGlobals.description = "This database is used to store files locally."; // The description of the database.
			this.dbGlobals.name = "localFileStorage"; // The name of the database.
			this.dbGlobals.version = 1; // Must be >= 1. Be aware that a database of a given name may only have one version at a time, on the client machine.
			this.dbGlobals.storeName = "todos"; // The name of the database's object store. Each object in the object store is a file object.
			this.dbGlobals.message = ""; // When useful, contains one or more HTML strings to display to the user in the 'messages' DIV box.
			this.dbGlobals.empty = true; // Indicates whether or not there's one or more records in the database object store. The object store is initially empty, so set this to true.
			await this.openDB();
			await this.loadTodos();
			this.events.push({message: `Alpine initialization ended`});
		},

		async openDB() {
			try {
				let openRequest = await window.indexedDB.open(this.dbGlobals.name, this.dbGlobals.version); // Also passing an optional version number for this database.

				openRequest.onerror = (event) => {
					this.events.push({message: "openRequest.onerror fired in openDB() - error: " + (event.target.error ? event.target.error : event.target.errorCode)});
				}

				openRequest.onblocked = (event) => {
					this.events.push({message: `The database is blocked - error code: + ${(event.target.error ? event.target.error : event.target.errorCode)}`});
					this.events.push({message: `If this page is open in other browser windows, close these windows.`});
				};

				openRequest.onupgradeneeded = (event) => {
					this.dbGlobals.db = event.target.result;

					try {
						this.dbGlobals.db.createObjectStore(this.dbGlobals.storeName, {
							keyPath: "ID",
							autoIncrement: true
						});
						this.events.push({message: `Object store ${this.dbGlobals.storeName} created`});
					} catch (ex) {
						this.events.push({message: `Exception in onupgradeneeded - ${ex.message}`});
					}

				};

				openRequest.onsuccess = (event) => {
					this.dbGlobals.db = event.target.result;
					this.events.push({message: "Databased successfully opened"});
				};
			} catch (ex) {
				this.events.push({message: `window.indexedDB.open exception in openDB() - ${ex.message}`});
			}
		},

		async loadTodos() {
			let transaction = '';
			console.log(this.dbGlobals.db);

			//this.todos.push({body:'test'});
			try {
				transaction = await this.dbGlobals.db.transaction(this.dbGlobals.storeName, 'readonly');
			} catch (ex) {
				this.events.push({message: `this.dbGlobals.db.transaction exception in loadTodos() - ${ex.message}`});
				return;
			}

			let objectStore = await transaction.objectStore(this.dbGlobals.storeName);

			const cursorRequest = await objectStore.openCursor();

			cursorRequest.onerror = (evt) => {
				this.events.push({message: "cursorRequest.onerror fired in displayDB() - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode)});
			}

			let tempTodos = [];
			cursorRequest.onsuccess = (evt) => {

				var cursor = evt.target.result;
				if (cursor) {
					tempTodos.push({body: cursor.value.body,id:cursor.value.id})
					console.log(cursor.value);
					cursor.continue();
				}
			}

			this.todos = tempTodos;
			return this.todos;
		},

		todos: [],

		dbGlobals: {},

		events: [],

		newTodo: '',

		editedTodo: null,

		filter: 'all',

		/*get filteredTodos() {

			let transaction = '';
			try {
				transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName, 'readonly');
			} catch (ex) {
				this.events.push({message: `this.dbGlobals.db.transaction exception in filteredTodos() - ${ex.message}`});
				return;
			}

			let objectStore = transaction.objectStore(this.dbGlobals.storeName);

			const cursorRequest = objectStore.openCursor();

			cursorRequest.onerror = (evt) => {
				this.events.push({message: "cursorRequest.onerror fired in displayDB() - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode)});
			}

			let tempTodos = [];
			cursorRequest.onsuccess = (evt) => {

				var cursor = evt.target.result;
				if (cursor) {
					tempTodos.push({body: cursor.value.body,id:cursor.value.id})
					console.log(cursor.value);
					cursor.continue();
				}
			}

			this.todos = tempTodos;
			return this.todos;
		},*/

		/*async get filteredTodos() {

			const req = indexedDB.open(this.db_name, this.db_version)


			req.onsuccess = function (evt) {
				window.db = this.result;
			}

			const objectStore = await window.db.transaction('todos').objectStore('todos');

			objectStore.openCursor().onsuccess = function(event) {
				let cursor = event.target.result;
				if (cursor) {

					console.log({
						id: cursor.key,
						body: cursor.value.body,
						completed: cursor.value.completed,
					});

					console.log("Name for SSN " + cursor.key + " is " + cursor.value.body);
					cursor.continue();
				}
				else {
					console.log("No more entries!");
				}
			};

			return {
				all: this.todos,
				active: this.active,
				completed: this.completed
			}[this.filter];
		},*/

		get active() {
			return this.todos.filter(todo => !todo.completed)
		},

		get completed() {
			return this.todos.filter(todo => todo.completed);
		},

		get allComplete() {
			return this.completed.length === this.todos.length;
		},

		/*async init() {
			console.log('openingDB');
			const req = await indexedDB.open(this.db_name, this.db_version);

			//this.db_name = 'demo-indexeddb-todos';
			//this.db_version = 3;
			//this.db_store_name = 'todos';

			req.onsuccess = function (evt) {
				window.db = this.result;
				console.log("openingDB DONE");


				var objectStore = window.db.transaction('todos').objectStore('todos');

				objectStore.openCursor().onsuccess = function(event) {
					var cursor = event.target.result;
					if (cursor) {

						console.log({
							id: cursor.key,
							body: cursor.value.body,
							completed: cursor.value.completed,
						});

						console.log("Name for SSN " + cursor.key + " is " + cursor.value.body);
						cursor.continue();
					}
					else {
						console.log("No more entries!");
					}
				};


			};
			req.onerror = function (evt) {
				console.error("openingDB error:", evt.target.errorCode);
			};

			req.onupgradeneeded = function (evt) {
				console.log("openDb.onupgradeneeded");
				const store = evt.currentTarget.result.createObjectStore(this.db_store_name, { keyPath: 'id', autoIncrement: true });

				store.createIndex('id', 'id', { unique: true });
				store.createIndex('body', 'body', { unique: false });
				store.createIndex('completed', 'completed', { unique: false });
			};
		},*/

		saveDB(todo) {

			let transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName,'readwrite');
			let objectStore = transaction.objectStore(this.dbGlobals.storeName);

			const request = objectStore.add(todo);
			request.onsuccess = event => {
				this.events.push({message: "Saved to DB"});
			};

			request.onerror = event => {
				this.events.push({message: "Save to DB failed"});
			}

		},

		getObjectStore(store_name, mode) {
			const tx = window.db.transaction(store_name, mode);
			return tx.objectStore(store_name);
		},

		addTodo() {
			if(!this.newTodo) {
				return;
			}

			const todoDate = Date.now();
			this.todos.push({
				id: todoDate,
				body: this.newTodo,
				completed: false,
			});

			this.saveDB({
				id: todoDate,
				body: this.newTodo,
				completed: false,
			});

			this.newTodo = '';
		},

		deleteTodo(todo) {
			let position = this.todos.indexOf(todo);
			this.todos.splice(position,1);

			this.deleteTodoDB(todo.id);

			this.save();

		},

		deleteTodoDB(id) {

			console.log("deletePublication:", arguments);
			const store = this.getObjectStore(this.db_store_name, 'readwrite');
			let req = store.index('id');

			req.get(id).onsuccess = function(evt) {
				if (typeof evt.target.result == 'undefined') {
					console.log("No matching record found");
					return;
				}

				// As per spec http://www.w3.org/TR/IndexedDB/#object-store-deletion-operation
				// the result of the Object Store Deletion Operation algorithm is
				// undefined, so it's not possible to know if some records were actually
				// deleted by looking at the request result.
				let todorReq = store.get(evt.target.result.id);

				todorReq.onsuccess = function(evt) {
					var record = evt.target.result;
					console.log("record:", record);
					if (typeof record == 'undefined') {
						console.log("No matching record found");
						return;
					}
					// Warning: The exact same key used for creation needs to be passed for
					// the deletion. If the key was a Number for creation, then it needs to
					// be a Number for deletion.
					var deleteReq = store.delete(evt.target.result.id);
					deleteReq.onsuccess = function(evt) {
						console.log("evt:", evt);
						console.log("evt.target:", evt.target);
						console.log("evt.target.result:", evt.target.result);
						console.log("delete successful");
					};
					deleteReq.onerror = function (evt) {
						console.error("deletePublication:", evt.target.errorCode);
					};
				};
				todorReq.onerror = function (evt) {
					console.error("deletePublication:", evt.target.errorCode);
				};
			}
			req.onerror = function (evt) {
				console.error("deletePublicationFromBib:", evt.target.errorCode);
			};

		},

		completeTodo(todo) {
			todo.completed = !todo.completed;
		},

		editTodo(todo) {
			todo.cachedBody = todo.body;

			this.editedTodo = todo;
		},

		cancelEdit(todo) {
			todo.body = todo.cachedBody;

			this.editedTodo = null;

			delete todo.cachedBody;
		},

		editComplete(todo) {
			if(todo.body.trim() === '') {
				this.deleteTodo(todo);
			}

			this.editedTodo = null;

		},

		toggleAllTodos() {
			let allComplete = this.allComplete;

			this.todos.forEach(todo => todo.completed = !allComplete);

		},

		clearCompleted() {
			this.todos = this.active;
		},
	}
}
