export default {
  async init() {
    await qry_GetAssetById.run();
    AssetState.oldStatus = qry_GetAssetById.data[0].status_id;
  },
  async changeStatus() {
    await qry_UpdateAssetStatus.run();
    await InsertAssetAuditLog.run();
    AssetState.oldStatus = qry_GetAssetById.data[0].status_id;
    await GetAssetAuditLog.run();
  }
}