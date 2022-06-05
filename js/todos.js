/*document.addEventListener('alpine:init', () => {
	console.log('alpine inicialiazation');
})*/

function todo () {

	return {

		init() {
			this.dbGlobals.db = null; // The database object will eventually be stored here.
			this.dbGlobals.description = "This database is used to store files locally."; // The description of the database.
			this.dbGlobals.name = "localFileStorage"; // The name of the database.
			this.dbGlobals.version = 1; // Must be >= 1. Be aware that a database of a given name may only have one version at a time, on the client machine.
			this.dbGlobals.storeName = "todos"; // The name of the database's object store. Each object in the object store is a file object.
			this.dbGlobals.message = ""; // When useful, contains one or more HTML strings to display to the user in the 'messages' DIV box.
			this.dbGlobals.empty = true; // Indicates whether or not there's one or more records in the database object store. The object store is initially empty, so set this to true.
			this.openDB();
		},

		openDB() {
			console.log('open');

			try {
				var openRequest = window.indexedDB.open(this.dbGlobals.name, this.dbGlobals.version); // Also passing an optional version number for this database.

				openRequest.onerror = (event) => {
					console.log("openRequest.onerror fired in openDB() - error: " + (event.target.error ? event.target.error : event.target.errorCode));
				} // Some browsers may only support the errorCode property.

				//openRequest.onblocked = openDB_onblocked; // Called if the database is opened via another process, or similar.
				//openRequest.onupgradeneeded = openDB_onupgradeneeded; // Called if the database doesn't exist or the database version values don't match.
				openRequest.onsuccess = (event) => {
					console.log('Its success: ',event.target.result);
				}; // Attempts to open an existing database (that has a correctly matching version value).
			} catch (ex) {
				console.log("window.indexedDB.open exception in openDB() - " + ex.message);
			}
		},

		todos: [],

		dbGlobals: {}, // Store all indexedDB related objects in a global object called "dbGlobals".

		save() {
			localStorage.setItem('todo-store', JSON.stringify(this.todos));
		},

		events: {},

		db_name:'demo-indexeddb-todos',
		db_version: 3,
		db_store_name:'todos',

		newTodo: '',

		editedTodo: null,

		filter: 'all',

		get filteredTodos() {
			return this.todos;
		},

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

		loadTodos() {

		},

		saveDB(todo) {
			const store = this.getObjectStore(this.db_store_name, 'readwrite');
			let req;

			try {
				req = store.add(todo);
			} catch (e) {
				if (e.name === 'DataCloneError')
					throw e;
			}

			req.onsuccess = function (evt) {
				console.log("Insertion in DB successful");
			};
			req.onerror = function() {
				console.error("addPublication error", this.error);
			};

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

			this.save();

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

			this.save();
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

			this.save();
		},

		toggleAllTodos() {
			let allComplete = this.allComplete;

			this.todos.forEach(todo => todo.completed = !allComplete);

			this.save();
		},

		clearCompleted() {
			this.todos = this.active;

			this.save();
		},
	}
}
