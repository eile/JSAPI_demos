require([
  "dojo/has",
  "esri/WebScene",
  "esri/views/SceneView",
  "app/syncUtil"
], function (has, WebScene, SceneView, syncUtil) {

  var params = {};
  var parts = window.parent.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    params[key] = value;
  });

  has.add("disable-feature:single-idb-cache", 1);

  var webscene = params["webscene"] || "19dcff93eeb64f208d09d328656dd492";
  var webscene = new WebScene({ portalItem: { id: webscene }});
  var view = new SceneView({
    container: "view",
    map: webscene,
    environment: {
      lighting: {
        directShadowsEnabled: true,
        ambientOcclusionEnabled: false
      }
    }
  });

  // Clear the top-left corner to make place for the title
  view.ui.empty("top-left");

  // synchronize the two views
  syncUtil.syncView(view);

  mc = view.resourceController._memoryController
  view.resourceController.memoryEvents.on("memory-used", function()  {
    document.getElementById("stats").innerHTML = 
      "Memory: " + (mc._memoryUsed * mc._maxMemory).toFixed() + " of " + mc._maxMemory.toFixed() + "MB<br>"+
      "Cache: " + (mc._cacheStorage._size / 1048576).toFixed() + " of " + (mc._cacheStorage._maxSize / 1048576).toFixed() + "MB<br>"+
      "Hit Rate: " + Math.round(100 * mc._cacheStorage._getHitRate()) + "%";
  });
});
