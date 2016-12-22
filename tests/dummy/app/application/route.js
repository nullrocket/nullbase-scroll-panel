import Ember from 'ember';

export default Ember.Route.extend({

  appState: Ember.inject.service('app-state'),
  actions: {
    toggleLeftSidebar(){
      this.set('appState.isLeftSidebarOpen', !this.get('appState.isLeftSidebarOpen'));
    },
    toggleRightSidebar(){
      this.set('appState.isRightSidebarOpen', !this.get('appState.isRightSidebarOpen'));
    },
    toggleScrollingX(){
      this.set('appState.scrollingX', !this.get('appState.scrollingX'));
    },
    toggleScrollingY(){
      this.set('appState.scrollingY', !this.get('appState.scrollingY'));
    },
    toggleAnimating(){
      this.set('appState.animating', !this.get('appState.animating'));
    },
    toggleBouncing(){
      this.set('appState.bouncing', !this.get('appState.bouncing'));
    },
    toggleLocking(){
      this.set('appState.locking', !this.get('appState.locking'));
    },
    togglePaging(){
      this.set('appState.paging', !this.get('appState.paging'));
    },
    toggleZooming(){
      this.set('appState.zooming', !this.get('appState.zooming'));
    },
    toggleUseNativeScroll(){
      this.set('appState.useNativeScroll', !this.get('appState.useNativeScroll'));
    }
  },
  renderTemplate(){
    console.log('application route');
    this._super(...arguments);
  /*  this.render('dummy-sidebar', {
      outlet: 'left-sidebar',
      into: 'application'
    });*/
    this.render('content', {
      outlet: 'content',
      into: 'application'
    });
    this.render('header', {
      outlet: "header-content",
      into: 'application'
    });
    /*this.render('dummy-right-sidebar', {
      outlet: 'right-sidebar',
      into: 'application'
    });

    var self = this;

    this.render('nested-header-content', {
      outlet: "another-header-content",
      into: 'dummy-content'
    });
    this.render('nested-right-sidebar-content', {
      outlet: "right-sidebar",
      into: 'dummy-content'
    });

    this.render('nested-left-sidebar-content', {
      outlet: "left-sidebar",
      into: 'dummy-content'
    });
    this.render('nested-content', {
      outlet: "content",
      into: 'dummy-content'
    });*/
  }
});
