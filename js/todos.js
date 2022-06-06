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

		get filteredTodos() {

			return {
				all: this.todos,
				active: this.active,
				completed: this.completed
			}[this.filter];
		},

		get active() {
			return this.todos.filter(todo => !todo.completed)
		},

		get completed() {
			return this.todos.filter(todo => todo.completed);
		},

		get allComplete() {
			return this.completed.length === this.todos.length;
		},

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

			const transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName,'readwrite');
			const objectStore = transaction.objectStore(this.dbGlobals.storeName);

			const request = objectStore.delete(todo.id);

			request.onsuccess = event => {
				this.events.push({message: `TODO ${todo.body} deleted`,type:'success'});
			};

			request.onerror = event => {
				this.events.push({message: `TODO ${todo.body} failed to delete. Error: ${event.target.errorCode}`,type:'danger'});
			}
		},

		completeTodo(todo) {

			const transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName,'readwrite');
			const objectStore = transaction.objectStore(this.dbGlobals.storeName);

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
					this.events.push({message: `TODO ${todo.body} Updated.`,type:'success'});
				};
			}
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
			const transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName,'readwrite');
			const objectStore = transaction.objectStore(this.dbGlobals.storeName);

			const request = objectStore.get(todo.id);

			request.onerror = event => {
				this.events.push({message: `TODO ${todo.body} cannot be retrieved. Error: ${event.target.errorCode}`,type:'danger'});
			};

			request.onsuccess = event => {

				const data = event.target.result;
				data.body = todo.body;

				const requestUpdate = objectStore.put(data);
				requestUpdate.onerror = event => {
					this.events.push({message: `TODO ${todo.body} cannot be updated. Error: ${event.target.errorCode}`,type:'danger'});
				};
				requestUpdate.onsuccess = event => {
					this.events.push({message: `TODO ${todo.body} Updated.`,type:'success'});
				};
			}

			this.editedTodo = null;

		},

		toggleAllTodos() {
			let allComplete = this.allComplete;

			const transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName, 'readwrite');
			const objectStore = transaction.objectStore(this.dbGlobals.storeName);
			const cursorRequest = objectStore.openCursor();

			cursorRequest.onerror = (evt) => {
				this.events.push({message: "cursorRequest.onerror fired in toggleAllTodos() - error code: " + (evt.target.error ? evt.target.error : evt.target.errorCode),type:'danger'});
			}

			cursorRequest.onsuccess = (evt) => {
				const cursor = evt.target.result;
				if(cursor) {

					cursor.value.completed = !allComplete
					cursor.update(cursor.value);
					cursor.continue();
				}
			}

			this.todos.forEach(todo => todo.completed = !allComplete);

		},

		clearCompleted() {

			const transaction = this.dbGlobals.db.transaction(this.dbGlobals.storeName, 'readwrite');
			const objectStore = transaction.objectStore(this.dbGlobals.storeName);

			this.todos.map(todo => {
				if(todo.completed) {
					const request = objectStore.delete(todo.id);

					request.onsuccess = event => {
						this.events.push({message: `TODO ${todo.body} deleted`,type:'success'});
					};

					request.onerror = event => {
						this.events.push({message: `TODO ${todo.body} failed to delete. Error: ${event.target.errorCode}`,type:'danger'});
					}
				}
			})

			this.todos = this.active;
		},
	}
}
