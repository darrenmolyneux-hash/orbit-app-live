export default {
  async init() {
    // Run the query
    const res = await qry_GetAssetById.run();

    // Make sure we actually got a row back
    if (res && Array.isArray(res) && res.length > 0) {
      AssetState.oldStatus = res[0].status;
      showAlert("Old status = " + AssetState.oldStatus);
    } else {
      AssetState.oldStatus = null;
      showAlert("No asset found in GetAssetById");
    }
  }
}
