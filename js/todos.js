window.DB_NAME = 'demo-indexeddb-todos';
window.DB_VERSION = 3;
window.DB_STORE_NAME = 'todos';
window.db = null;

window.todos = function () {

	return {
		todos: JSON.parse(localStorage.getItem('todo-store') || '[]'),

		save() {
			localStorage.setItem('todo-store', JSON.stringify(this.todos));
		},

		events: {},

		newTodo: '',

		editedTodo: null,

		filter: 'all',

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

		init() {
			console.log('openingDB');
			const req = indexedDB.open(window.DB_NAME, window.DB_VERSION);
			req.onsuccess = function (evt) {
				window.db = this.result;
				console.log("openingDB DONE");
			};
			req.onerror = function (evt) {
				console.error("openingDB error:", evt.target.errorCode);
			};

			req.onupgradeneeded = function (evt) {
				console.log("openDb.onupgradeneeded");
				const store = evt.currentTarget.result.createObjectStore(window.DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });

				store.createIndex('id', 'id', { unique: true });
				store.createIndex('body', 'body', { unique: false });
				store.createIndex('completed', 'completed', { unique: false });
			};
		},

		loadTodos() {

		},

		saveDB(todo) {
			const store = this.getObjectStore(window.DB_STORE_NAME, 'readwrite');
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
			const store = this.getObjectStore(window.DB_STORE_NAME, 'readwrite');
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
