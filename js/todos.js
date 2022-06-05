function todo () {

	return {

		init() {
			this.events.push({message: `Alpine initialization start`,type:'info'});
			this.dbGlobals.db = null; // The database object will eventually be stored here.
			this.dbGlobals.description = "This database is used to store files locally."; // The description of the database.
			this.dbGlobals.name = "localFileStorage"; // The name of the database.
			this.dbGlobals.version = 1; // Must be >= 1. Be aware that a database of a given name may only have one version at a time, on the client machine.
			this.dbGlobals.storeName = "todos"; // The name of the database's object store. Each object in the object store is a file object.
			this.dbGlobals.message = ""; // When useful, contains one or more HTML strings to display to the user in the 'messages' DIV box.
			this.dbGlobals.empty = true; // Indicates whether or not there's one or more records in the database object store. The object store is initially empty, so set this to true.
			this.openDB();

			this.$nextTick(() => {this.loadTodos()});

			this.events.push({message: `Alpine initialization ended`,type:'info'});
		},

		openDB() {
			try {
				let openRequest = window.indexedDB.open(this.dbGlobals.name, this.dbGlobals.version); // Also passing an optional version number for this database.

				openRequest.onerror = (event) => {
					this.events.push({message: "openRequest.onerror fired in openDB() - error: " + (event.target.error ? event.target.error : event.target.errorCode),type:'danger'});
				}

				openRequest.onblocked = (event) => {
					this.events.push({message: `The database is blocked - error code: + ${(event.target.error ? event.target.error : event.target.errorCode)}`,type:'warning'});
					this.events.push({message: `If this page is open in other browser windows, close these windows.`,type:'info'});
				};

				openRequest.onupgradeneeded = (event) => {
					this.dbGlobals.db = event.target.result;

					try {
						this.dbGlobals.db.createObjectStore(this.dbGlobals.storeName, {
							keyPath: "ID",
							autoIncrement: true
						});
						this.events.push({message: `Object store ${this.dbGlobals.storeName} created`,type:'success'});
					} catch (ex) {
						this.events.push({message: `Exception in onupgradeneeded - ${ex.message}`,type:'danger'});
					}

				};

				openRequest.onsuccess = (event) => {
					this.dbGlobals.db = event.target.result;
					this.events.push({message: "Databased successfully opened",type:'success'});
				};
			} catch (ex) {
				this.events.push({message: `window.indexedDB.open exception in openDB() - ${ex.message}`,type:'danger'});
			}
		},

		loadTodos() {
			let transaction = '';

			try {
				transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName, 'readonly');
			} catch (ex) {
				this.events.push({message: `this.dbGlobals.db.transaction exception in loadTodos() - ${ex.message}`,type:'danger'});
				return;
			}

			let objectStore = transaction.objectStore(this.dbGlobals.storeName);

			const cursorRequest = objectStore.openCursor();

			cursorRequest.onerror = (evt) => {
				this.events.push({message: "cursorRequest.onerror fired in displayDB() - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode),type:'danger'});
			}

			cursorRequest.onsuccess = (evt) => {

				const cursor = evt.target.result;
				if (cursor) {
					this.todos.push({body: cursor.value.body,id:cursor.value.ID,completed: cursor.value.completed})
					cursor.continue();
				}
			}

			return this.todos;
		},

		todos: [],

		dbGlobals: {},

		events: [],

		newTodo: '',

		editedTodo: null,

		filter: 'all',

		styles: {success: 'success',danger:'danger', info:'info', warning: 'warning'},

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
				this.events.push({message: `TODO ${todo.body} Saved to DB`,type:'success'});
			};

			request.onerror = event => {
				this.events.push({message: `Save to DB failed. Error: ${event.target.errorCode}`,type:'danger'});
			}

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

			this.deleteTodoDB(todo);
		},

		deleteTodoDB(todo) {

			let transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName,'readwrite');
			let objectStore = transaction.objectStore(this.dbGlobals.storeName);

			const request = objectStore.delete(todo.id);

			request.onsuccess = event => {
				this.events.push({message: `TODO ${todo.body} deleted`,type:'success'});
			};

			request.onerror = event => {
				this.events.push({message: `TODO ${todo.body} failed to delete. Error: ${event.target.errorCode}`,type:'danger'});
			}
		},

		completeTodo(todo) {

			let transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName,'readwrite');
			let objectStore = transaction.objectStore(this.dbGlobals.storeName);

			const request = objectStore.get(todo.id);

			request.onerror = event => {
				this.events.push({message: `TODO ${todo.body} cannot be retrieved. Error: ${event.target.errorCode}`,type:'danger'});
			};

			request.onsuccess = event => {

				const data = event.target.result;
				data.completed = !data.completed;

				const requestUpdate = objectStore.put(data);
				requestUpdate.onerror = event => {
					this.events.push({message: `TODO ${todo.body} cannot be updated. Error: ${event.target.errorCode}`,type:'danger'});
				};
				requestUpdate.onsuccess = event => {
					todo.completed = !todo.completed;
					this.events.push({message: `TODO ${todo.body} Updated.`,type:'success'});
				};
			}
		},

		editTodo(todo) {
			todo.cachedBody = todo.body;

			let transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName,'readwrite');
			let objectStore = transaction.objectStore(this.dbGlobals.storeName);

			const request = objectStore.get(todo.id);

			request.onerror = event => {
				this.events.push({message: `TODO ${todo.body} cannot be retrieved. Error: ${event.target.errorCode}`,type:'danger'});
			};

			request.onsuccess = event => {

				const data = event.target.result;
				data.body = todo.body;

				const requestUpdate = objectStore.put(data);
				requestUpdate.onerror = event => {
					// Do something with the error
				};
				requestUpdate.onsuccess = event => {
					// Success - the data is updated!
				};
			}

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
