var app = app || {};

app.vent = _.extend({}, Backbone.Events);

// Overall AppView
app.AppView = Backbone.View.extend({
	el: 'body',

	events: {
		'click .hamburger-icon' : 'toggleSidebar',
	},

	// Listens for events and calls functions for AJAX request,
	// adding daily journal list items, and adding edit journal view.
	initialize: function() {
		this.$welcomeMessage = this.$('.journal-info').html();
		this.$('.food-entry-header').hide();

		this.listenTo(app.journals, 'add', this.addDateEntry);

		app.vent.on('editJournal', this.showJournal, this);
		app.vent.on('foodQuery', this.foodQuery, this);
		app.vent.on('createEntryView', this.createEntryView, this);
		app.vent.on('showWelcomeMessage', this.showWelcomeMessage, this);
		app.vent.on('toggleHeader', this.toggleFoodEntryHeader, this);

		app.journals.fetch();

		// Initiates ajax start and stop event callbacks.
		$(document).ajaxStart(function() {
			app.vent.trigger('toggleSpinner');
		});

		$(document).ajaxStop(function() {
			app.vent.trigger('toggleSpinner');
		});

		// Calls function for reducing welcome message size for screens where
		// sliding sidebar functionality has been added
		if ($(window).width() < 950) {
			this.toggleWelcomeMessageSize();
		}

		// Calls function for toggling sidebar to closed for smaller media devices
		if($(window).width() < 500) {
			this.toggleSidebar();
		}
	},

	// Creates a new list item view and appends it to DOM based on
	// its index in collection
	addDateEntry: function(date) {
		var index = date.collection.indexOf(date);
		var currentListLength = this.$('.date-list').children().length;
		var view = new app.ListView({model: date});

		if ((currentListLength) && (currentListLength > index)) {
			this.$('.date-list li').eq(index).before(view.render().el);
		} else {
			this.$('.date-list').append(view.render().el);
		}
	},

	// Creates and renders a new journal edit view
	showJournal: function(journal) {
		var newJournal = new app.JournalView({model: journal});
		this.$('.journal-info').html(newJournal.render().el);
		this.toggleFoodEntryHeader();
	},

	// Parse AJAX results to form HTML string of list item.
	// Save results to local storage for later retrieval of details
	// of selected item(s).
	addResults: function(data) {
		var parsedResult, calories, brandName, serving;
		var results = [];

		app.vent.trigger('updateSearch');

		$.each(data.hits, function(index, item) {
			if (item.fields.brand_name === 'USDA') {
				brandName = '';
				serving = '';
			} else {
				brandName = item.fields.brand_name;
				serving = ' - ' + item.fields.nf_serving_size_qty +
				 ' ' + item.fields.nf_serving_size_unit;
			}

			parsedResult = brandName + ' ' + item.fields.item_name +
				serving;
			calories = item.fields.nf_calories;

			var result = new app.SearchView();
			$('.search-results').append(result.render(parsedResult).el);

			results.push({foodName: parsedResult, calories: calories});
		});

		if (results.length === 0) {
			app.vent.trigger('noResultsFound');
		}

		localStorage.setItem('results', JSON.stringify(results));
	},

	// AJAX function with done and fail callbacks.
	// Uses JQuery ajaxStart function to trigger event for loading spinner display
	foodQuery: function(query) {
		var triggerObject = {};
		_.extend(triggerObject, Backbone.Events);
		triggerObject.bind('addResults', this.addResults, this);

		var nutritionixURL = 'https://api.nutritionix.com/v1_1/search/' + query +
		'?fields=item_name%2Cbrand_name%2Cnf_calories&appId=6962db3c&appKey=' +
		'304283206c5423bc90fada2876453cc7';

		$.ajax({
			url: nutritionixURL
		})
		.done(function(data) {
			triggerObject.trigger('addResults', data);
		})
		.fail(function() {
			app.vent.trigger('ajaxFail');
		});
	},

	// Creates and appends view for individual food entry list items
	createEntryView: function(entry) {
		this.toggleFoodEntryHeader();
		var newEntry = new app.EntryView({model: entry});
		this.$('.food-list').prepend(newEntry.render().el);
	},

	// Shows welcome message when journal is deleted
	showWelcomeMessage: function() {
		this.$('.food-entry-header').hide();
		this.$('.journal-info').html(this.$welcomeMessage);
		this.toggleWelcomeMessageSize();
	},

	// Shows food entry header if food entry list items are in DOM
	toggleFoodEntryHeader: function() {
		setTimeout(function() {
			if (this.$('.food-list').children().length) {
				this.$('.food-entry-header').show();
			} else {
				this.$('.food-entry-header').hide();
			}
		}, 20);
	},

	// Handles sliding sidebar mobile functionality
	toggleSidebar: function() {
		this.$('.sidebar').toggleClass('hidden');
		this.toggleWelcomeMessageSize();
	},

	// Reduces size of welcome message when sidebar is visible
	// on medium-sized media devices
	toggleWelcomeMessageSize: function() {
		if (this.$('.sidebar').hasClass('hidden')) {
			this.$('.welcome-message').removeClass('reduce-size');
		} else {
			if (($(window).width() < 950) && ($(window).width() > 500)) {
				this.$('.welcome-message').addClass('reduce-size');
			}
		}
	}
});