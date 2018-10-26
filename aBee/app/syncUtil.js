// small utility for synchronizing tabs through a broadcast channel
// based on code from sample: https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=views-synchronize

define(["esri/Viewpoint", "esri/core/watchUtils"], function(Viewpoint, watchUtils) {
  return {
    syncView: function(view) {
      var channel = new BroadcastChannel('aBee.view.sync');

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
        view.viewpoint = Viewpoint.fromJSON(newValue.data);
      }
    }
  }
});
