export default {
  oldStatus: null,
  init() {
    this.oldStatus = qry_GetAssetById.data[0]?.status_id ?? null;
  }
}