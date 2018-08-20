require([
  "esri/WebScene",
  "esri/views/SceneView",
  "app/syncUtil"
], function (WebScene, SceneView, syncUtil) {

  var params = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    params[key] = value;
  });

  var webscene = params["webscene"] || "19dcff93eeb64f208d09d328656dd492";
  var websceneTop = new WebScene({ portalItem: { id: webscene }});
  var websceneBottom = new WebScene({ portalItem: { id: webscene }});


  var viewTop = new SceneView({
    container: "viewTop",
    map: websceneTop,
    environment: {
      lighting: {
        directShadowsEnabled: true,
        ambientOcclusionEnabled: false
      }
    }
  });

  var viewBottom = new SceneView({
    container: "viewBottom",
    map: websceneBottom,
    environment: {
      lighting: {
        directShadowsEnabled: true,
        ambientOcclusionEnabled: false
      }
    }
  });

  var mc = viewTop.resourceController._memoryController;
  mc.disableMemCache();

  // Clear the top-left corner to make place for the title
  viewTop.ui.empty("top-left");
  viewBottom.ui.empty("top-left");

  // synchronize the two views
  syncUtil.syncViews(viewTop, viewBottom);

  mc = viewBottom.resourceController._memoryController
  viewBottom.resourceController.memoryEvents.on("memory-used", function()  {
    document.getElementById("stats").innerHTML = "Memory: " + (mc._memoryUsed * mc._maxMemory).toFixed() + "MB<br>"+
      "Cache: " + (mc._cacheStorage._size / 1048576).toFixed() + "MB<br>"+
      "Hit Rate: " + Math.round(100 * mc._cacheStorage._getHitRate()) + "%";
  });
});
