window.todoStore = {
	todos: JSON.parse(localStorage.getItem('todo-store') || '[]'),

	save() {
		//if (!window.indexedDB) {
			localStorage.setItem('todo-store', JSON.stringify(this.todos));
		/*} else {

		}*/
	},
}

window.DB_NAME = 'demo-indexeddb-todos';
window.DB_VERSION = 3;
window.DB_STORE_NAME = 'todos';
window.db = null;

window.todos = function () {

	return {
		...todoStore,

		newTodo: '',

		editedTodo: null,

		filter: 'all',

		//db:null,

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

		openDB() {
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
				//displayActionSuccess();
				//displayPubList(store);
			};
			req.onerror = function() {
				console.error("addPublication error", this.error);
				//displayActionFailure(this.error);
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

			this.save();
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
