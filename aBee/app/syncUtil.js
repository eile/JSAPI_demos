// small utility for synchronizing tabs through a broadcast channel
// based on code from sample: https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=views-synchronize

define(["esri/Viewpoint", "esri/core/watchUtils"], function(Viewpoint, watchUtils) {
  var channel;

  return {
    syncView: function(view) {
      channel = new BroadcastChannel('aBee.view.sync');

      var viewpointWatchHandle;
      var interactWatcher;
      var scheduleId;
  
      function clear() {
        viewpointWatchHandle && viewpointWatchHandle.remove();
        viewStationaryHandle && viewStationaryHandle.remove();
        scheduleId && clearTimeout(scheduleId);
        viewpointWatchHandle = viewStationaryHandle = scheduleId = null;
      }
  
      interactWatcher = view.watch('interacting,animation', function(newValue) {
        if (!newValue) {
          return;
        }
  
        if (viewpointWatchHandle || scheduleId) {
          return;
        }
  
        scheduleId = setTimeout(function() {
          scheduleId = null;
          viewpointWatchHandle = view.watch('viewpoint',
            function(newValue) {
              channel.postMessage(newValue.toJSON());
            });
        }, 0);
  
        viewStationaryHandle = watchUtils.whenTrue(view,
          'stationary', clear);
  
      });
  
      channel.onmessage = function (newValue) {
        if (newValue.data.slide) {
          view.map.presentation.slides.forEach(function(slide) {
            if (slide.id === newValue.data.slide) {
              var slideNoViewpoint = slide.clone();
              slideNoViewpoint.viewpoint = null;
              slideNoViewpoint.applyTo(view);
            }
          });
        } else {
          view.viewpoint = Viewpoint.fromJSON(newValue.data);
        }
      }
    },

    syncSlide: function(slideId) {
      channel.postMessage({slide: slideId});
    }
  }
});
