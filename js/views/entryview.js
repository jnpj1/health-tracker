var app = app || {};

// Individual food entry list item view
app.EntryView = Backbone.View.extend({
	tagName: 'li',

	template: _.template($('#entry-template').html()),

	events: {
		'click .entry-remove' : 'deleteEntry'
	},

	// Initializes with listener for model destruction
	initialize: function() {
		this.listenTo(this.model, 'destroy', this.deleteView);
	},

	// Renders template with model attributes
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;
	},

	// Destroys model and triggers delete entry event
	deleteEntry: function() {
		app.vent.trigger('deleteEntry', this.model.get('calories'));
		this.model.destroy();
	},

	// Removes view item
	deleteView: function() {
		this.remove();
	}
});