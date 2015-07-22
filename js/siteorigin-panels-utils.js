/**
 * Various utilities for Page Builder
 *
 * @copyright Greg Priday 2015 - <https://siteorigin.com/>
 * @license GPL 3.0 http://www.gnu.org/licenses/gpl.html
 */

/* global Backbone, _, jQuery, tinyMCE, soPanelsOptions, confirm */

( function( $, _, panelsOptions ){

    var panels = window.siteoriginPanels;

    panels.utils = {};

    /**
     * A contextual menu for right clicks
     */
    panels.utils.menu = Backbone.View.extend({
        wrapperTemplate: _.template( $('#siteorigin-panels-context-menu').html().panelsProcessTemplate() ),
        sectionTemplate: _.template( $('#siteorigin-panels-context-menu-section').html().panelsProcessTemplate() ),

        contexts: [],
        active: false,

        events : {
            'keyup .so-search-wrapper input' : 'searchKeyUp'
        },

        /**
         * Intialize the context menu
         */
        initialize: function(){
            this.listenContextMenu();
            this.render();
            this.attach();
        },

        listenContextMenu: function(){
            var thisView = this;

            $(window).on('contextmenu', function(e){
                if( thisView.active && !thisView.isOverEl( thisView.$el, e ) ) {
                    thisView.closeMenu();
                    thisView.active = false;
                    e.preventDefault();
                    return false;
                }

                if( thisView.active ) {
                    // Lets not double up on the context menu
                    return true;
                }

                thisView.active = false;

                // Other components should listen to activate_context
                thisView.trigger('activate_context', e, thisView);

                if( thisView.active ) {
                    // We don't want the default event to happen.
                    e.preventDefault();

                    thisView.openMenu( {
                        left: e.pageX,
                        top: e.pageY
                    } );
                }
            } );
        },

        render: function(){
            this.setElement( this.wrapperTemplate() );
        },

        attach: function(){
            this.$el.appendTo('body');
        },

        openMenu: function( position ){
            this.trigger('open_menu');

            // Start listening for situations when we should close the menu
            $(window).on('keyup', {menu: this}, this.keyboardListen);
            $(window).on('click', {menu: this}, this.clickOutsideListen);

            // Correct the left position
            if( position.left + this.$el.outerWidth() >= $(window).width() ) {
                position.left = $(window).width() - this.$el.outerWidth() - 10;
            }
            if( position.left <= 0 ) {
                position.left = 10;
            }

            // position the contextual menu
            this.$el.css({
                left: position.left + 1,
                top: position.top + 1
            }).show();
        },

        closeMenu: function(){
            this.trigger('close_menu');

            // Stop listening for situations when we should close the menu
            $(window).off('keyup', this.keyboardListen);
            $(window).off('click', this.clickOutsideListen);

            this.active = false;
            this.$el.empty().hide();
        },

        /**
         * Keyboard events handler
         */
        keyboardListen: function(e) {
            var menu = e.data.menu;
            if (e.which === 27) {
                menu.closeMenu();
            }
        },

        clickOutsideListen: function(e){
            var menu = e.data.menu;
            if( menu.$el.is(':visible') && !menu.isOverEl( menu.$el, e ) ) {
                menu.closeMenu();
            }
        },

        addSection: function( settings, items, callback ){
            var thisView = this;
            settings = _.extend( {
                display: 5,
                defaultDisplay: false,
                search: true,

                // All the labels
                sectionTitle : '',
                searchPlaceholder : '',

                // This is the key to be used in items for the title. Makes it easier to list objects
                titleKey : 'title'
            }, settings );

            // Create the new section
            var section = $( this.sectionTemplate( {
                settings: settings,
                items: items
            } ) );
            this.$el.append( section );

            section.find('.so-item').click( function(){
                var $$ = $(this);
                callback( $$.data('key') );
                thisView.closeMenu();
            } );

            section.data('settings', settings).find( '.so-search-wrapper input').trigger('keyup');

            this.active = true;
        },

        searchKeyUp: function(e){
            var
                $$ = $(e.currentTarget),
                section = $$.closest('.so-section'),
                settings = section.data('settings');

            if( $$.val() === '' ) {
                // We'll display the defaultDisplay items
                if( settings.defaultDisplay ) {
                    section.find('.so-item').hide();
                    for( var i = 0; i < settings.defaultDisplay.length; i++ ) {
                        section.find('.so-item[data-key="' + settings.defaultDisplay[i] + '"]').show();
                    }
                }
                else {
                    // We'll just display all the items
                    section.find('.so-item').show();
                }
            }
            else {
                section.find('.so-item').hide().each( function(){
                    var item = $(this);
                    if( item.html().toLowerCase().indexOf( $$.val().toLowerCase() ) !== -1 ) {
                        item.show();
                    }
                } );
            }

            // Now, we'll only show the first settings.display visible items
            section.find('.so-item:visible:gt(' + (settings.display - 1) + ')').hide();
        },

        /**
         * Check if the given mouse event is over the element
         * @param el
         * @param event
         */
        isOverEl: function(el, event) {
            var elPos = [
                [ el.offset().left, el.offset().top ],
                [ el.offset().left + el.outerWidth(), el.offset().top + el.outerHeight() ]
            ];

            // Return if this event is over the given element
            return (
                event.pageX >= elPos[0][0] && event.pageX <= elPos[1][0] &&
                event.pageY >= elPos[0][1] && event.pageY <= elPos[1][1]
            );
        }

    });

} )( jQuery, _, soPanelsOptions );