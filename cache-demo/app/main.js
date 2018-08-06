require([
  "esri/WebScene",
  "esri/views/SceneView",
  "app/syncUtil"
], function (WebScene, SceneView, syncUtil) {

  var websceneTop = new WebScene({
   portalItem: {
     id: "19dcff93eeb64f208d09d328656dd492"
   }
  });

  var websceneBottom = new WebScene({
    portalItem: {
      id: "19dcff93eeb64f208d09d328656dd492"
    }
  });

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

  viewTop.resourceController._memoryController.disableMemCache();

  // Clear the top-left corner to make place for the title
  viewTop.ui.empty("top-left");
  viewBottom.ui.empty("top-left");

  // synchronize the two views
  syncUtil.syncViews(viewTop, viewBottom);

});
