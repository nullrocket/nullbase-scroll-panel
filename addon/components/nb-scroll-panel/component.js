import Ember from 'ember';
import Scroller from '../../util/scroller/scroller';
import {addResizeListener, removeResizeListener} from '../../util/scroller/resize-listener';
import layout from './template';

var $ = Ember.$;


// TODO: Move this to utils for the theme service
var wheelDistance = function ( evt ) {
  if ( !evt ) {
    evt = event;
  }
  var w = evt.originalEvent.wheelDelta, d = evt.originalEvent.detail;
  if ( d ) {
    if ( w ) {
      return w / d / 40 * d > 0 ? 1 : -1;
    }// Opera
    else {
      return -d / 3;
    }             // Firefox;         TODO: do not /3 for OS X
  }
  else {
    return w / 120;
  }            // IE/Safari/Chrome TODO: /3 for Chrome OS X
};


function makeRAFJS(  contentElement, scrollLeft, scrollTop, scrollKnob, pos ,hasScrollBar) {
  return function () {

    contentElement.style[ "transform" ] = 'translate3d(' + -(scrollLeft) + 'px, ' + -(scrollTop) + 'px, 0)';
    if ( hasScrollBar ) {
      scrollKnob.get(0).style[ "transform" ] = 'translate3d(0px, ' + pos + 'px, 0)';
    }
  };
}





export default Ember.Component.extend({
  layout,
  gestures: Ember.inject.service(),
  tagName: 'div',

  unfilteredItems: [],
  classNames: [ '' ],
  classNameBindings: [ 'useNativeScroll:scroll-frame-mobile:scroll-frame' ],
  useNativeScroll: false,

  height: 0,
  width: 0,
  scrollTop: 0,
  scrollingX: true,
  scrollingY: true,
  animating: true,
  animationDuration: 250,
  bouncing: true,
  locking: true,
  paging: false,
  snapping: false,
  zooming: false,
  minZoom: 0.5,
  maxZoom: 3,
  contentProperty: "content",
  lastScrollPosition: 0,
  childViewClass: null,
  autoScrollBar: false,
  scrollBar: false,
  scrollBarElement: null,
  attributeBindings: [ 'tabindex' ],
  tabindex: 0,
  touchAction: Ember.computed('useNativeScroll', function () {
    return this.get('useNativeScroll') ? "" : "none";
  }),


  _down: null,
  _track: null,
  _up: null,

  useNativeScrollObserver: Ember.on('init', Ember.observer('useNativeScroll', function () {

    var self = this;
    let gestures = this.get('gestures');
    if ( this.get('useNativeScroll') === false ) {


      self.set('scrollBar', true);
      Ember.run.scheduleOnce('afterRender', function () {
        var xTop = self.$().scrollTop();
        var xLeft = self.$().scrollLeft();
        let contentElement =self.$('.scroll-panel-content')
        self.$().scrollTop(0);
        self.$().scrollLeft(0);
        contentElement.scrollTop(0);
        contentElement.scrollLeft(0);
        var scrollKnob = self.$('.ember-list-view-scrollbar-knob');


        var render = function ( scrollLeft, scrollTop /*, zoom*/ ) {
          if ( !self.get('isDestroyed')) {
//            self.set('scrollTop', scrollTop);
            var contentHeight = contentElement.height();
            var viewPortHeight = self.get('height');

            var pos = Math.max(0, (scrollTop ) / ((contentHeight - viewPortHeight) / (viewPortHeight - scrollKnob.height())));
            pos = Math.min(pos, (viewPortHeight - scrollKnob.height()),viewPortHeight);
            var raf = makeRAFJS(contentElement.get(0), scrollLeft, scrollTop, scrollKnob, pos,self.get('scrollBar'));
            window.requestAnimationFrame(raf);
          }

        };


        var scroller = new Scroller(render, {
          scrollingX: self.get('scrollingX'),
          scrollingY: self.get('scrollingY'),
          animating: self.get('animating'),
          animationDuration: self.get('animationDuration'),
          bouncing: self.get('bouncing'),
          locking: self.get('locking'),
          paging: self.get('paging'),
          snapping: self.get('snapping'),
          zooming: self.get('zooming'),
          minZoom: self.get('minZom'),
          maxZoom: self.get('maxZoom'),
          rollingX: self.get('rollingX')
        });

        self.set('scroller', scroller);
        self.set('scrollBarElement', self.$('.ember-list-view-scrollbar'));

        self.adjustLayout();
        scroller.scrollTo(xLeft, xTop);
        var $elementC = contentElement;
        var elementC = $elementC.get(0);


        var mousedown = false;


        self._down = function ( e ) {


          if ( self && scroller && !mousedown ) {

            if ( e.target.tagName.match(/input|textarea|select/i) ) {
              return;
            }

            scroller.doTouchStart([
              {
                pageX: e.pageX,
                pageY: e.pageY
              }
            ], window.performance.now());


            mousedown = true;
          }
        };

        gestures.addEventListener(elementC, 'down', self._down);


        self._track = function ( e ) {

          if ( self && scroller ) {

            if ( !mousedown ) {

              return;
            }

            scroller.doTouchMove([
              {
                pageX: e.pageX,
                pageY: e.pageY
              }
            ], window.performance.now());

            mousedown = true;
          }
        };
        gestures.addEventListener(elementC, 'track', self._track);


        self._up = function ( /*e*/ ) {

          if ( self && scroller ) {
            if ( !mousedown ) {
              return;
            }

            scroller.doTouchEnd(window.performance.now());

            mousedown = false;
          }
          else {

          }
        };
        gestures.addEventListener(document, 'trackend', self._up);


        $elementC.on("mousewheel DOMMouseScroll", function ( event ) {
        console.log('mouse scroll')
          event.preventDefault();
          event.stopPropagation();
          var delta = -wheelDistance(event);

          var finalScroll = parseInt(scroller.getValues().top) + parseInt(delta * 100);

          if ( -finalScroll > 0 ) {
            finalScroll = 0;
          }
      console.log('going to set final scroll: ',Math.abs(finalScroll) > $elementC.height() - self.get('height'));

          if ( Math.abs(finalScroll) > $elementC.height() - self.get('height') ) {
            finalScroll = ($elementC.height() - self.get('height'));
            console.log('finalScroll');
          }
console.log('scroller final scroll',finalScroll);
          scroller.scrollTo(scroller.getValues().left, finalScroll);

          if ( Math.abs(self.get('lastScrollPosition') - finalScroll) > 50 ) {
            console.log('in here?')
            self.set('scrollTop', finalScroll);
            self.set('lastScrollPosition', finalScroll);
          }


        });

      });

    }
    // remove javascript scrolling and set up native scrolling.

    else {

      self.set('scrollBar', false);
      if ( this.get('scroller') ) {
        delete   self.get('scroller').__callback;
        self.set('scroller', null);
      }
      Ember.run.scheduleOnce('afterRender', function () {
        if ( self.$('.scroll-panel-content').get(0) ) {
          self.$('.scroll-panel-content').get(0).style[ "transform" ] = 'translate3d(0px, 0px, 0)';

        }
      });

    }


  }))/*.on('init')*/,


  updateItems: Ember.observer("width", "height", 'contentHeight', 'contentWidth', function () {
    var self = this;

    if ( self.get('scrollBar') ) {

      //    width = $(this.get('element')).width($(this.get('element')).parent().width() - 30).width();


      if ( self.$().height() >= self.$('.scroll-panel-content').height() ) {
        self.$('.scroll-panel-content').parent().addClass('hide-scrollbars');
      }
      else {
        self.$('.scroll-panel-content').parent().removeClass('hide-scrollbars');
      }

    }
    else {
      //     width = $(this.get('element')).parent().width();
    }
    if ( self.get('scroller') ) {


      self.get('scroller').setDimensions(this.get('width'), this.get('height'), self.$('.scroll-panel-content').width(), self.$('.scroll-panel-content').height());
    }


  }),


  setupScrollBar: Ember.observer('scrollBarElement', function () {
    let gestures = this.get('gestures');
    var self = this;

    if ( self.get('scrollBar') && self.get("scrollBarElement").length > 0 ) {


      self._scrollDown = function ( e ) {
        // Don't react if initial down happens on a form element
        var actualScale = (self.get('scrollBarElement').height() - self.$('.ember-list-view-scrollbar-knob').height()) / self.get('scrollBarElement').height();

        var rect = e.target.getBoundingClientRect();
        //var offsetX = e.clientX - rect.left;
        self.get('scrollBarElement').addClass('down');

        var offsetY = (e.clientY - rect.top);

        offsetY = offsetY / actualScale;

        offsetY = offsetY - (self.$('.ember-list-view-scrollbar-knob').height() / 2);
        self.get('scroller').scrollTo(0, (offsetY * (self.$('.scroll-panel-content').height() - self.get('height')) / self.$('.ember-list-view-scroll-rail').height()), false);
      };
      gestures.addEventListener(self.get('scrollBarElement').get(0), 'down', self._scrollDown);
      self._scrollTrack = function ( e ) {
        // Don't react if initial down happens on a form element
        var actualScale = (self.get('scrollBarElement').height() - self.$('.ember-list-view-scrollbar-knob').height()) / self.get('scrollBarElement').height();

        var rect = e.target.getBoundingClientRect();
        //var offsetX = e.clientX - rect.left;
        self.get('scrollBarElement').addClass('down');

        var offsetY = (e.clientY - rect.top);

        offsetY = offsetY / actualScale;

        offsetY = offsetY - (self.$('.ember-list-view-scrollbar-knob').height() / 2);
        self.get('scroller').scrollTo(0, (offsetY * (self.$('.scroll-panel-content').height() - self.get('height')) / self.$('.ember-list-view-scroll-rail').height()), false);
      };
      gestures.addEventListener(self.get('scrollBarElement').get(0), 'track', self._scrollTrack);
      self._scrollUp = function () {
        if ( self.get('scrollBarElement') ) {
          self.get('scrollBarElement').removeClass('down');
        }
      };
      gestures.addEventListener(document, 'up', self._scrollUp);

    }


  }),

  _scrollDown: null,
  _scrollTrack: null,
  _scrollUp: null,


  adjustLayout: function () {

    if ( !this.get('isDestroyed') ) {
      var $element = this.$();
      this.beginPropertyChanges();
      this.set('height', $element.height());
      this.set('width', $element.width());
      this.set('contentHeight', this.$('.scroll-panel-content').outerHeight());
      this.set('contentWidth', this.$('.scroll-panel-content').outerWidth());
      this.endPropertyChanges();
    }

  },


  willDestroyElement: function () {

    var self = this;
    let gestures = this.get('gestures');
    $(window).off('resize.virtual-list.' + Ember.guidFor(self));

    removeResizeListener(this.get('element'), this._resizeListener);
    removeResizeListener(this.$('.scroll-panel-content').get(0), this._resizeListener);
    this._super();
    this.set('updates', null);
    this.$().off("mousewheel");
    this.$().off("DOMMouseScroll");
    this.$().off("keydown");
    gestures.removeEventListener(this.get('element'), 'down', this._down);
    gestures.removeEventListener(this.get('element'), 'track', this._track);
    gestures.removeEventListener(document, 'up', this._up);


  },


  scroller: null,
  adjustIntervalHandle: 0,
  _resizeListener: null,
  _lastSelected: null,
  didReceiveAttrs() {
    this._super(...arguments);
    if ( this.get('scroller') ) {
      console.log(this.get('scroller'));
      console.log(this.get('scroller').options);
      let scroller = this.get('scroller');
      scroller.options.scrollingX = this.get('scrollingX');
      scroller.options.scrollingY = this.get('scrollingY');
      scroller.options.animating = this.get('animating');
      scroller.options.animationDuration = this.get('animationDuration');
      scroller.options.bouncing = this.get('bouncing');
      scroller.options.locking = this.get('locking');
      scroller.options.paging = this.get('paging');
      scroller.options.snapping = this.get('snapping');
      scroller.options.zooming = this.get('zooming');
      scroller.options.minZoom = this.get('minZoom');
      scroller.options.maxZoom = this.get('maxZoom');


    }
  },
  didInsertElement: function () {

    this._super();
    var self = this;
    var $element = this.$();

    $(window).on('resize.virtual-list.' + Ember.guidFor(self), self.adjustLayout.bind(this));

    Ember.run.scheduleOnce('afterRender', function () {

      self.adjustLayout();
    });
    this._resizeListener = function () {

      if ( $element.is(':visible') ) {

        self.adjustLayout();
      }


    };
    var inView = function ( e, isInView ) {

      if ( isInView ) {
        self._resizeListener();
      }

      // $(self.get('element')).unbind('inview',inView);
    };
    $(this.get('element')).bind('inview', inView);
    addResizeListener($('.scroll-panel-content', self.get('element')).get(0), this._resizeListener);
    addResizeListener(self.get('element'), this._resizeListener);


    $(this.get('element')).on('focusin', function ( e ) {
      if ( !self.get('useNativeScroll') ) {
        $(self.get('element')).scrollTop(0);
        $('.scroll-panel-content', self.get('element')).scrollTop(0);
        var targetRect = e.target.getBoundingClientRect();
        var thisRect = self.get('element').getBoundingClientRect();

        if ( targetRect.bottom + 20 > thisRect.bottom ) {

          self.get('scroller').scrollTo(0, targetRect.bottom - thisRect.bottom + self.get('scroller').getValues().top + 20);
        }

        if ( targetRect.top - 20 < thisRect.top ) {

          self.get('scroller').scrollTo(0, (targetRect.top + self.get('scroller').getValues().top) - thisRect.top - 20);
        }
      }


    });

  },
  actions: {}

});

