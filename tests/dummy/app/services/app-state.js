import Ember from 'ember';

export default Ember.Service.extend({
  isLeftSidebarOpen:true,
  isRightSidebarOpen:false,
  scrollingX :true,
scrollingY : true,
animating : true,
bouncing : true,
locking : false,
paging : false,
snapping : false,
zooming : false,
  useNativeScroll:false

});
