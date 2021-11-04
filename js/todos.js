window.todoStore = {
	todos: JSON.parse(localStorage.getItem('todo-store') || '[]'),

	save() {
		if (!window.indexedDB) {
			localStorage.setItem('todo-store', JSON.stringify(this.todos));
		} else {

		}
	}
}

window.DB_NAME = 'demo-indexeddb-todos';
window.DB_VERSION = 1; // Use a long long for this value (don't use a float)
window.DB_STORE_NAME = 'todos';

window.todos = function () {

	return {
		...todoStore,

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

		openDB() {
			console.log('open db');
		},

		addTodo() {
			if(!this.newTodo) {
				return;
			}

			this.todos.push({
				id: Date.now(),
				body: this.newTodo,
				completed: false,
			});

			this.save();

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
