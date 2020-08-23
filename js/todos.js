window.todos = function () {

	return {
		todos: [],

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

		addTodo() {
			if(!this.newTodo) {
				return;
			}

			this.todos.push({
				id: Date.now(),
				body: this.newTodo,
				completed: false,
			});
			this.newTodo = '';
		},

		deleteTodo(todo) {
			let position = this.todos.indexOf(todo);
			this.todos.splice(position,1);
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

			this.todos.forEach( todo => todo.completed = !allComplete);
		}
	}

}
