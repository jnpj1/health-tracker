var app = app || {};

// View for detailed Journal information display
app.JournalView = Backbone.View.extend({
	template: _.template($('#journal-template').html()),

	events: {
		'input #food-input' : 'foodQuery',
		'click .custom-button' : 'toggleCustomForm',
		'submit .custom-entry-form' : 'addCustomEntry',
		'blur .custom-entry-form' : 'checkCustomFocus'
	},

	// Listens to changes in model and updates view.
	// Triggers function callbacks on custom events to update
	// model and remove views as appropriate.
	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'remove', this.removeJournal);

		app.vent.on('addFoodEntry', this.addFoodEntry, this);
		app.vent.on('removeJournal', this.removeJournal, this);
		app.vent.on('deleteEntry', this.deleteFoodEntry, this);
		app.vent.on('toggleForm', this.toggleCustomForm, this);
		app.vent.on('ajaxFail', this.displayFailure, this);
		app.vent.on('noResultsFound', this.displayNoResultsMessage, this);
		app.vent.on('toggleSpinner', this.toggleSpinner, this);
		app.vent.on('checkJournalDisplay', this.checkJournalDisplay, this);

		// Calls function for adding food entry views if any food
		// entries currently exist in model.
		if (this.model.get('entryNumber')){
			this.addAllFoodEntries(this.model.get('entryNumber'));
		} else {
			app.vent.trigger('removeJournalEntries');
		}
	},

	// Renders template with model attributes.
	// Hides custom entry form and spinner.
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		this.$('.custom-entry-form').hide();
		this.$('.spinner').hide();
		return this;
	},

	// Triggers custom event when input changes and passes current input value
	// Removes any existing error messages
	foodQuery: function() {
		var foodValue = this.$('#food-input').val();
		this.removeErrorMessage();

		if (foodValue){
			app.vent.trigger('foodQuery', foodValue);
		}
	},

	// Updates model with information from selected food item
	addFoodEntry: function(index) {
		var selectedResult = JSON.parse(localStorage.getItem('results'));
		var foodName = selectedResult[index].foodName;
		var calories = selectedResult[index].calories;
		this.model.appendFoodEntry(foodName, calories);
		var entryNumber = this.model.get('entryNumber');
		var entryString = 'entry' + entryNumber.toString();
		var entryModel = this.model.get(entryString);
		app.vent.trigger('createEntryView', entryModel);
	},

	// Calls model function to recalculate total calorie count
	deleteFoodEntry: function(food) {
		this.model.recalculateCalories(food.calories);
		this.model.deleteFoodEntry(food.entryNumber);
	},

	// Removes view when currently selected journal is removed from collection
	// or when another journal is selected for display.
	// Triggers events to remove entries and to toggle welcome message and
	// food entry header.
	removeJournal: function(model) {
		app.vent.trigger('removeJournalEntries');
		app.vent.trigger('toggleHeader');
		app.vent.trigger('showWelcomeMessage');
		app.vent.off('addFoodEntry', this.addFoodEntry, this);
		app.vent.off('removeJournal', this.removeJournal, this);
		app.vent.off('deleteEntry', this.deleteFoodEntry, this);
		app.vent.off('toggleForm', this.toggleCustomForm, this);
		app.vent.off('ajaxFail', this.displayFailure, this);
		app.vent.off('noResultsFound', this.displayNoResultsMessage, this);
		app.vent.off('toggleSpinner', this.toggleSpinner, this);
		app.vent.off('checkJournalDisplay', this.checkJournalDisplay, this);
		this.remove();
	},

	// Toggles display of custom entry form
	toggleCustomForm: function() {
		this.$('.custom-entry-form').toggle();
	},

	// Adds entry for customized input after validation of description and calories.
	// Calls functions for appending entry to DOM and hiding custom form.
	addCustomEntry: function(event) {
		event.preventDefault();

		var customName = this.$('#description-input').val();
		var customCalories = this.$('#calorie-input').val();

		if (!customName && !customCalories) {
			alert('Please enter the name and calorie count of the food item');
		} else if (!customName) {
			alert('Please enter the name of the food item');
		} else if (!customCalories) {
			alert('Please enter the calorie count of the food item');
		} else if(isNaN(customCalories)) {
			alert('Please enter a number for calorie count');
		} else {
			this.model.appendFoodEntry(customName, customCalories);
			var customEntryNumber = this.model.get('entryNumber');
			var customEntryString = 'entry' + customEntryNumber.toString();
			var customEntryModel = this.model.get(customEntryString);
			app.vent.trigger('createEntryView', customEntryModel);
			this.toggleCustomForm();
		}
	},

	// When focus on an input is lost, checks if focus is on another form element.
	// If focus is no longer on any form elements, triggers an event to hide form.
	checkCustomFocus: function(event) {
		setTimeout(function() {
			var $form = $(event.delegateTarget).find('.custom-entry-form');
			var id = '#' + $(document.activeElement).attr('id');
			if (!$form.has(id).length) {
            	app.vent.trigger('toggleForm');
        	}
		}, 0);
	},

	// Display an error message upon ajax failure
	displayFailure: function() {
		var failureHTML = '<li class="search-failure">Unable to load' +
			'Nutritionix results</li>';
		this.$('.search-results').html(failureHTML);
	},

	// Display an error message if no results are found for a query
	displayNoResultsMessage: function() {
		var noResultsHTML = '<li class="no-results">No results found</li>';
		this.$('.search-results').html(noResultsHTML);
	},

	// Removes any displayed error messages
	removeErrorMessage: function() {
		if (this.$('.search-failure').length) {
			this.$('.search-failure').remove();
		}

		if (this.$('.no-results').length) {
			this.$('.no-results').remove();
		}
	},

	// Toggle visibility of spinner
	toggleSpinner: function() {
		this.$('.spinner').toggle();
	},

	// Loops through existing entries and triggers event to render food item view
	addAllFoodEntries: function(number) {
		for (var i = 1; i <= number; i++) {
			var currentEntry = 'entry' + i.toString();
			if (this.model.get(currentEntry)) {
				app.vent.trigger('createEntryView', this.model.get(currentEntry));
			}
		}
	}
});